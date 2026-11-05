/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ItemStack, PlayerState, Recipe } from '../types/game';
import { RECIPES, createItemStack } from '../engine/items';
import { soundEngine } from '../engine/audio';

export type InventoryMode = 'inventory' | 'crafting_table' | 'furnace' | 'chest';

interface InventoryModalProps {
  mode: InventoryMode;
  playerState: PlayerState;
  onUpdatePlayer: (updater: (prev: PlayerState) => PlayerState) => void;
  onClose: () => void;
  chestPos?: [number, number, number];
}

export const InventoryModal: React.FC<InventoryModalProps> = ({
  mode,
  playerState,
  onUpdatePlayer,
  onClose,
}) => {
  const [selectedHolding, setSelectedHolding] = useState<ItemStack | null>(null);
  const [holdingIndex, setHoldingIndex] = useState<number | null>(null);

  // Crafting grid: 2x2 or 3x3
  const is3x3 = mode === 'crafting_table';
  const gridDim = is3x3 ? 3 : 2;
  const [craftGrid, setCraftGrid] = useState<(ItemStack | null)[]>(new Array(gridDim * gridDim).fill(null));
  const [craftOutput, setCraftOutput] = useState<ItemStack | null>(null);

  // Furnace state
  const [furnaceInput, setFurnaceInput] = useState<ItemStack | null>(createItemStack('block:iron_ore', 8));
  const [furnaceFuel, setFurnaceFuel] = useState<ItemStack | null>(createItemStack('item:coal', 4));
  const [furnaceOutput, setFurnaceOutput] = useState<ItemStack | null>(null);
  const [furnaceProgress, setFurnaceProgress] = useState<number>(45); // Visual smelting percentage

  // Check recipes whenever crafting grid changes
  const updateCraftResult = (grid: (ItemStack | null)[]) => {
    // Collect non-empty items
    const nonNulls = grid.filter((item): item is ItemStack => item !== null);
    if (nonNulls.length === 0) {
      setCraftOutput(null);
      return;
    }

    // Match against known recipes
    for (const recipe of RECIPES) {
      if (recipe.ingredients) {
        // Shapeless match
        const matches = recipe.ingredients.every(req => {
          const found = nonNulls.find(n => n.id === req.id && n.count >= req.count);
          return !!found;
        });
        if (matches && nonNulls.length === recipe.ingredients.length) {
          setCraftOutput({ ...recipe.result });
          return;
        }
      }
    }
    setCraftOutput(null);
  };

  const handleCraftGridClick = (index: number) => {
    soundEngine.playClick();
    const nextGrid = [...craftGrid];
    if (selectedHolding) {
      // Place 1 or stack
      const existing = nextGrid[index];
      if (!existing) {
        nextGrid[index] = { ...selectedHolding, count: 1 };
        selectedHolding.count -= 1;
        if (selectedHolding.count <= 0) {
          setSelectedHolding(null);
          setHoldingIndex(null);
        }
      } else if (existing.id === selectedHolding.id) {
        existing.count += 1;
        selectedHolding.count -= 1;
        if (selectedHolding.count <= 0) {
          setSelectedHolding(null);
          setHoldingIndex(null);
        }
      }
    } else {
      // Pick up from grid
      if (nextGrid[index]) {
        setSelectedHolding(nextGrid[index]);
        nextGrid[index] = null;
      }
    }
    setCraftGrid(nextGrid);
    updateCraftResult(nextGrid);
  };

  const handleTakeCraftOutput = () => {
    if (!craftOutput) return;
    soundEngine.playItemPickup();

    // Consume 1 of each ingredient in grid
    const nextGrid = craftGrid.map(item => {
      if (!item) return null;
      const c = item.count - 1;
      return c > 0 ? { ...item, count: c } : null;
    });
    setCraftGrid(nextGrid);

    // Give crafted item to player
    onUpdatePlayer(prev => {
      const inv = [...prev.inventory];
      let remaining = craftOutput.count;
      for (let i = 0; i < 36; i++) {
        if (inv[i]?.id === craftOutput.id && inv[i]!.count < inv[i]!.maxStack) {
          inv[i]!.count += remaining;
          remaining = 0;
          break;
        }
      }
      if (remaining > 0) {
        for (let i = 0; i < 36; i++) {
          if (!inv[i]) {
            inv[i] = { ...craftOutput, count: remaining };
            break;
          }
        }
      }
      return { ...prev, inventory: inv };
    });

    updateCraftResult(nextGrid);
  };

  const handleSlotClick = (index: number) => {
    soundEngine.playClick();
    onUpdatePlayer(prev => {
      const inv = [...prev.inventory];
      const clicked = inv[index];

      if (selectedHolding) {
        if (!clicked) {
          inv[index] = selectedHolding;
          setSelectedHolding(null);
          setHoldingIndex(null);
        } else if (clicked.id === selectedHolding.id && clicked.count < clicked.maxStack) {
          const space = clicked.maxStack - clicked.count;
          const toAdd = Math.min(space, selectedHolding.count);
          clicked.count += toAdd;
          selectedHolding.count -= toAdd;
          if (selectedHolding.count <= 0) {
            setSelectedHolding(null);
            setHoldingIndex(null);
          }
        } else {
          // Swap
          inv[index] = selectedHolding;
          setSelectedHolding(clicked);
          setHoldingIndex(index);
        }
      } else {
        if (clicked) {
          setSelectedHolding(clicked);
          setHoldingIndex(index);
          inv[index] = null;
        }
      }
      return { ...prev, inventory: inv };
    });
  };

  const handleQuickCraft = (recipe: Recipe) => {
    soundEngine.playItemPickup();
    // Verify player has ingredients
    let canCraft = true;
    if (recipe.ingredients) {
      for (const req of recipe.ingredients) {
        const found = playerState.inventory.find(i => i?.id === req.id && i.count >= req.count);
        if (!found) {
          canCraft = false;
          break;
        }
      }
    }

    if (!canCraft && playerState.gameMode === 'survival') return;

    onUpdatePlayer(prev => {
      const inv = [...prev.inventory];
      // Deduct ingredients in survival
      if (recipe.ingredients && prev.gameMode === 'survival') {
        for (const req of recipe.ingredients) {
          let needed = req.count;
          for (let i = 0; i < 36; i++) {
            if (inv[i]?.id === req.id) {
              const take = Math.min(needed, inv[i]!.count);
              inv[i]!.count -= take;
              needed -= take;
              if (inv[i]!.count <= 0) inv[i] = null;
              if (needed <= 0) break;
            }
          }
        }
      }

      // Add result
      const res = { ...recipe.result };
      let remaining = res.count;
      for (let i = 0; i < 36; i++) {
        if (inv[i]?.id === res.id && inv[i]!.count < inv[i]!.maxStack) {
          inv[i]!.count += remaining;
          remaining = 0;
          break;
        }
      }
      if (remaining > 0) {
        for (let i = 0; i < 36; i++) {
          if (!inv[i]) {
            inv[i] = { ...res, count: remaining };
            break;
          }
        }
      }
      return { ...prev, inventory: inv };
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm select-none">
      <div className="relative bg-stone-900 border-4 border-stone-600 p-4 sm:p-6 shadow-2xl flex flex-col max-w-2xl w-full">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b-2 border-stone-700 mb-4">
          <h2
            className="text-sm sm:text-base font-bold text-white tracking-wider uppercase"
            style={{ fontFamily: "'Press Start 2P', monospace" }}
          >
            {mode === 'crafting_table' ? 'Crafting Table (3x3)' : mode === 'furnace' ? 'Furnace' : mode === 'chest' ? 'Large Chest' : 'Crafting & Inventory'}
          </h2>
          <button
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="text-stone-400 hover:text-white font-mono text-sm px-2 cursor-pointer font-bold"
          >
            ✕ Close
          </button>
        </div>

        {/* Top Section: Crafting Grid or Furnace / Chest */}
        <div className="flex flex-col sm:flex-row gap-6 mb-5 justify-between">
          {mode === 'furnace' ? (
            /* Furnace Smelting Interface */
            <div className="flex items-center gap-6 p-4 bg-stone-950 border-2 border-stone-800">
              <div className="flex flex-col gap-4">
                {/* Ore Input */}
                <div className="w-12 h-12 bg-stone-900 border-2 border-stone-700 flex items-center justify-center">
                  <span className="text-xs font-bold text-amber-200">
                    {furnaceInput?.name || 'Empty'}
                  </span>
                </div>
                {/* Fuel Flame */}
                <div className="text-center text-orange-400 font-bold text-sm animate-pulse">🔥</div>
                {/* Fuel Slot */}
                <div className="w-12 h-12 bg-stone-900 border-2 border-stone-700 flex items-center justify-center">
                  <span className="text-xs font-bold text-stone-300">
                    {furnaceFuel?.name || 'Coal'}
                  </span>
                </div>
              </div>

              {/* Progress Arrow */}
              <div className="text-2xl text-stone-400">➡️</div>

              {/* Result Slot */}
              <div className="w-14 h-14 bg-stone-900 border-2 border-amber-400 flex items-center justify-center">
                <span className="text-xs font-bold text-white">Iron Ingot</span>
              </div>
            </div>
          ) : (
            /* 2x2 or 3x3 Crafting Grid */
            <div className="flex items-center gap-4 p-3 bg-stone-950 border-2 border-stone-800">
              <div
                className="grid gap-1"
                style={{ gridTemplateColumns: `repeat(${gridDim}, minmax(0, 1fr))` }}
              >
                {craftGrid.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleCraftGridClick(idx)}
                    className="w-10 h-10 sm:w-11 sm:h-11 bg-stone-900 border-2 border-stone-700 hover:border-cyan-400 flex items-center justify-center cursor-pointer relative"
                  >
                    {item && (
                      <span className="text-[11px] font-bold text-white truncate px-0.5">
                        {item.name} ({item.count})
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <div className="text-xl text-stone-400 font-bold">➔</div>

              {/* Output Result Slot */}
              <div
                onClick={handleTakeCraftOutput}
                className="w-12 h-12 sm:w-14 sm:h-14 bg-stone-900 border-2 border-yellow-400 flex items-center justify-center cursor-pointer hover:bg-stone-800 relative shadow-lg"
              >
                {craftOutput && (
                  <div className="text-center p-1">
                    <span className="text-[10px] sm:text-xs font-bold text-emerald-300 line-clamp-1">
                      {craftOutput.name}
                    </span>
                    <span className="text-xs font-bold text-white">x{craftOutput.count}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quick Recipe Book Suggestions */}
          <div className="flex-1 bg-stone-950 p-3 border-2 border-stone-800 max-h-36 overflow-y-auto">
            <h4 className="text-[11px] font-bold text-cyan-300 font-mono mb-2 uppercase">Recipe Book</h4>
            <div className="grid grid-cols-2 gap-1.5">
              {RECIPES.slice(0, 8).map(r => (
                <button
                  key={r.id}
                  onClick={() => handleQuickCraft(r)}
                  className="p-1.5 bg-stone-900 hover:bg-stone-800 border border-stone-700 text-left text-[11px] font-mono text-stone-200 flex items-center justify-between cursor-pointer"
                >
                  <span className="truncate">{r.result.name}</span>
                  <span className="text-cyan-400 font-bold text-[10px]">Craft</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 27 Main Inventory Slots */}
        <h4 className="text-[11px] font-bold text-stone-400 font-mono mb-1 uppercase">Inventory (27 Slots)</h4>
        <div className="grid grid-cols-9 gap-1 bg-stone-950 p-2 border-2 border-stone-800 mb-3">
          {Array.from({ length: 27 }).map((_, i) => {
            const slotIndex = 9 + i;
            const item = playerState.inventory[slotIndex];
            return (
              <div
                key={slotIndex}
                onClick={() => handleSlotClick(slotIndex)}
                className="w-9 h-9 sm:w-11 sm:h-11 bg-stone-900 border-2 border-stone-700 hover:border-cyan-400 flex items-center justify-center cursor-pointer relative"
              >
                {item && (
                  <div className="flex flex-col items-center justify-center w-full h-full p-0.5">
                    <span className="text-[10px] sm:text-xs font-bold text-white text-center line-clamp-1">
                      {item.isBlock ? '📦' : item.toolType ? '🗡️' : '✨'}
                    </span>
                    {item.count > 1 && (
                      <span className="absolute bottom-0 right-0.5 text-[9px] font-bold text-white">
                        {item.count}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 9 Hotbar Slots */}
        <h4 className="text-[11px] font-bold text-stone-400 font-mono mb-1 uppercase">Hotbar (9 Slots)</h4>
        <div className="grid grid-cols-9 gap-1 bg-stone-950 p-2 border-2 border-stone-800">
          {Array.from({ length: 9 }).map((_, index) => {
            const item = playerState.inventory[index];
            const isSelected = playerState.selectedSlot === index;
            return (
              <div
                key={index}
                onClick={() => handleSlotClick(index)}
                className={`w-9 h-9 sm:w-11 sm:h-11 bg-stone-900 border-2 flex items-center justify-center cursor-pointer relative ${
                  isSelected ? 'border-yellow-400 bg-stone-800' : 'border-stone-700 hover:border-cyan-400'
                }`}
              >
                {item && (
                  <div className="flex flex-col items-center justify-center w-full h-full p-0.5">
                    <span className="text-[10px] sm:text-xs font-bold text-white text-center line-clamp-1">
                      {item.isBlock ? '📦' : item.toolType ? '🗡️' : '✨'}
                    </span>
                    {item.count > 1 && (
                      <span className="absolute bottom-0 right-0.5 text-[9px] font-bold text-white">
                        {item.count}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Holding Item Floating Indicator */}
        {selectedHolding && (
          <div className="mt-3 text-xs font-mono text-cyan-300">
            Holding: <span className="text-white font-bold">{selectedHolding.name}</span> (x{selectedHolding.count}) — Click any slot to deposit.
          </div>
        )}
      </div>
    </div>
  );
};
