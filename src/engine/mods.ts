/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PluginItem, ResourcePack, BlockType } from '../types/game';
import { modrinthService } from './modrinth';
import { TextureManager } from './textures';

export interface CommandContext {
  args: string[];
  setGameMode: (mode: 'survival' | 'creative') => void;
  setTimeOfDay: (time: number) => void;
  setWeather: (w: 'clear' | 'rain' | 'thunder') => void;
  teleportPlayer: (x: number, y: number, z: number) => void;
  giveItem: (itemId: string, count: number) => void;
  spawnMob: (type: string) => void;
  addChatMessage: (msg: { sender: string; text: string; color?: string }) => void;
}

export class ModLoader {
  private static instance: ModLoader;
  public logs: string[] = [];
  public activeProfile: string = 'Default';
  public profiles: string[] = ['Default', 'Performance OptiBoost', 'Adventure RPG', 'Creative Sandbox'];

  // Built-in Plugins
  public plugins: PluginItem[] = [
    {
      id: 'core-commands',
      name: 'Essential Server Commands',
      version: '1.4.0',
      description: 'Standard admin commands: /gamemode, /time, /weather, /tp, /give, /spawnmob, /help',
      author: 'ARHAM Core Team',
      enabled: true,
      commands: ['/gamemode', '/time', '/weather', '/tp', '/give', '/spawnmob', '/help', '/seed'],
    },
    {
      id: 'economy-shop',
      name: 'Voxel Economy & Trading',
      version: '1.0.2',
      description: 'Emerald-based currency and merchant villager trading shop system.',
      author: 'TradeMaster',
      enabled: true,
      commands: ['/balance', '/pay', '/shop'],
    },
    {
      id: 'anti-creeper-grief',
      name: 'Safe Zones & Anti-Grief',
      version: '1.1.0',
      description: 'Protects player structures by confining creeper explosions to entity damage only.',
      author: 'SecurityGuard',
      enabled: false,
      commands: ['/protect', '/claim'],
    },
  ];

  // Resource Packs
  public resourcePacks: ResourcePack[] = [
    {
      id: 'arham-vanilla',
      name: 'ARHAM-MC Vanilla Default',
      description: 'The standard authentic 16x16 vibrant pixel textures for all blocks, tools, and mobs.',
      author: 'ARHAM Studios',
      version: '1.21.0',
      resolution: '16x16',
      icon: '🌿',
      isActive: true,
      priority: 1,
      type: 'vanilla',
    },
    {
      id: 'arham-smooth',
      name: 'Smooth Voxel & Clean Minimal',
      description: 'Clean modern pastel gradients with minimal block noise for a clean aesthetic.',
      author: 'PastelCraft',
      version: '1.4.0',
      resolution: '16x16',
      icon: '🎨',
      isActive: false,
      priority: 2,
      type: 'smooth',
    },
    {
      id: 'arham-high-contrast',
      name: 'High Contrast Glowing Ores',
      description: 'High visibility ore border outlines and dark inventory theme for pro miners.',
      author: 'OreFinder Pro',
      version: '2.0.1',
      resolution: '16x16',
      icon: '💎',
      isActive: false,
      priority: 3,
      type: 'high_contrast',
    },
    {
      id: 'arham-retro',
      name: 'Retro 8-Bit Nostalgia',
      description: 'Deep saturated nostalgic palette with classic arcade dithering.',
      author: 'ArcadeBit',
      version: '1.0.0',
      resolution: '8x8',
      icon: '👾',
      isActive: false,
      priority: 4,
      type: 'retro',
    },
  ];

  private constructor() {
    this.addLog('[ARHAM-MC Mod Loader] Initializing Mod Runtime System v2.4.0...');
    this.addLog('[ARHAM-MC Mod Loader] Scanning active mod directory...');
    this.addLog('[ARHAM-MC Mod Loader] Loaded 6 native ARHAM mods, 3 server plugins.');
    this.addLog('[ARHAM-MC Mod Loader] Sandboxed Three.js voxel execution environment ready.');
  }

  public static getInstance(): ModLoader {
    if (!ModLoader.instance) {
      ModLoader.instance = new ModLoader();
    }
    return ModLoader.instance;
  }

  public addLog(entry: string) {
    const timestamp = new Date().toLocaleTimeString();
    this.logs.push(`[${timestamp}] ${entry}`);
    if (this.logs.length > 100) this.logs.shift();
  }

  public setResourcePack(packId: string) {
    this.resourcePacks.forEach(p => {
      p.isActive = p.id === packId;
    });
    const active = this.resourcePacks.find(p => p.isActive);
    if (active) {
      TextureManager.getInstance().setResourcePack(active.type);
      this.addLog(`[Resource Pack] Activated pack "${active.name}" (${active.resolution})`);
    }
  }

