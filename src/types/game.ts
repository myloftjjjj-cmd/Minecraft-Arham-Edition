/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type BlockId = number;

export enum BlockType {
  AIR = 0,
  GRASS = 1,
  DIRT = 2,
  STONE = 3,
  COBBLESTONE = 4,
  BEDROCK = 5,
  SAND = 6,
  GRAVEL = 7,
  OAK_LOG = 8,
  OAK_PLANKS = 9,
  OAK_LEAVES = 10,
  GLASS = 11,
  WATER = 12,
  LAVA = 13,
  COAL_ORE = 14,
  IRON_ORE = 15,
  GOLD_ORE = 16,
  DIAMOND_ORE = 17,
  REDSTONE_ORE = 18,
  EMERALD_ORE = 19,
  CRAFTING_TABLE = 20,
  FURNACE = 21,
  CHEST = 22,
  TORCH = 23,
  TNT = 24,
  BOOKSHELF = 25,
  BRICKS = 26,
  OBSIDIAN = 27,
  CACTUS = 28,
  SNOW_BLOCK = 29,
  ICE = 30,
  BIRCH_LOG = 31,
  BIRCH_PLANKS = 32,
  SPRUCE_LOG = 33,
  SPRUCE_PLANKS = 34,
  SPRUCE_LEAVES = 35,
  MOSSY_COBBLESTONE = 36,
  ROSE = 37,
  DANDELION = 38,
}

export type ToolType = 'none' | 'pickaxe' | 'axe' | 'shovel' | 'sword' | 'shears';
export type ToolMaterial = 'wood' | 'stone' | 'iron' | 'gold' | 'diamond' | 'emerald';

export interface BlockDef {
  id: BlockType;
  name: string;
  hardness: number; // break time in seconds by hand
  tool: ToolType;
  minToolTier?: ToolMaterial;
  isTransparent?: boolean;
  isLiquid?: boolean;
  isLightSource?: boolean;
  lightLevel?: number;
  isSolid?: boolean;
  dropsItem?: string;
  dropCount?: number;
  textureIndices: {
    top: number;
    bottom: number;
    sides: number;
    front?: number;
  };
}

export interface ItemStack {
  id: string; // e.g. "block:grass", "item:diamond_pickaxe"
  count: number;
  maxStack: number;
  durability?: number;
  maxDurability?: number;
  name: string;
  isBlock?: boolean;
  blockType?: BlockType;
  toolType?: ToolType;
  toolMaterial?: ToolMaterial;
  damage?: number;
  foodValue?: number;
  saturation?: number;
  icon?: string; // canvas procedural key or base64
}

export type GameMode = 'survival' | 'creative';
export type Difficulty = 'peaceful' | 'easy' | 'normal' | 'hard';
export type WorldType = 'default' | 'flat' | 'amplified' | 'islands';

export interface WorldMetadata {
  id: string;
  name: string;
  seed: number;
  seedString: string;
  gameMode: GameMode;
  difficulty: Difficulty;
  worldType: WorldType;
  allowCheats: boolean;
  createdAt: number;
  lastPlayedAt: number;
  playTimeMinutes: number;
  sizeBytes?: number;
}

export interface PlayerState {
  position: [number, number, number];
  rotation: [number, number]; // [yaw, pitch]
  health: number;
  maxHealth: number;
  hunger: number;
  maxHunger: number;
  armor: number;
  selectedSlot: number;
  inventory: (ItemStack | null)[]; // 36 slots (0-8 hotbar, 9-35 main)
  armorSlots: (ItemStack | null)[]; // 4 slots (helmet, chest, legs, boots)
  offhandSlot: ItemStack | null;
  gameMode: GameMode;
  isFlying?: boolean;
}

export interface SavedWorldData {
  metadata: WorldMetadata;
  player: PlayerState;
  timeOfDay: number; // 0 to 24000
  weather: 'clear' | 'rain' | 'thunder';
  modifiedBlocks: Record<string, BlockType>; // "x,y,z" -> blockId
  chestsData?: Record<string, (ItemStack | null)[]>; // "x,y,z" -> slot array
}

