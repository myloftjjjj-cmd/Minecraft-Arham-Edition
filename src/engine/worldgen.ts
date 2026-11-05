/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BlockType, WorldType } from '../types/game';

// Deterministic Pseudo-Random Number Generator based on Seed (Mulberry32 & SplitMix32)
export class SeededRandom {
  private state: number;

  constructor(seed: number) {
    this.state = seed | 0;
  }

  public next(): number {
    this.state = (this.state + 0x6d2b79f5) | 0;
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  public nextRange(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  public nextInt(min: number, max: number): number {
    return Math.floor(this.nextRange(min, max + 1));
  }
}

// 2D & 3D Value / Perlin-style gradient noise for infinite seamless terrain
export class FastNoise {
  private perm: Uint8Array = new Uint8Array(512);

  constructor(seed: number) {
    const rng = new SeededRandom(seed);
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) p[i] = i;
    for (let i = 255; i > 0; i--) {
      const j = rng.nextInt(0, i);
      const tmp = p[i];
      p[i] = p[j];
      p[j] = tmp;
    }
    for (let i = 0; i < 512; i++) {
      this.perm[i] = p[i & 255];
    }
  }

  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  private lerp(t: number, a: number, b: number): number {
    return a + t * (b - a);
  }

  private grad2D(hash: number, x: number, y: number): number {
    const h = hash & 7;
    const u = h < 4 ? x : y;
    const v = h < 4 ? y : x;
    return ((h & 1) ? -u : u) + ((h & 2) ? -2.0 * v : 2.0 * v);
  }

  public noise2D(x: number, y: number): number {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);

    const u = this.fade(xf);
    const v = this.fade(yf);

    const aa = this.perm[this.perm[X] + Y];
    const ab = this.perm[this.perm[X] + Y + 1];
    const ba = this.perm[this.perm[X + 1] + Y];
    const bb = this.perm[this.perm[X + 1] + Y + 1];

    const x1 = this.lerp(u, this.grad2D(aa, xf, yf), this.grad2D(ba, xf - 1, yf));
    const x2 = this.lerp(u, this.grad2D(ab, xf, yf - 1), this.grad2D(bb, xf - 1, yf - 1));

    return this.lerp(v, x1, x2);
  }

  public fbm2D(x: number, y: number, octaves = 4, persistence = 0.5, lacunarity = 2.0): number {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      total += this.noise2D(x * frequency, y * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= lacunarity;
    }

    return total / maxValue;
  }

  public noise3D(x: number, y: number, z: number): number {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const Z = Math.floor(z) & 255;
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);
    const zf = z - Math.floor(z);

    const u = this.fade(xf);
    const v = this.fade(yf);
    const w = this.fade(zf);

    const A = this.perm[X] + Y;
    const AA = this.perm[A] + Z;
    const AB = this.perm[A + 1] + Z;
    const B = this.perm[X + 1] + Y;
    const BA = this.perm[B] + Z;
    const BB = this.perm[B + 1] + Z;

    const hash = (h: number, _x: number, _y: number, _z: number) => {
      const u_ = h < 8 ? _x : _y;
      const v_ = h < 4 ? _y : h === 12 || h === 14 ? _x : _z;
      return ((h & 1) === 0 ? u_ : -u_) + ((h & 2) === 0 ? v_ : -v_);
    };

    return this.lerp(
      w,
      this.lerp(
        v,
        this.lerp(u, hash(this.perm[AA], xf, yf, zf), hash(this.perm[BA], xf - 1, yf, zf)),
        this.lerp(u, hash(this.perm[AB], xf, yf - 1, zf), hash(this.perm[BB], xf - 1, yf - 1, zf))
      ),
      this.lerp(
        v,
        this.lerp(u, hash(this.perm[AA + 1], xf, yf, zf - 1), hash(this.perm[BA + 1], xf - 1, yf, zf - 1)),
        this.lerp(u, hash(this.perm[AB + 1], xf, yf - 1, zf - 1), hash(this.perm[BB + 1], xf - 1, yf - 1, zf - 1))
      )
    );
  }
}

