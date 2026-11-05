/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WorldMetadata, SavedWorldData, GameMode, Difficulty, WorldType, PlayerState } from '../types/game';
import { createItemStack } from './items';

const DB_NAME = 'arham_mc_voxel_engine_db';
const DB_VERSION = 1;
const STORE_METADATA = 'worlds_metadata';
const STORE_DATA = 'worlds_data';

export class WorldStorage {
  private static dbPromise: Promise<IDBDatabase> | null = null;

  private static getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_METADATA)) {
          db.createObjectStore(STORE_METADATA, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_DATA)) {
          db.createObjectStore(STORE_DATA, { keyPath: 'id' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });

    return this.dbPromise;
  }

  public static async listWorlds(): Promise<WorldMetadata[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_METADATA, 'readonly');
      const store = tx.objectStore(STORE_METADATA);
      const req = store.getAll();
      req.onsuccess = () => {
        const list: WorldMetadata[] = req.result || [];
        list.sort((a, b) => b.lastPlayedAt - a.lastPlayedAt);
        resolve(list);
      };
      req.onerror = () => reject(req.error);
    });
  }

  public static async loadWorld(id: string): Promise<SavedWorldData | null> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_METADATA, STORE_DATA], 'readonly');
      const metaReq = tx.objectStore(STORE_METADATA).get(id);
      const dataReq = tx.objectStore(STORE_DATA).get(id);

      tx.oncomplete = () => {
        const meta = metaReq.result as WorldMetadata;
        const data = dataReq.result;
        if (!meta || !data) {
          resolve(null);
          return;
        }
        resolve({
          metadata: meta,
          player: data.player,
          timeOfDay: data.timeOfDay,
          weather: data.weather,
          modifiedBlocks: data.modifiedBlocks || {},
          chestsData: data.chestsData || {},
        });
      };
      tx.onerror = () => reject(tx.error);
    });
  }

  public static async saveWorld(data: SavedWorldData): Promise<void> {
    const db = await this.getDB();
    data.metadata.lastPlayedAt = Date.now();

    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_METADATA, STORE_DATA], 'readwrite');
      tx.objectStore(STORE_METADATA).put(data.metadata);
      tx.objectStore(STORE_DATA).put({
        id: data.metadata.id,
        player: data.player,
        timeOfDay: data.timeOfDay,
        weather: data.weather,
        modifiedBlocks: data.modifiedBlocks,
        chestsData: data.chestsData,
      });

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  public static async createNewWorld(
    name: string,
    seedInput: string,
    gameMode: GameMode,
    difficulty: Difficulty,
    worldType: WorldType,
    allowCheats: boolean
  ): Promise<WorldMetadata> {
    const id = 'world_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6);
    
    // Compute numerical seed from string
    let seedNum = 0;
    if (seedInput.trim() === '') {
      seedNum = Math.floor(Math.random() * 2147483647);
    } else {
      const parsed = parseInt(seedInput, 10);
      if (!isNaN(parsed)) {
        seedNum = parsed;
      } else {
        for (let i = 0; i < seedInput.length; i++) {
          seedNum = (seedNum << 5) - seedNum + seedInput.charCodeAt(i);
          seedNum |= 0;
        }
      }
    }

    const metadata: WorldMetadata = {
      id,
      name: name.trim() || 'New World',
      seed: Math.abs(seedNum),
      seedString: seedInput || String(Math.abs(seedNum)),
      gameMode,
      difficulty,
      worldType,
      allowCheats,
      createdAt: Date.now(),
      lastPlayedAt: Date.now(),
      playTimeMinutes: 0,
    };

    // Default starting inventory
    const inventory = new Array(36).fill(null);
    if (gameMode === 'survival') {
      inventory[0] = createItemStack('item:wooden_pickaxe', 1);
      inventory[1] = createItemStack('item:wooden_axe', 1);
      inventory[2] = createItemStack('item:bread', 8);
      inventory[3] = createItemStack('block:torch', 16);
    } else {
      // Creative: starter block selection
      inventory[0] = createItemStack('block:grass', 64);
      inventory[1] = createItemStack('block:stone', 64);
      inventory[2] = createItemStack('block:oak_planks', 64);
      inventory[3] = createItemStack('block:glass', 64);
      inventory[4] = createItemStack('block:torch', 64);
      inventory[5] = createItemStack('block:diamond_ore', 64);
      inventory[6] = createItemStack('block:tnt', 64);
      inventory[7] = createItemStack('item:diamond_sword', 1);
      inventory[8] = createItemStack('item:diamond_pickaxe', 1);
    }

    const defaultPlayer: PlayerState = {
      position: [8, 35, 8],
      rotation: [0, 0],
      health: 20,
      maxHealth: 20,
      hunger: 20,
      maxHunger: 20,
      armor: 0,
      selectedSlot: 0,
      inventory,
      armorSlots: [null, null, null, null],
      offhandSlot: null,
      gameMode,
      isFlying: gameMode === 'creative',
    };

    const initialData: SavedWorldData = {
      metadata,
      player: defaultPlayer,
      timeOfDay: 6000, // Dawn/Morning
      weather: 'clear',
      modifiedBlocks: {},
      chestsData: {},
    };

    await this.saveWorld(initialData);
    return metadata;
  }

  public static async deleteWorld(id: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_METADATA, STORE_DATA], 'readwrite');
      tx.objectStore(STORE_METADATA).delete(id);
      tx.objectStore(STORE_DATA).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  public static async duplicateWorld(id: string): Promise<WorldMetadata | null> {
    const world = await this.loadWorld(id);
    if (!world) return null;

    const newId = 'world_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6);
    const newMeta: WorldMetadata = {
      ...world.metadata,
      id: newId,
      name: world.metadata.name + ' (Copy)',
      createdAt: Date.now(),
      lastPlayedAt: Date.now(),
    };

    const newData: SavedWorldData = {
      ...world,
      metadata: newMeta,
    };

    await this.saveWorld(newData);
    return newMeta;
  }

  public static async exportWorldJSON(id: string): Promise<string | null> {
    const world = await this.loadWorld(id);
    if (!world) return null;
    return JSON.stringify(world, null, 2);
  }

  public static async importWorldJSON(jsonString: string): Promise<WorldMetadata> {
    const parsed = JSON.parse(jsonString) as SavedWorldData;
    const newId = 'world_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6);
    parsed.metadata.id = newId;
    parsed.metadata.name = parsed.metadata.name + ' (Imported)';
    parsed.metadata.lastPlayedAt = Date.now();
    await this.saveWorld(parsed);
    return parsed.metadata;
  }
}