export interface Recipe {
  id: string;
  type: 'crafting_2x2' | 'crafting_3x3' | 'smelting';
  result: ItemStack;
  // For shaped crafting: 2x2 or 3x3 pattern of string item IDs or null
  pattern?: (string | null)[][];
  // For shapeless
  ingredients?: { id: string; count: number }[];
  // For smelting
  cookTimeSeconds?: number;
  smeltingInput?: string;
  xp?: number;
}

export type MobType =
  | 'cow'
  | 'pig'
  | 'sheep'
  | 'chicken'
  | 'villager'
  | 'zombie'
  | 'skeleton'
  | 'creeper'
  | 'spider'
  | 'enderman';

export interface MobEntity {
  id: string;
  type: MobType;
  isHostile: boolean;
  position: [number, number, number];
  velocity: [number, number, number];
  yaw: number;
  pitch: number;
  health: number;
  maxHealth: number;
  hurtTimer: number;
  walkTimer: number;
  attackCooldown: number;
  targetPlayer: boolean;
  exploding?: boolean;
  explodeTimer?: number;
}

// 💎 MODS MARKETPLACE TYPES
export type ModLoaderType = 'arham' | 'fabric' | 'forge' | 'neoforge' | 'quilt';

export type ModCategory =
  | 'All'
  | 'Technology'
  | 'Magic'
  | 'Weapons'
  | 'Armor'
  | 'Mobs'
  | 'Biomes'
  | 'World Generation'
  | 'Structures'
  | 'Furniture'
  | 'Farming'
  | 'Performance'
  | 'Adventure'
  | 'Utility'
  | 'Shaders'
  | 'Quality of Life';

export interface ModItem {
  id: string;
  title: string;
  description: string;
  body?: string;
  icon_url: string;
  author: string;
  downloads: number;
  follows: number;
  categories: string[];
  loaders: ModLoaderType[];
  versions: string[];
  source_repo?: string;
  project_url?: string;
  date_published?: string;
  date_modified?: string;
  isArhamNative?: boolean; // Can execute directly in ARHAM-MC Web Engine!
  installed?: boolean;
  enabled?: boolean;
  localVersion?: string;
  dependencies?: string[];
  gallery?: string[];
}

export interface ModpackItem {
  id: string;
  title: string;
  description: string;
  author: string;
  downloads: number;
  modCount: number;
  coverImage: string;
  tags: string[];
  modsList: string[]; // mod IDs
  isInstalled?: boolean;
}

export interface PluginItem {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  enabled: boolean;
  commands: string[];
}

export interface ResourcePack {
  id: string;
  name: string;
  description: string;
  author: string;
  version: string;
  resolution: string; // e.g. "16x16", "32x32"
  icon: string;
  isActive: boolean;
  priority: number;
  type: 'vanilla' | 'smooth' | 'high_contrast' | 'retro';
}

export interface GameSettings {
  renderDistance: number; // 2 to 10
  fov: number; // 60 to 100
  graphics: 'fast' | 'fancy';
  smoothLighting: boolean;
  shadows: boolean;
  fpsLimit: number; // 30, 60, 120, 0 (unlimited)
  brightness: number; // 0 to 100
  viewBobbing: boolean;
  showFps: boolean;
  showCoordinates: boolean;
  
  // Controls
  mouseSensitivity: number; // 0.1 to 2.0
  invertY: boolean;
  mobileJoystickSize: number; // 80 to 160 px
  mobileButtonSize: number; // 40 to 80 px
  mobileSensitivity: number;
  
  // Audio
  masterVolume: number; // 0 to 1
  sfxVolume: number;
  musicVolume: number;
  ambientVolume: number;
  
  // Gameplay
  difficulty: Difficulty;
  cameraMode: 'first_person' | 'third_person_back' | 'third_person_front';
  autoSaveIntervalMinutes: number;
}