export type BiomeType = 'plains' | 'forest' | 'desert' | 'mountains' | 'taiga' | 'ocean';

export interface StructureDef {
  x: number;
  y: number;
  z: number;
  blocks: { dx: number; dy: number; dz: number; type: BlockType }[];
}

export class WorldGenerator {
  public seed: number;
  private heightNoise: FastNoise;
  private biomeNoise: FastNoise;
  private moistureNoise: FastNoise;
  private caveNoise: FastNoise;
  private worldType: WorldType;

  public static CHUNK_SIZE_X = 16;
  public static CHUNK_SIZE_Z = 16;
  public static CHUNK_HEIGHT = 64;
  public static SEA_LEVEL = 24;

  constructor(seed: number, worldType: WorldType = 'default') {
    this.seed = seed;
    this.worldType = worldType;
    this.heightNoise = new FastNoise(seed);
    this.biomeNoise = new FastNoise(seed + 101);
    this.moistureNoise = new FastNoise(seed + 202);
    this.caveNoise = new FastNoise(seed + 303);
  }

  // Determine biome at world coordinate (wx, wz)
  public getBiome(wx: number, wz: number): BiomeType {
    if (this.worldType === 'flat') return 'plains';

    const temp = this.biomeNoise.fbm2D(wx * 0.003, wz * 0.003, 2);
    const moist = this.moistureNoise.fbm2D(wx * 0.003, wz * 0.003, 2);

    if (temp < -0.3) {
      return moist > 0 ? 'taiga' : 'mountains';
    } else if (temp > 0.35 && moist < -0.1) {
      return 'desert';
    } else if (moist > 0.25) {
      return 'forest';
    } else if (temp < 0.1 && moist < -0.25) {
      return 'ocean';
    }
    return 'plains';
  }

  // Get surface height at world coordinate (wx, wz)
  public getHeight(wx: number, wz: number): number {
    if (this.worldType === 'flat') return 4; // Flat world at y=4

    const biome = this.getBiome(wx, wz);
    let base = 28;
    let scale = 10;

    if (this.worldType === 'amplified') {
      scale = 26;
      base = 32;
    } else if (this.worldType === 'islands') {
      const islandDist = Math.hypot(wx, wz);
      const islandFade = Math.max(0, 1 - islandDist / 200);
      base = 12 + islandFade * 20;
      scale = 12;
    } else {
      switch (biome) {
        case 'ocean':
          base = 16;
          scale = 6;
          break;
        case 'mountains':
          base = 38;
          scale = 20;
          break;
        case 'desert':
          base = 27;
          scale = 7;
          break;
        case 'forest':
          base = 29;
          scale = 8;
          break;
        case 'taiga':
          base = 32;
          scale = 12;
          break;
        case 'plains':
        default:
          base = 28;
          scale = 7;
          break;
      }
    }

    const n = this.heightNoise.fbm2D(wx * 0.015, wz * 0.015, 4, 0.45, 2.1);
    const h = Math.floor(base + n * scale);
    return Math.max(2, Math.min(WorldGenerator.CHUNK_HEIGHT - 6, h));
  }