  public executeCommand(input: string, ctx: CommandContext): boolean {
    const trimmed = input.trim();
    if (!trimmed.startsWith('/')) return false;

    const parts = trimmed.slice(1).split(/\s+/);
    const cmd = parts[0]?.toLowerCase();
    const args = parts.slice(1);

    this.addLog(`[Command] Player executed: /${cmd} ${args.join(' ')}`);

    switch (cmd) {
      case 'gamemode':
      case 'gm': {
        const mode = args[0]?.toLowerCase();
        if (mode === 'c' || mode === 'creative' || mode === '1') {
          ctx.setGameMode('creative');
          ctx.addChatMessage({ sender: 'System', text: 'Set game mode to Creative Mode.', color: '#4ade80' });
        } else if (mode === 's' || mode === 'survival' || mode === '0') {
          ctx.setGameMode('survival');
          ctx.addChatMessage({ sender: 'System', text: 'Set game mode to Survival Mode.', color: '#4ade80' });
        } else {
          ctx.addChatMessage({ sender: 'System', text: 'Usage: /gamemode <survival|creative>', color: '#f87171' });
        }
        return true;
      }

      case 'time': {
        const sub = args[0]?.toLowerCase();
        if (sub === 'set') {
          const val = args[1]?.toLowerCase();
          if (val === 'day') {
            ctx.setTimeOfDay(6000);
            ctx.addChatMessage({ sender: 'System', text: 'Set time to Day (6000 ticks).', color: '#facc15' });
          } else if (val === 'night') {
            ctx.setTimeOfDay(18000);
            ctx.addChatMessage({ sender: 'System', text: 'Set time to Night (18000 ticks).', color: '#60a5fa' });
          } else if (val === 'noon') {
            ctx.setTimeOfDay(12000);
            ctx.addChatMessage({ sender: 'System', text: 'Set time to Noon (12000 ticks).', color: '#facc15' });
          } else {
            const num = parseInt(val, 10);
            if (!isNaN(num)) {
              ctx.setTimeOfDay(num % 24000);
              ctx.addChatMessage({ sender: 'System', text: `Set time to ${num} ticks.`, color: '#facc15' });
            }
          }
        } else {
          ctx.addChatMessage({ sender: 'System', text: 'Usage: /time set <day|night|noon|<ticks>>', color: '#f87171' });
        }
        return true;
      }

      case 'weather': {
        const w = args[0]?.toLowerCase();
        if (w === 'clear' || w === 'sun') {
          ctx.setWeather('clear');
          ctx.addChatMessage({ sender: 'System', text: 'Set weather to Clear skies.', color: '#38bdf8' });
        } else if (w === 'rain') {
          ctx.setWeather('rain');
          ctx.addChatMessage({ sender: 'System', text: 'Set weather to Rain.', color: '#60a5fa' });
        } else if (w === 'thunder') {
          ctx.setWeather('thunder');
          ctx.addChatMessage({ sender: 'System', text: 'Set weather to Thunderstorm.', color: '#c084fc' });
        } else {
          ctx.addChatMessage({ sender: 'System', text: 'Usage: /weather <clear|rain|thunder>', color: '#f87171' });
        }
        return true;
      }

      case 'tp':
      case 'teleport': {
        const x = parseFloat(args[0]);
        const y = parseFloat(args[1]);
        const z = parseFloat(args[2]);
        if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
          ctx.teleportPlayer(x, y, z);
          ctx.addChatMessage({ sender: 'System', text: `Teleported to (${x.toFixed(1)}, ${y.toFixed(1)}, ${z.toFixed(1)})`, color: '#a78bfa' });
        } else {
          ctx.addChatMessage({ sender: 'System', text: 'Usage: /tp <x> <y> <z>', color: '#f87171' });
        }
        return true;
      }

      case 'give': {
        const item = args[0];
        const count = parseInt(args[1], 10) || 1;
        if (item) {
          const itemId = item.includes(':') ? item : `item:${item}`;
          ctx.giveItem(itemId, count);
          ctx.addChatMessage({ sender: 'System', text: `Gave ${count} [${item}] to player.`, color: '#34d399' });
        } else {
          ctx.addChatMessage({ sender: 'System', text: 'Usage: /give <itemId> [count]', color: '#f87171' });
        }
        return true;
      }

      case 'spawnmob': {
        const type = args[0]?.toLowerCase() || 'zombie';
        ctx.spawnMob(type);
        ctx.addChatMessage({ sender: 'System', text: `Spawned mob: ${type}`, color: '#fb923c' });
        return true;
      }

      case 'help': {
        ctx.addChatMessage({ sender: 'Help', text: 'Available commands:', color: '#facc15' });
        ctx.addChatMessage({ sender: 'Help', text: '/gamemode <survival|creative> - Switch mode', color: '#e2e8f0' });
        ctx.addChatMessage({ sender: 'Help', text: '/time set <day|night> - Set time of day', color: '#e2e8f0' });
        ctx.addChatMessage({ sender: 'Help', text: '/weather <clear|rain|thunder> - Set weather', color: '#e2e8f0' });
        ctx.addChatMessage({ sender: 'Help', text: '/tp <x> <y> <z> - Teleport coordinates', color: '#e2e8f0' });
        ctx.addChatMessage({ sender: 'Help', text: '/give <item> [count] - Add items to inventory', color: '#e2e8f0' });
        ctx.addChatMessage({ sender: 'Help', text: '/spawnmob <cow|pig|zombie|creeper|enderman>', color: '#e2e8f0' });
        return true;
      }

      default:
        ctx.addChatMessage({ sender: 'System', text: `Unknown command: /${cmd}. Type /help for assistance.`, color: '#f87171' });
        return true;
    }
  }

  // Mod hook for block break (TreeCapitator, Fast Leaf Decay)
  public onBlockBreakHook(
    x: number,
    y: number,
    z: number,
    blockType: BlockType,
    breakBlockCallback: (bx: number, by: number, bz: number) => void,
    getBlock: (bx: number, by: number, bz: number) => BlockType
  ) {
    // TreeCapitator Mod hook
    if (modrinthService.isModEnabled('arham-treecapitator')) {
      if (blockType === BlockType.OAK_LOG || blockType === BlockType.BIRCH_LOG || blockType === BlockType.SPRUCE_LOG) {
        // Automatically chop wood blocks upwards!
        for (let dy = 1; dy <= 8; dy++) {
          const above = getBlock(x, y + dy, z);
          if (above === blockType) {
            breakBlockCallback(x, y + dy, z);
          } else {
            break;
          }
        }
      }
    }
  }
}

export const modLoader = ModLoader.getInstance();
