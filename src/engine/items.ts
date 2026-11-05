/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ItemStack, Recipe, BlockType } from '../types/game';

export const ITEM_REGISTRY: Record<string, Partial<ItemStack>> = {
  // Tools: Pickaxes
  'item:wooden_pickaxe': { id: 'item:wooden_pickaxe', name: 'Wooden Pickaxe', maxStack: 1, toolType: 'pickaxe', toolMaterial: 'wood', durability: 59, maxDurability: 59, damage: 2 },
  'item:stone_pickaxe': { id: 'item:stone_pickaxe', name: 'Stone Pickaxe', maxStack: 1, toolType: 'pickaxe', toolMaterial: 'stone', durability: 131, maxDurability: 131, damage: 3 },
  'item:iron_pickaxe': { id: 'item:iron_pickaxe', name: 'Iron Pickaxe', maxStack: 1, toolType: 'pickaxe', toolMaterial: 'iron', durability: 250, maxDurability: 250, damage: 4 },
  'item:diamond_pickaxe': { id: 'item:diamond_pickaxe', name: 'Diamond Pickaxe', maxStack: 1, toolType: 'pickaxe', toolMaterial: 'diamond', durability: 1561, maxDurability: 1561, damage: 5 },
  'item:emerald_pickaxe': { id: 'item:emerald_pickaxe', name: 'Emerald Pickaxe', maxStack: 1, toolType: 'pickaxe', toolMaterial: 'emerald', durability: 2048, maxDurability: 2048, damage: 6 },

  // Tools: Swords
  'item:wooden_sword': { id: 'item:wooden_sword', name: 'Wooden Sword', maxStack: 1, toolType: 'sword', toolMaterial: 'wood', durability: 59, maxDurability: 59, damage: 4 },
  'item:stone_sword': { id: 'item:stone_sword', name: 'Stone Sword', maxStack: 1, toolType: 'sword', toolMaterial: 'stone', durability: 131, maxDurability: 131, damage: 5 },
  'item:iron_sword': { id: 'item:iron_sword', name: 'Iron Sword', maxStack: 1, toolType: 'sword', toolMaterial: 'iron', durability: 250, maxDurability: 250, damage: 6 },
  'item:diamond_sword': { id: 'item:diamond_sword', name: 'Diamond Sword', maxStack: 1, toolType: 'sword', toolMaterial: 'diamond', durability: 1561, maxDurability: 1561, damage: 7 },
  'item:emerald_sword': { id: 'item:emerald_sword', name: 'Emerald Sword', maxStack: 1, toolType: 'sword', toolMaterial: 'emerald', durability: 2048, maxDurability: 2048, damage: 8 },

  // Tools: Axes
  'item:wooden_axe': { id: 'item:wooden_axe', name: 'Wooden Axe', maxStack: 1, toolType: 'axe', toolMaterial: 'wood', durability: 59, maxDurability: 59, damage: 3 },
  'item:stone_axe': { id: 'item:stone_axe', name: 'Stone Axe', maxStack: 1, toolType: 'axe', toolMaterial: 'stone', durability: 131, maxDurability: 131, damage: 4 },
  'item:iron_axe': { id: 'item:iron_axe', name: 'Iron Axe', maxStack: 1, toolType: 'axe', toolMaterial: 'iron', durability: 250, maxDurability: 250, damage: 5 },
  'item:diamond_axe': { id: 'item:diamond_axe', name: 'Diamond Axe', maxStack: 1, toolType: 'axe', toolMaterial: 'diamond', durability: 1561, maxDurability: 1561, damage: 6 },

  // Tools: Shovels
  'item:wooden_shovel': { id: 'item:wooden_shovel', name: 'Wooden Shovel', maxStack: 1, toolType: 'shovel', toolMaterial: 'wood', durability: 59, maxDurability: 59, damage: 1 },
  'item:stone_shovel': { id: 'item:stone_shovel', name: 'Stone Shovel', maxStack: 1, toolType: 'shovel', toolMaterial: 'stone', durability: 131, maxDurability: 131, damage: 2 },
  'item:iron_shovel': { id: 'item:iron_shovel', name: 'Iron Shovel', maxStack: 1, toolType: 'shovel', toolMaterial: 'iron', durability: 250, maxDurability: 250, damage: 3 },
  'item:diamond_shovel': { id: 'item:diamond_shovel', name: 'Diamond Shovel', maxStack: 1, toolType: 'shovel', toolMaterial: 'diamond', durability: 1561, maxDurability: 1561, damage: 4 },

  // Armor: Iron Set
  'item:iron_helmet': { id: 'item:iron_helmet', name: 'Iron Helmet', maxStack: 1, durability: 165, maxDurability: 165 },
  'item:iron_chestplate': { id: 'item:iron_chestplate', name: 'Iron Chestplate', maxStack: 1, durability: 240, maxDurability: 240 },
  'item:iron_leggings': { id: 'item:iron_leggings', name: 'Iron Leggings', maxStack: 1, durability: 225, maxDurability: 225 },
  'item:iron_boots': { id: 'item:iron_boots', name: 'Iron Boots', maxStack: 1, durability: 195, maxDurability: 195 },

  // Armor: Diamond Set
  'item:diamond_helmet': { id: 'item:diamond_helmet', name: 'Diamond Helmet', maxStack: 1, durability: 363, maxDurability: 363 },
  'item:diamond_chestplate': { id: 'item:diamond_chestplate', name: 'Diamond Chestplate', maxStack: 1, durability: 528, maxDurability: 528 },
  'item:diamond_leggings': { id: 'item:diamond_leggings', name: 'Diamond Leggings', maxStack: 1, durability: 495, maxDurability: 495 },
  'item:diamond_boots': { id: 'item:diamond_boots', name: 'Diamond Boots', maxStack: 1, durability: 429, maxDurability: 429 },

  // Combat / Ranged
  'item:bow': { id: 'item:bow', name: 'Bow', maxStack: 1, durability: 384, maxDurability: 384 },
  'item:arrow': { id: 'item:arrow', name: 'Arrow', maxStack: 64 },
  'item:shield': { id: 'item:shield', name: 'Wooden Shield', maxStack: 1, durability: 336, maxDurability: 336 },

  // Materials
  'item:stick': { id: 'item:stick', name: 'Stick', maxStack: 64 },
  'item:coal': { id: 'item:coal', name: 'Coal', maxStack: 64 },
  'item:iron_ingot': { id: 'item:iron_ingot', name: 'Iron Ingot', maxStack: 64 },
  'item:gold_ingot': { id: 'item:gold_ingot', name: 'Gold Ingot', maxStack: 64 },
  'item:diamond': { id: 'item:diamond', name: 'Diamond', maxStack: 64 },
  'item:emerald': { id: 'item:emerald', name: 'Emerald', maxStack: 64 },
  'item:redstone': { id: 'item:redstone', name: 'Redstone Dust', maxStack: 64 },
  'item:string': { id: 'item:string', name: 'String', maxStack: 64 },
  'item:feather': { id: 'item:feather', name: 'Feather', maxStack: 64 },
  'item:gunpowder': { id: 'item:gunpowder', name: 'Gunpowder', maxStack: 64 },
  'item:leather': { id: 'item:leather', name: 'Leather', maxStack: 64 },

  // Food
  'item:apple': { id: 'item:apple', name: 'Apple', maxStack: 64, foodValue: 4, saturation: 2.4 },
  'item:bread': { id: 'item:bread', name: 'Bread', maxStack: 64, foodValue: 5, saturation: 6 },
  'item:cooked_beef': { id: 'item:cooked_beef', name: 'Steak', maxStack: 64, foodValue: 8, saturation: 12.8 },
  'item:raw_beef': { id: 'item:raw_beef', name: 'Raw Beef', maxStack: 64, foodValue: 3, saturation: 1.8 },
  'item:cooked_porkchop': { id: 'item:cooked_porkchop', name: 'Cooked Porkchop', maxStack: 64, foodValue: 8, saturation: 12.8 },
  'item:raw_porkchop': { id: 'item:raw_porkchop', name: 'Raw Porkchop', maxStack: 64, foodValue: 3, saturation: 1.8 },
  'item:golden_apple': { id: 'item:golden_apple', name: 'Golden Apple', maxStack: 64, foodValue: 10, saturation: 14.4 },
};