  // Generates 16x16x64 3D block array for chunk at (chunkX, chunkZ)
  public generateChunkData(chunkX: number, chunkZ: number): Uint8Array {
    const sx = WorldGenerator.CHUNK_SIZE_X;
    const sz = WorldGenerator.CHUNK_SIZE_Z;
    const sy = WorldGenerator.CHUNK_HEIGHT;
    const data = new Uint8Array(sx * sy * sz);

    const getIndex = (x: number, y: number, z: number) => (y * sz + z) * sx + x;

    const startX = chunkX * sx;
    const startZ = chunkZ * sz;

    for (let lx = 0; lx < sx; lx++) {
      for (let lz = 0; lz < sz; lz++) {
        const wx = startX + lx;
        const wz = startZ + lz;
        const biome = this.getBiome(wx, wz);
        const surfaceY = this.getHeight(wx, wz);

        // Bedrock at y=0
        data[getIndex(lx, 0, lz)] = BlockType.BEDROCK;

        for (let y = 1; y < sy; y++) {
          const idx = getIndex(lx, y, lz);

          if (y <= surfaceY) {
            // Check 3D cave noise
            const isCave =
              y > 3 &&
              y < surfaceY - 2 &&
              this.caveNoise.noise3D(wx * 0.05, y * 0.07, wz * 0.05) > 0.42;

            if (isCave) {
              data[idx] = BlockType.AIR;
              continue;
            }

            if (y === surfaceY) {
              // Top surface block
              if (surfaceY < WorldGenerator.SEA_LEVEL - 1) {
                data[idx] = BlockType.SAND; // Underwater bed
              } else if (biome === 'desert') {
                data[idx] = BlockType.SAND;
              } else if (biome === 'mountains' && y > 42) {
                data[idx] = BlockType.SNOW_BLOCK;
              } else {
                data[idx] = BlockType.GRASS;
              }
            } else if (y >= surfaceY - 3) {
              // Subsurface (2-3 blocks)
              data[idx] = biome === 'desert' ? BlockType.SAND : BlockType.DIRT;
            } else {
              // Deep underground stone with ore veins
              let block = BlockType.STONE;
              const oreHash = Math.abs(Math.sin(wx * 12.9898 + y * 78.233 + wz * 43.123) * 43758.5453);
              const oreFrac = oreHash - Math.floor(oreHash);

              if (y < 12 && oreFrac < 0.015) {
                block = BlockType.DIAMOND_ORE;
              } else if (y < 16 && oreFrac < 0.025) {
                block = BlockType.REDSTONE_ORE;
              } else if (y < 24 && oreFrac < 0.02) {
                block = BlockType.GOLD_ORE;
              } else if (y < 42 && oreFrac < 0.04) {
                block = BlockType.IRON_ORE;
              } else if (oreFrac < 0.06) {
                block = BlockType.COAL_ORE;
              }

              data[idx] = block;
            }
          } else if (y <= WorldGenerator.SEA_LEVEL) {
            // Water filling up to sea level
            data[idx] = BlockType.WATER;
          } else {
            data[idx] = BlockType.AIR;
          }
        }

        // Surface flora (flowers, tall grass, dead bushes)
        if (surfaceY >= WorldGenerator.SEA_LEVEL && surfaceY < sy - 6) {
          const floraHash = Math.abs(Math.sin(wx * 93.1 + wz * 23.7) * 9876.54);
          const floraVal = floraHash - Math.floor(floraHash);
          const aboveIdx = getIndex(lx, surfaceY + 1, lz);

          if (data[aboveIdx] === BlockType.AIR) {
            if (biome === 'desert' && floraVal < 0.02) {
              // Cactus
              data[aboveIdx] = BlockType.CACTUS;
              if (surfaceY + 2 < sy) data[getIndex(lx, surfaceY + 2, lz)] = BlockType.CACTUS;
            } else if (biome === 'plains') {
              if (floraVal < 0.025) {
                data[aboveIdx] = BlockType.ROSE;
              } else if (floraVal < 0.05) {
                data[aboveIdx] = BlockType.DANDELION;
              }
            }
          }
        }
      }
    }

    // Place trees and structures deterministically inside chunk
    this.decorateChunk(chunkX, chunkZ, data);

    return data;
  }

