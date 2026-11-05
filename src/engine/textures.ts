/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';

// 16x16 pixel art generator for Minecraft Java-style voxel textures
export class TextureManager {
  private static instance: TextureManager;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private atlasTexture: THREE.CanvasTexture | null = null;
  public atlasColumns = 16;
  public atlasRows = 16;
  public tileSize = 16;
  private activePackType: 'vanilla' | 'smooth' | 'high_contrast' | 'retro' = 'vanilla';

  private constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.atlasColumns * this.tileSize; // 256
    this.canvas.height = this.atlasRows * this.tileSize;  // 256
    const ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('Failed to get 2D context for texture atlas');
    this.ctx = ctx;
    this.generateAtlas('vanilla');
  }

  public static getInstance(): TextureManager {
    if (!TextureManager.instance) {
      TextureManager.instance = new TextureManager();
    }
    return TextureManager.instance;
  }

  public setResourcePack(packType: 'vanilla' | 'smooth' | 'high_contrast' | 'retro') {
    this.activePackType = packType;
    this.generateAtlas(packType);
    if (this.atlasTexture) {
      this.atlasTexture.needsUpdate = true;
    }
  }

  public getActivePackType() {
    return this.activePackType;
  }

  public getAtlasTexture(): THREE.CanvasTexture {
    if (!this.atlasTexture) {
      this.atlasTexture = new THREE.CanvasTexture(this.canvas);
      this.atlasTexture.magFilter = THREE.NearestFilter;
      this.atlasTexture.minFilter = THREE.NearestMipmapNearestFilter;
      this.atlasTexture.generateMipmaps = true;
      this.atlasTexture.colorSpace = THREE.SRGBColorSpace;
    }
    return this.atlasTexture;
  }

  // Helper to draw a single 16x16 tile at index
  private drawTile(
    index: number,
    generator: (ctx: CanvasRenderingContext2D, x: number, y: number, s: number) => void
  ) {
    const col = index % this.atlasColumns;
    const row = Math.floor(index / this.atlasColumns);
    const px = col * this.tileSize;
    const py = row * this.tileSize;

    this.ctx.save();
    generator(this.ctx, px, py, this.tileSize);
    this.ctx.restore();
  }

  // Simple pseudo-random helper for deterministic pixel noise
  private noise(seed: number) {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  }

  private generateAtlas(style: 'vanilla' | 'smooth' | 'high_contrast' | 'retro') {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Style adjustments
    const contrast = style === 'high_contrast' ? 1.4 : style === 'retro' ? 1.6 : style === 'smooth' ? 0.3 : 1.0;

    // 0: Grass Top (Vibrant green with slight speckles)
    this.drawTile(0, (ctx, x, y, s) => {
      for (let py = 0; py < s; py++) {
        for (let px = 0; px < s; px++) {
          const n = (this.noise(px * 13 + py * 7) - 0.5) * 20 * contrast;
          const r = Math.max(0, Math.min(255, 75 + n));
          const g = Math.max(0, Math.min(255, 140 + n * 1.2));
          const b = Math.max(0, Math.min(255, 45 + n * 0.8));
          ctx.fillStyle = `rgb(${r},${g},${b})`;
          ctx.fillRect(x + px, y + py, 1, 1);
        }
      }
    });

    // 1: Grass Side (Dirt with green jagged overhang)
    this.drawTile(1, (ctx, x, y, s) => {
      // First fill dirt base
      for (let py = 0; py < s; py++) {
        for (let px = 0; px < s; px++) {
          const n = (this.noise(px * 29 + py * 41) - 0.5) * 26 * contrast;
          const r = Math.max(0, Math.min(255, 118 + n));
          const g = Math.max(0, Math.min(255, 85 + n * 0.8));
          const b = Math.max(0, Math.min(255, 55 + n * 0.6));
          ctx.fillStyle = `rgb(${r},${g},${b})`;
          ctx.fillRect(x + px, y + py, 1, 1);
        }
      }
      // Top grass fringe
      const fringeDepths = [3, 4, 3, 5, 4, 3, 4, 5, 3, 4, 3, 4, 5, 4, 3, 4];
      for (let px = 0; px < s; px++) {
        const depth = fringeDepths[px];
        for (let py = 0; py < depth; py++) {
          const n = (this.noise(px * 17 + py * 19) - 0.5) * 16 * contrast;
          ctx.fillStyle = `rgb(${75 + n},${135 + n},${45 + n})`;
          ctx.fillRect(x + px, y + py, 1, 1);
        }
      }
    });

    // 2: Dirt (Rich brown soil)
    this.drawTile(2, (ctx, x, y, s) => {
      for (let py = 0; py < s; py++) {
        for (let px = 0; px < s; px++) {
          const n = (this.noise(px * 37 + py * 59) - 0.5) * 28 * contrast;
          const r = Math.max(0, Math.min(255, 118 + n));
          const g = Math.max(0, Math.min(255, 85 + n * 0.8));
          const b = Math.max(0, Math.min(255, 55 + n * 0.6));
          ctx.fillStyle = `rgb(${r},${g},${b})`;
          ctx.fillRect(x + px, y + py, 1, 1);
        }
      }
    });

    // 3: Stone (Smooth natural grey with fissures)
    this.drawTile(3, (ctx, x, y, s) => {
      for (let py = 0; py < s; py++) {
        for (let px = 0; px < s; px++) {
          const n = (this.noise(px * 43 + py * 71) - 0.5) * 24 * contrast;
          const val = Math.max(0, Math.min(255, 125 + n));
          ctx.fillStyle = `rgb(${val},${val},${val})`;
          ctx.fillRect(x + px, y + py, 1, 1);
        }
      }
    });

    // 4: Cobblestone (Rough chiseled stone bricks)
    this.drawTile(4, (ctx, x, y, s) => {
      ctx.fillStyle = '#6e6e6e';
      ctx.fillRect(x, y, s, s);
      for (let py = 0; py < s; py++) {
        for (let px = 0; px < s; px++) {
          const isBorder = (px % 4 === 0 && py % 4 !== 0) || (py % 4 === 0);
          const n = (this.noise(px * 23 + py * 31) - 0.5) * 40 * contrast;
          const val = isBorder ? 65 + n * 0.5 : 120 + n;
          const clamped = Math.max(0, Math.min(255, val));
          ctx.fillStyle = `rgb(${clamped},${clamped},${clamped})`;
          ctx.fillRect(x + px, y + py, 1, 1);
        }
      }
    });

    // 5: Bedrock (Dark mottled indestructible layer)
    this.drawTile(5, (ctx, x, y, s) => {
      for (let py = 0; py < s; py++) {
        for (let px = 0; px < s; px++) {
          const n = (this.noise(px * 11 + py * 89) - 0.5) * 60;
          const val = Math.max(15, Math.min(80, 40 + n));
          ctx.fillStyle = `rgb(${val},${val},${val})`;
          ctx.fillRect(x + px, y + py, 1, 1);
        }
      }
    });

    // 6: Sand (Warm golden grains)
    this.drawTile(6, (ctx, x, y, s) => {
      for (let py = 0; py < s; py++) {
        for (let px = 0; px < s; px++) {
          const n = (this.noise(px * 19 + py * 73) - 0.5) * 20 * contrast;
          const r = Math.max(0, Math.min(255, 218 + n));
          const g = Math.max(0, Math.min(255, 198 + n * 0.9));
          const b = Math.max(0, Math.min(255, 148 + n * 0.7));
          ctx.fillStyle = `rgb(${r},${g},${b})`;
          ctx.fillRect(x + px, y + py, 1, 1);
        }
      }
    });

    // 7: Oak Log Side (Tree bark with vertical furrow lines)
    this.drawTile(7, (ctx, x, y, s) => {
      for (let py = 0; py < s; py++) {
        for (let px = 0; px < s; px++) {
          const furrow = (px % 3 === 0 ? -25 : 10) * contrast;
          const n = (this.noise(px * 13 + py * 97) - 0.5) * 20;
          const r = Math.max(0, Math.min(255, 105 + furrow + n));
          const g = Math.max(0, Math.min(255, 80 + furrow * 0.8 + n * 0.8));
          const b = Math.max(0, Math.min(255, 50 + furrow * 0.6 + n * 0.6));
          ctx.fillStyle = `rgb(${r},${g},${b})`;
          ctx.fillRect(x + px, y + py, 1, 1);
        }
      }
    });

    // 8: Oak Log Top (Annual concentric rings)
    this.drawTile(8, (ctx, x, y, s) => {
      const cx = 7.5, cy = 7.5;
      for (let py = 0; py < s; py++) {
        for (let px = 0; px < s; px++) {
          const dist = Math.hypot(px - cx, py - cy);
          const isBark = dist > 6.2;
          if (isBark) {
            ctx.fillStyle = '#5c4028';
          } else {
            const ring = Math.sin(dist * 2.2) * 15 * contrast;
            ctx.fillStyle = `rgb(${165 + ring},${135 + ring * 0.8},${95 + ring * 0.6})`;
          }
          ctx.fillRect(x + px, y + py, 1, 1);
        }
      }
    });

    // 9: Oak Planks (Horizontal milled lumber boards)
    this.drawTile(9, (ctx, x, y, s) => {
      for (let py = 0; py < s; py++) {
        for (let px = 0; px < s; px++) {
          const isSeam = py % 4 === 0;
          const n = (this.noise(px * 17 + py * 29) - 0.5) * 18 * contrast;
          const r = Math.max(0, Math.min(255, (isSeam ? 110 : 162) + n));
          const g = Math.max(0, Math.min(255, (isSeam ? 85 : 130) + n * 0.8));
          const b = Math.max(0, Math.min(255, (isSeam ? 50 : 85) + n * 0.6));
          ctx.fillStyle = `rgb(${r},${g},${b})`;
          ctx.fillRect(x + px, y + py, 1, 1);
        }
      }
    });

    // 10: Oak Leaves (Semi-transparent foliage with cutout pixels)
    this.drawTile(10, (ctx, x, y, s) => {
      ctx.clearRect(x, y, s, s);
      for (let py = 0; py < s; py++) {
        for (let px = 0; px < s; px++) {
          const isHole = (px * 7 + py * 11) % 5 === 0;
          if (!isHole) {
            const n = (this.noise(px * 23 + py * 41) - 0.5) * 35 * contrast;
            ctx.fillStyle = `rgb(${40 + n},${115 + n * 1.2},${35 + n * 0.8})`;
            ctx.fillRect(x + px, y + py, 1, 1);
          }
        }
      }
    });

    // 11: Glass (Translucent pale cyan with frame)
    this.drawTile(11, (ctx, x, y, s) => {
      ctx.clearRect(x, y, s, s);
      ctx.fillStyle = 'rgba(215, 240, 255, 0.25)';
      ctx.fillRect(x, y, s, s);

      // Frame
      ctx.fillStyle = 'rgba(240, 250, 255, 0.85)';
      ctx.strokeRect(x + 0.5, y + 0.5, s - 1, s - 1);

      // Glass specular reflection highlights
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fillRect(x + 2, y + 2, 2, 1);
      ctx.fillRect(x + 4, y + 4, 3, 1);
      ctx.fillRect(x + 11, y + 11, 2, 1);
    });

    // 12: Water (Animated vibrant azure blue)
    this.drawTile(12, (ctx, x, y, s) => {
      for (let py = 0; py < s; py++) {
        for (let px = 0; px < s; px++) {
          const wave = Math.sin((px + py) * 0.8) * 20;
          const r = Math.max(0, Math.min(255, 30 + wave * 0.5));
          const g = Math.max(0, Math.min(255, 95 + wave * 0.8));
          const b = Math.max(0, Math.min(255, 215 + wave));
          ctx.fillStyle = `rgba(${r},${g},${b}, 0.75)`;
          ctx.fillRect(x + px, y + py, 1, 1);
        }
      }
    });

    // 13: Lava (Glowing orange magma)
    this.drawTile(13, (ctx, x, y, s) => {
      for (let py = 0; py < s; py++) {
        for (let px = 0; px < s; px++) {
          const heat = (this.noise(px * 19 + py * 23) - 0.5) * 50;
          const r = Math.max(200, Math.min(255, 240 + heat));
          const g = Math.max(50, Math.min(200, 110 + heat * 1.5));
          const b = Math.max(0, Math.min(80, 20 + heat * 0.5));
          ctx.fillStyle = `rgb(${r},${g},${b})`;
          ctx.fillRect(x + px, y + py, 1, 1);
        }
      }
    });

    // Ore Helper
    const drawOre = (index: number, gemColor: string, gemBorder: string, seed: number) => {
      this.drawTile(index, (ctx, x, y, s) => {
        // Base stone
        for (let py = 0; py < s; py++) {
          for (let px = 0; px < s; px++) {
            const n = (this.noise(px * 43 + py * 71) - 0.5) * 24 * contrast;
            const val = Math.max(0, Math.min(255, 125 + n));
            ctx.fillStyle = `rgb(${val},${val},${val})`;
            ctx.fillRect(x + px, y + py, 1, 1);
          }
        }
        // Gem clusters
        const spots = [
          [3, 4], [4, 4], [4, 5],
          [10, 3], [11, 3], [10, 4],
          [6, 9], [7, 9], [7, 10], [8, 10],
          [12, 11], [13, 11]
        ];
        for (const [gx, gy] of spots) {
          ctx.fillStyle = style === 'high_contrast' ? '#ffffff' : gemBorder;
          ctx.fillRect(x + gx - 1, y + gy, 3, 1);
          ctx.fillRect(x + gx, y + gy - 1, 1, 3);
          ctx.fillStyle = gemColor;
          ctx.fillRect(x + gx, y + gy, 1, 1);
        }
      });
    };

    // 14: Coal Ore
    drawOre(14, '#242424', '#111111', 1);
    // 15: Iron Ore
    drawOre(15, '#d8af93', '#8f6850', 2);
    // 16: Gold Ore
    drawOre(16, '#fcee4b', '#b3951f', 3);
    // 17: Diamond Ore
    drawOre(17, '#5dfdfc', '#2c8f8e', 4);
    // 18: Redstone Ore
    drawOre(18, '#ff2200', '#990000', 5);
    // 19: Emerald Ore
    drawOre(19, '#17dd62', '#0f7d38', 6);

    // 20: Crafting Table Top
    this.drawTile(20, (ctx, x, y, s) => {
      // Wood base
      ctx.fillStyle = '#a07844';
      ctx.fillRect(x, y, s, s);
      // Grid lines
      ctx.strokeStyle = '#573d1f';
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 2.5, y + 2.5, 11, 11);
      ctx.beginPath();
      ctx.moveTo(x + 6, y + 2.5); ctx.lineTo(x + 6, y + 13.5);
      ctx.moveTo(x + 10, y + 2.5); ctx.lineTo(x + 10, y + 13.5);
      ctx.moveTo(x + 2.5, y + 6); ctx.lineTo(x + 13.5, y + 6);
      ctx.moveTo(x + 2.5, y + 10); ctx.lineTo(x + 13.5, y + 10);
      ctx.stroke();
    });

    // 21: Crafting Table Side
    this.drawTile(21, (ctx, x, y, s) => {
      ctx.fillStyle = '#a07844';
      ctx.fillRect(x, y, s, s);
      // Saw / Hammer silhouette
      ctx.fillStyle = '#444';
      ctx.fillRect(x + 4, y + 4, 8, 3);
      ctx.fillStyle = '#8b5a2b';
      ctx.fillRect(x + 7, y + 7, 2, 6);
    });

    // 22: Furnace Front
    this.drawTile(22, (ctx, x, y, s) => {
      ctx.fillStyle = '#7a7a7a';
      ctx.fillRect(x, y, s, s);
      ctx.fillStyle = '#222';
      ctx.fillRect(x + 3, y + 4, 10, 8);
      // Grate bars
      ctx.fillStyle = '#444';
      ctx.fillRect(x + 4, y + 6, 8, 1);
      ctx.fillRect(x + 4, y + 9, 8, 1);
    });

    // 23: Chest Top / Front
    this.drawTile(23, (ctx, x, y, s) => {
      ctx.fillStyle = '#8f683a';
      ctx.fillRect(x, y, s, s);
      ctx.fillStyle = '#5c4028';
      ctx.strokeRect(x + 0.5, y + 0.5, s - 1, s - 1);
      // Metal latch
      ctx.fillStyle = '#dcdcdc';
      ctx.fillRect(x + 7, y + 6, 2, 4);
    });

    // 24: Torch
    this.drawTile(24, (ctx, x, y, s) => {
      ctx.clearRect(x, y, s, s);
      // Wooden stick
      ctx.fillStyle = '#7a542b';
      ctx.fillRect(x + 7, y + 6, 2, 9);
      // Charcoal tip
      ctx.fillStyle = '#3a2410';
      ctx.fillRect(x + 7, y + 4, 2, 2);
      // Flame glow
      ctx.fillStyle = '#ffaa00';
      ctx.fillRect(x + 6, y + 2, 4, 3);
      ctx.fillStyle = '#ffee44';
      ctx.fillRect(x + 7, y + 1, 2, 2);
    });

    // 25: Bricks
    this.drawTile(25, (ctx, x, y, s) => {
      ctx.fillStyle = '#cfcfcf'; // Mortar
      ctx.fillRect(x, y, s, s);
      ctx.fillStyle = '#9c4333'; // Red bricks
      // Row 1
      ctx.fillRect(x, y, 7, 3);
      ctx.fillRect(x + 8, y, 8, 3);
      // Row 2
      ctx.fillRect(x, y + 4, 3, 3);
      ctx.fillRect(x + 4, y + 4, 7, 3);
      ctx.fillRect(x + 12, y + 4, 4, 3);
      // Row 3
      ctx.fillRect(x, y + 8, 7, 3);
      ctx.fillRect(x + 8, y + 8, 8, 3);
      // Row 4
      ctx.fillRect(x, y + 12, 3, 3);
      ctx.fillRect(x + 4, y + 12, 7, 3);
      ctx.fillRect(x + 12, y + 12, 4, 3);
    });

    // 26: TNT
    this.drawTile(26, (ctx, x, y, s) => {
      ctx.fillStyle = '#c72d24';
      ctx.fillRect(x, y, s, s);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x, y + 5, s, 6);
      ctx.fillStyle = '#111';
      ctx.font = 'bold 5px monospace';
      ctx.fillText('TNT', x + 2, y + 10);
    });

    // 27: Bookshelf
    this.drawTile(27, (ctx, x, y, s) => {
      // Wood plank frame
      ctx.fillStyle = '#a07844';
      ctx.fillRect(x, y, s, s);
      // Books rows
      const bookColors = ['#a83232', '#3266a8', '#32a852', '#a89c32', '#6b32a8'];
      for (let row = 0; row < 2; row++) {
        const by = y + 2 + row * 7;
        ctx.fillStyle = '#1e140a';
        ctx.fillRect(x + 1, by, 14, 5);
        for (let b = 0; b < 6; b++) {
          ctx.fillStyle = bookColors[(b + row * 2) % bookColors.length];
          ctx.fillRect(x + 2 + b * 2, by + 1, 2, 4);
        }
      }
    });

    // 28: Cactus
    this.drawTile(28, (ctx, x, y, s) => {
      ctx.fillStyle = '#4c7a2b';
      ctx.fillRect(x, y, s, s);
      // Dark vertical ribs
      ctx.fillStyle = '#37571f';
      ctx.fillRect(x + 3, y, 2, s);
      ctx.fillRect(x + 8, y, 2, s);
      ctx.fillRect(x + 13, y, 2, s);
      // Needles
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(x + 2, y + 3, 1, 1);
      ctx.fillRect(x + 7, y + 8, 1, 1);
      ctx.fillRect(x + 12, y + 13, 1, 1);
    });

    // 29: Snow Block
    this.drawTile(29, (ctx, x, y, s) => {
      for (let py = 0; py < s; py++) {
        for (let px = 0; px < s; px++) {
          const n = (this.noise(px * 19 + py * 23) - 0.5) * 12;
          const val = Math.max(225, Math.min(255, 245 + n));
          ctx.fillStyle = `rgb(${val},${val + 3},${val + 8})`;
          ctx.fillRect(x + px, y + py, 1, 1);
        }
      }
    });

    // 30: Ice
    this.drawTile(30, (ctx, x, y, s) => {
      ctx.fillStyle = 'rgba(160, 210, 255, 0.7)';
      ctx.fillRect(x, y, s, s);
      // Crystal fractures
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.beginPath();
      ctx.moveTo(x + 2, y + 1); ctx.lineTo(x + 8, y + 7);
      ctx.moveTo(x + 8, y + 7); ctx.lineTo(x + 14, y + 5);
      ctx.stroke();
    });

    // 31: Obsidian
    this.drawTile(31, (ctx, x, y, s) => {
      for (let py = 0; py < s; py++) {
        for (let px = 0; px < s; px++) {
          const n = (this.noise(px * 29 + py * 31) - 0.5) * 30;
          ctx.fillStyle = `rgb(${25 + n * 0.5},${15 + n * 0.3},${35 + n})`;
          ctx.fillRect(x + px, y + py, 1, 1);
        }
      }
    });

    // 32: Birch Log Side (White with black horizontal markings)
    this.drawTile(32, (ctx, x, y, s) => {
      ctx.fillStyle = '#dbdbdb';
      ctx.fillRect(x, y, s, s);
      // Black birch spots
      ctx.fillStyle = '#333';
      ctx.fillRect(x + 2, y + 3, 3, 1);
      ctx.fillRect(x + 10, y + 5, 4, 1);
      ctx.fillRect(x + 4, y + 10, 5, 1);
      ctx.fillRect(x + 11, y + 13, 3, 1);
    });

    // 33: Spruce Log Side (Dark brown bark)
    this.drawTile(33, (ctx, x, y, s) => {
      for (let py = 0; py < s; py++) {
        for (let px = 0; px < s; px++) {
          const n = (this.noise(px * 17 + py * 19) - 0.5) * 20;
          ctx.fillStyle = `rgb(${60 + n},${45 + n * 0.8},${30 + n * 0.6})`;
          ctx.fillRect(x + px, y + py, 1, 1);
        }
      }
    });

    // 34: Spruce Leaves (Dark pine green needles)
    this.drawTile(34, (ctx, x, y, s) => {
      ctx.clearRect(x, y, s, s);
      for (let py = 0; py < s; py++) {
        for (let px = 0; px < s; px++) {
          if ((px * 3 + py * 7) % 4 !== 0) {
            const n = (this.noise(px * 13 + py * 17) - 0.5) * 20;
            ctx.fillStyle = `rgb(${25 + n},${65 + n},${30 + n})`;
            ctx.fillRect(x + px, y + py, 1, 1);
          }
        }
      }
    });

    // 35: Rose Flower
    this.drawTile(35, (ctx, x, y, s) => {
      ctx.clearRect(x, y, s, s);
      // Stem
      ctx.fillStyle = '#3a7d2b';
      ctx.fillRect(x + 7, y + 8, 2, 7);
      // Flower head
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(x + 6, y + 4, 4, 4);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(x + 7, y + 5, 2, 2);
    });

    // 36: Dandelion Flower
    this.drawTile(36, (ctx, x, y, s) => {
      ctx.clearRect(x, y, s, s);
      ctx.fillStyle = '#3a7d2b';
      ctx.fillRect(x + 7, y + 8, 2, 7);
      ctx.fillStyle = '#eab308';
      ctx.fillRect(x + 6, y + 4, 4, 4);
      ctx.fillStyle = '#fde047';
      ctx.fillRect(x + 7, y + 5, 2, 2);
    });
  }

  // Returns UV coordinates [uMin, vMin, uMax, vMax] for a given tile index
  public getTileUV(index: number): [number, number, number, number] {
    const col = index % this.atlasColumns;
    const row = Math.floor(index / this.atlasColumns);

    const uMin = col / this.atlasColumns;
    const uMax = (col + 1) / this.atlasColumns;
    // Note: In Three.js CanvasTexture, V=0 is bottom, V=1 is top
    const vMax = 1.0 - row / this.atlasRows;
    const vMin = 1.0 - (row + 1) / this.atlasRows;

    return [uMin, vMin, uMax, vMax];
  }
}
