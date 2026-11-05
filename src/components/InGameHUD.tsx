/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { PlayerState, GameSettings } from '../types/game';
import { modrinthService } from '../engine/modrinth';

interface InGameHUDProps {
  playerState: PlayerState;
  settings: GameSettings;
  fps: number;
  biome: string;
  lightLevel: number;
  facing: string;
  timeString: string;
  showF3: boolean;
  onSlotSelect: (slot: number) => void;
}

export const InGameHUD: React.FC<InGameHUDProps> = ({
  playerState,
  settings,
  fps,
  biome,
  lightLevel,
  facing,
  timeString,
  showF3,
  onSlotSelect,
}) => {
  const [itemNameToast, setItemNameToast] = useState<string>('');
  const [minimapEnabled, setMinimapEnabled] = useState(true);

  // Check if minimap mod is enabled
  useEffect(() => {
    setMinimapEnabled(modrinthService.isModEnabled('arham-minimap'));
    const unsub = modrinthService.subscribe(() => {
      setMinimapEnabled(modrinthService.isModEnabled('arham-minimap'));
    });
    return () => {
      unsub();
    };
  }, []);

  // Update item toast when slot changes
  useEffect(() => {
    const item = playerState.inventory[playerState.selectedSlot];
    if (item) {
      setItemNameToast(item.name);
      const timer = setTimeout(() => setItemNameToast(''), 1800);
      return () => clearTimeout(timer);
    } else {
      setItemNameToast('');
    }
  }, [playerState.selectedSlot, playerState.inventory]);

  const { health, maxHealth, hunger, maxHunger, armor, selectedSlot, inventory, position } = playerState;

  // Hearts calculation (1 heart = 2 health)
  const fullHearts = Math.floor(health / 2);
  const halfHeart = health % 2 === 1;
  const emptyHearts = Math.max(0, 10 - fullHearts - (halfHeart ? 1 : 0));

  // Hunger calculation (1 drumstick = 2 hunger)
  const fullHunger = Math.floor(hunger / 2);
  const halfHunger = hunger % 2 === 1;
  const emptyHunger = Math.max(0, 10 - fullHunger - (halfHunger ? 1 : 0));

  return (
    <div className="fixed inset-0 pointer-events-none select-none z-30 flex flex-col justify-between p-3 sm:p-4 font-mono">
      {/* Top Header: F3 Debug Overlay & Minimap */}
      <div className="flex items-start justify-between w-full">
        {/* F3 Debug Info */}
        {showF3 ? (
          <div className="bg-black/75 p-3 text-[11px] sm:text-xs text-stone-200 border border-stone-700 space-y-0.5 pointer-events-auto">
            <div className="text-emerald-400 font-bold">ARHAM-MC v1.21.0 (WebGL 3D)</div>
            <div>FPS: <span className="text-yellow-300 font-bold">{fps}</span> ({settings.graphics} graphics)</div>
            <div>
              XYZ: {position[0].toFixed(2)} / {position[1].toFixed(2)} / {position[2].toFixed(2)}
            </div>
            <div>
              Block: {Math.floor(position[0])} {Math.floor(position[1])} {Math.floor(position[2])}
            </div>
            <div>
              Chunk: {Math.floor(position[0] / 16)} {Math.floor(position[2] / 16)} in [{Math.floor(position[0]) % 16}, {Math.floor(position[2]) % 16}]
            </div>
            <div>Facing: <span className="text-cyan-300 font-bold">{facing}</span></div>
            <div>Biome: <span className="text-green-300 capitalize">{biome}</span></div>
            <div>Light Level: {lightLevel} (Sky: 15, Block: {lightLevel})</div>
            <div>Time: {timeString}</div>
          </div>
        ) : (
          <div className="text-[11px] text-white/80 bg-black/40 px-2 py-1 rounded">
            F3: Debug | E: Inventory | Esc: Pause
          </div>
        )}

        {/* 🗺️ MINIMAP MOD RADAR (Top Right) */}
        {minimapEnabled && (
          <div className="bg-stone-900/90 border-2 border-stone-600 p-2 rounded shadow-xl flex flex-col items-center pointer-events-auto">
            <div className="relative w-28 h-28 rounded-full bg-slate-950 border-2 border-cyan-500 overflow-hidden flex items-center justify-center">
              {/* Radar rings */}
              <div className="absolute inset-2 rounded-full border border-cyan-500/20" />
              <div className="absolute inset-6 rounded-full border border-cyan-500/30" />
              <div className="absolute w-full h-[1px] bg-cyan-500/30" />
              <div className="absolute h-full w-[1px] bg-cyan-500/30" />

              {/* Player Arrow Marker */}
              <div
                className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[10px] border-b-cyan-400 z-10 drop-shadow-[0_0_4px_#38bdf8]"
                style={{ transform: `rotate(${playerState.rotation[0]}rad)` }}
              />

              {/* Random decorative radar blips (nearby entities) */}
              <div className="absolute top-4 left-6 w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
              <div className="absolute bottom-6 right-5 w-1.5 h-1.5 bg-green-400 rounded-full" />
              <div className="absolute top-8 right-6 w-1.5 h-1.5 bg-green-400 rounded-full" />
            </div>
            <div className="text-[10px] text-cyan-300 font-bold mt-1 tracking-wider uppercase">
              {biome} Biome
            </div>
          </div>
        )}
      </div>

      {/* Crosshair (Center Screen) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative w-5 h-5 flex items-center justify-center">
          <div className="absolute w-4 h-0.5 bg-white/85 shadow-[0_0_2px_black]" />
          <div className="absolute h-4 w-0.5 bg-white/85 shadow-[0_0_2px_black]" />
        </div>
      </div>

      {/* Bottom Area: Item Toast, Stats Bars & Hotbar */}
      <div className="flex flex-col items-center gap-1.5 mb-2 pointer-events-auto">
        {/* Selected Item Toast */}
        {itemNameToast && (
          <div
            className="text-xs sm:text-sm text-white font-bold bg-black/60 px-3 py-1 rounded tracking-wider shadow-lg animate-fade-in"
            style={{ fontFamily: "'Press Start 2P', monospace" }}
          >
            {itemNameToast}
          </div>
        )}

        {/* Survival Status Bars (Health & Hunger) */}
        {playerState.gameMode === 'survival' && (
          <div className="flex items-center justify-between w-full max-w-sm px-2 gap-4 text-sm drop-shadow-[0_2px_2px_rgba(0,0,0,0.9)]">
            {/* Hearts (Health) */}
            <div className="flex items-center gap-0.5">
              {Array.from({ length: fullHearts }).map((_, i) => (
                <span key={`fh_${i}`} className="text-red-500 text-sm">❤️</span>
              ))}
              {halfHeart && <span className="text-red-400 text-sm">💔</span>}
              {Array.from({ length: emptyHearts }).map((_, i) => (
                <span key={`eh_${i}`} className="text-stone-700 text-sm">🖤</span>
              ))}
            </div>

            {/* Armor Bar */}
            {armor > 0 && (
              <div className="flex items-center gap-0.5 text-xs text-cyan-300">
                🛡️ {armor}
              </div>
            )}

            {/* Hunger Drumsticks */}
            <div className="flex items-center gap-0.5">
              {Array.from({ length: fullHunger }).map((_, i) => (
                <span key={`fhu_${i}`} className="text-amber-600 text-sm">🍗</span>
              ))}
              {halfHunger && <span className="text-amber-500 text-sm">🍖</span>}
              {Array.from({ length: emptyHunger }).map((_, i) => (
                <span key={`ehu_${i}`} className="text-stone-700 text-sm">🦴</span>
              ))}
            </div>
          </div>
        )}

        {/* 9-Slot Hotbar */}
        <div className="flex bg-stone-900/90 p-1 border-2 border-stone-600 shadow-2xl">
          {Array.from({ length: 9 }).map((_, index) => {
            const isSelected = selectedSlot === index;
            const item = inventory[index];

            return (
              <div
                key={index}
                onClick={() => onSlotSelect(index)}
                className={`relative w-10 h-10 sm:w-12 sm:h-12 border-2 flex items-center justify-center cursor-pointer transition-all ${
                  isSelected
                    ? 'border-white bg-stone-700 scale-105 z-10 shadow-lg'
                    : 'border-stone-800 bg-stone-950/80 hover:bg-stone-800'
                }`}
              >
                {/* Slot index number label */}
                <span className="absolute top-0.5 left-1 text-[9px] text-stone-500 font-bold">
                  {index + 1}
                </span>

                {item && (
                  <div className="flex flex-col items-center justify-center w-full h-full p-1">
                    <span className="text-xs sm:text-sm font-bold text-center line-clamp-1 text-white">
                      {item.isBlock ? '📦' : item.toolType ? '🗡️' : '✨'}
                    </span>
                    {/* Item count */}
                    {item.count > 1 && (
                      <span className="absolute bottom-0.5 right-1 text-[10px] sm:text-xs font-bold text-white drop-shadow-[0_1px_2px_black]">
                        {item.count}
                      </span>
                    )}
                    {/* Durability bar if applicable */}
                    {item.durability !== undefined && item.maxDurability !== undefined && (
                      <div className="absolute bottom-0.5 left-1 right-1 h-0.5 bg-stone-800">
                        <div
                          className="h-full bg-emerald-400"
                          style={{ width: `${(item.durability / item.maxDurability) * 100}%` }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