  // Decorate chunk with trees & dungeon structures
  private decorateChunk(chunkX: number, chunkZ: number, data: Uint8Array) {
    const sx = WorldGenerator.CHUNK_SIZE_X;
    const sz = WorldGenerator.CHUNK_SIZE_Z;
    const sy = WorldGenerator.CHUNK_HEIGHT;
    const getIndex = (x: number, y: number, z: number) => (y * sz + z) * sx + x;

    const chunkRng = new SeededRandom(this.seed + chunkX * 31337 + chunkZ * 71939);

    // Number of trees per chunk based on biome
    const centerBiome = this.getBiome(chunkX * sx + 8, chunkZ * sz + 8);
    let treeCount = 0;
    if (centerBiome === 'forest') treeCount = chunkRng.nextInt(4, 7);
    else if (centerBiome === 'plains') treeCount = chunkRng.nextInt(0, 2);
    else if (centerBiome === 'taiga') treeCount = chunkRng.nextInt(3, 5);

    for (let t = 0; t < treeCount; t++) {
      const tx = chunkRng.nextInt(3, sx - 4);
      const tz = chunkRng.nextInt(3, sz - 4);
      const wx = chunkX * sx + tx;
      const wz = chunkZ * sz + tz;
      const groundY = this.getHeight(wx, wz);

      if (groundY < WorldGenerator.SEA_LEVEL || groundY > sy - 9) continue;
      if (data[getIndex(tx, groundY, tz)] !== BlockType.GRASS) continue;

      const isBirch = centerBiome === 'forest' && chunkRng.next() > 0.6;
      const isSpruce = centerBiome === 'taiga';
      const logType = isSpruce ? BlockType.SPRUCE_LOG : isBirch ? BlockType.BIRCH_LOG : BlockType.OAK_LOG;
      const leafType = isSpruce ? BlockType.SPRUCE_LEAVES : BlockType.OAK_LEAVES;
      const trunkHeight = isSpruce ? chunkRng.nextInt(5, 7) : chunkRng.nextInt(4, 6);

      // Wood trunk
      for (let h = 1; h <= trunkHeight; h++) {
        data[getIndex(tx, groundY + h, tz)] = logType;
      }

      // Foliage canopy
      const topY = groundY + trunkHeight;
      for (let dy = -1; dy <= 1; dy++) {
        const radius = dy === 1 ? 1 : 2;
        for (let dx = -radius; dx <= radius; dx++) {
          for (let dz = -radius; dz <= radius; dz++) {
            if (dx === 0 && dz === 0 && dy < 1) continue;
            const fx = tx + dx;
            const fz = tz + dz;
            const fy = topY + dy;
            if (fx >= 0 && fx < sx && fz >= 0 && fz < sz && fy < sy) {
              const fIdx = getIndex(fx, fy, fz);
              if (data[fIdx] === BlockType.AIR) {
                data[fIdx] = leafType;
              }
            }
          }
        }
      }
    }

    // Rare Abandoned Dungeon / Structure generation (~3% of chunks)
    if (chunkRng.next() < 0.035 && this.worldType !== 'flat') {
      const dungeonY = chunkRng.nextInt(8, 20);
      const dx0 = 4, dz0 = 4;
      const dWidth = 6, dLength = 6, dHeight = 4;

      for (let dx = 0; dx < dWidth; dx++) {
        for (let dz = 0; dz < dLength; dz++) {
          for (let dy = 0; dy < dHeight; dy++) {
            const x = dx0 + dx;
            const y = dungeonY + dy;
            const z = dz0 + dz;
            const idx = getIndex(x, y, z);

            const isWall = dx === 0 || dx === dWidth - 1 || dz === 0 || dz === dLength - 1 || dy === 0 || dy === dHeight - 1;
            if (isWall) {
              data[idx] = chunkRng.next() > 0.4 ? BlockType.MOSSY_COBBLESTONE : BlockType.COBBLESTONE;
            } else {
              data[idx] = BlockType.AIR;
            }
          }
        }
      }

      // Place Chest & Torches inside dungeon
      const chestIdx = getIndex(dx0 + 2, dungeonY + 1, dz0 + 2);
      data[chestIdx] = BlockType.CHEST;
      data[getIndex(dx0 + 1, dungeonY + 2, dz0 + 1)] = BlockType.TORCH;
      data[getIndex(dx0 + 4, dungeonY + 2, dz0 + 4)] = BlockType.TORCH;
    }
  }
}