// Helper to create an ItemStack from an id
export function createItemStack(id: string, count = 1): ItemStack {
  if (id.startsWith('block:')) {
    const blockKey = id.replace('block:', '').toUpperCase();
    const bType = (BlockType as unknown as Record<string, BlockType>)[blockKey] ?? BlockType.STONE;
    const name = id.replace('block:', '').split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    return {
      id,
      count,
      maxStack: 64,
      name,
      isBlock: true,
      blockType: bType,
    };
  }

  const registered = ITEM_REGISTRY[id];
  if (registered) {
    return {
      id,
      count,
      maxStack: registered.maxStack ?? 64,
      name: registered.name ?? 'Item',
      durability: registered.durability,
      maxDurability: registered.maxDurability,
      toolType: registered.toolType,
      toolMaterial: registered.toolMaterial,
      damage: registered.damage,
      foodValue: registered.foodValue,
      saturation: registered.saturation,
    };
  }

  return {
    id,
    count,
    maxStack: 64,
    name: id.replace('item:', ''),
  };
}

// Crafting Recipes
export const RECIPES: Recipe[] = [
  // 1 Log -> 4 Planks
  {
    id: 'oak_planks',
    type: 'crafting_2x2',
    result: createItemStack('block:oak_planks', 4),
    ingredients: [{ id: 'block:oak_log', count: 1 }],
  },
  {
    id: 'birch_planks',
    type: 'crafting_2x2',
    result: createItemStack('block:birch_planks', 4),
    ingredients: [{ id: 'block:birch_log', count: 1 }],
  },
  {
    id: 'spruce_planks',
    type: 'crafting_2x2',
    result: createItemStack('block:spruce_planks', 4),
    ingredients: [{ id: 'block:spruce_log', count: 1 }],
  },
  // 2 Planks -> 4 Sticks
  {
    id: 'sticks',
    type: 'crafting_2x2',
    result: createItemStack('item:stick', 4),
    ingredients: [{ id: 'block:oak_planks', count: 2 }],
  },
  // 4 Planks -> Crafting Table
  {
    id: 'crafting_table',
    type: 'crafting_2x2',
    result: createItemStack('block:crafting_table', 1),
    ingredients: [{ id: 'block:oak_planks', count: 4 }],
  },
  // 1 Coal + 1 Stick -> 4 Torches
  {
    id: 'torches',
    type: 'crafting_2x2',
    result: createItemStack('block:torch', 4),
    ingredients: [
      { id: 'item:coal', count: 1 },
      { id: 'item:stick', count: 1 },
    ],
  },
  // 8 Cobblestone -> Furnace
  {
    id: 'furnace',
    type: 'crafting_3x3',
    result: createItemStack('block:furnace', 1),
    ingredients: [{ id: 'block:cobblestone', count: 8 }],
  },
  // 8 Planks -> Chest
  {
    id: 'chest',
    type: 'crafting_3x3',
    result: createItemStack('block:chest', 1),
    ingredients: [{ id: 'block:oak_planks', count: 8 }],
  },
  // Tools: Wooden Pickaxe
  {
    id: 'wooden_pickaxe',
    type: 'crafting_3x3',
    result: createItemStack('item:wooden_pickaxe', 1),
    ingredients: [
      { id: 'block:oak_planks', count: 3 },
      { id: 'item:stick', count: 2 },
    ],
  },
  // Tools: Stone Pickaxe
  {
    id: 'stone_pickaxe',
    type: 'crafting_3x3',
    result: createItemStack('item:stone_pickaxe', 1),
    ingredients: [
      { id: 'block:cobblestone', count: 3 },
      { id: 'item:stick', count: 2 },
    ],
  },
  // Tools: Iron Pickaxe
  {
    id: 'iron_pickaxe',
    type: 'crafting_3x3',
    result: createItemStack('item:iron_pickaxe', 1),
    ingredients: [
      { id: 'item:iron_ingot', count: 3 },
      { id: 'item:stick', count: 2 },
    ],
  },
  // Tools: Diamond Pickaxe
  {
    id: 'diamond_pickaxe',
    type: 'crafting_3x3',
    result: createItemStack('item:diamond_pickaxe', 1),
    ingredients: [
      { id: 'item:diamond', count: 3 },
      { id: 'item:stick', count: 2 },
    ],
  },
  // Tools: Wooden Sword
  {
    id: 'wooden_sword',
    type: 'crafting_2x2',
    result: createItemStack('item:wooden_sword', 1),
    ingredients: [
      { id: 'block:oak_planks', count: 2 },
      { id: 'item:stick', count: 1 },
    ],
  },
  // Tools: Iron Sword
  {
    id: 'iron_sword',
    type: 'crafting_2x2',
    result: createItemStack('item:iron_sword', 1),
    ingredients: [
      { id: 'item:iron_ingot', count: 2 },
      { id: 'item:stick', count: 1 },
    ],
  },
  // Tools: Diamond Sword
  {
    id: 'diamond_sword',
    type: 'crafting_2x2',
    result: createItemStack('item:diamond_sword', 1),
    ingredients: [
      { id: 'item:diamond', count: 2 },
      { id: 'item:stick', count: 1 },
    ],
  },
  // Bow: 3 Sticks + 3 String
  {
    id: 'bow',
    type: 'crafting_3x3',
    result: createItemStack('item:bow', 1),
    ingredients: [
      { id: 'item:stick', count: 3 },
      { id: 'item:string', count: 3 },
    ],
  },
  // Arrows: 1 Stick + 1 Feather + 1 Flint/Stone
  {
    id: 'arrows',
    type: 'crafting_3x3',
    result: createItemStack('item:arrow', 4),
    ingredients: [
      { id: 'item:stick', count: 1 },
      { id: 'item:feather', count: 1 },
      { id: 'block:gravel', count: 1 },
    ],
  },
  // TNT: 4 Sand + 5 Gunpowder
  {
    id: 'tnt',
    type: 'crafting_3x3',
    result: createItemStack('block:tnt', 1),
    ingredients: [
      { id: 'block:sand', count: 4 },
      { id: 'item:gunpowder', count: 5 },
    ],
  },
  // Armor: Iron Chestplate (8 Iron Ingots)
  {
    id: 'iron_chestplate',
    type: 'crafting_3x3',
    result: createItemStack('item:iron_chestplate', 1),
    ingredients: [{ id: 'item:iron_ingot', count: 8 }],
  },
  // Armor: Diamond Chestplate (8 Diamonds)
  {
    id: 'diamond_chestplate',
    type: 'crafting_3x3',
    result: createItemStack('item:diamond_chestplate', 1),
    ingredients: [{ id: 'item:diamond', count: 8 }],
  },

  // SMELTING RECIPES
  {
    id: 'smelt_iron_ore',
    type: 'smelting',
    smeltingInput: 'block:iron_ore',
    result: createItemStack('item:iron_ingot', 1),
    cookTimeSeconds: 6,
    xp: 0.7,
  },
  {
    id: 'smelt_gold_ore',
    type: 'smelting',
    smeltingInput: 'block:gold_ore',
    result: createItemStack('item:gold_ingot', 1),
    cookTimeSeconds: 6,
    xp: 1.0,
  },
  {
    id: 'smelt_sand',
    type: 'smelting',
    smeltingInput: 'block:sand',
    result: createItemStack('block:glass', 1),
    cookTimeSeconds: 5,
    xp: 0.1,
  },
  {
    id: 'smelt_cobble',
    type: 'smelting',
    smeltingInput: 'block:cobblestone',
    result: createItemStack('block:stone', 1),
    cookTimeSeconds: 5,
    xp: 0.1,
  },
  {
    id: 'cook_beef',
    type: 'smelting',
    smeltingInput: 'item:raw_beef',
    result: createItemStack('item:cooked_beef', 1),
    cookTimeSeconds: 5,
    xp: 0.35,
  },
  {
    id: 'cook_porkchop',
    type: 'smelting',
    smeltingInput: 'item:raw_porkchop',
    result: createItemStack('item:cooked_porkchop', 1),
    cookTimeSeconds: 5,
    xp: 0.35,
  },
];
