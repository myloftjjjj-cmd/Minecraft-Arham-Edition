/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ModItem, ModLoaderType } from '../types/game';

// Interface matching Modrinth API v2 search result
interface ModrinthSearchResult {
  hits: Array<{
    project_id: string;
    project_type: string;
    slug: string;
    author: string;
    title: string;
    description: string;
    categories: string[];
    display_categories: string[];
    versions: string[];
    downloads: number;
    follows: number;
    icon_url: string;
    date_created: string;
    date_modified: string;
    gallery: string[];
  }>;
  total_hits: number;
}

// Built-in ARHAM-MC Native Mods that run directly in the WebGL engine!
export const ARHAM_NATIVE_MODS: ModItem[] = [
  {
    id: 'arham-minimap',
    title: 'ARHAM Minimap & Waypoints',
    description: 'Real-time HUD radar minimap showing player direction, biome, coordinates, and nearby mob blips.',
    author: 'ArhamDev',
    downloads: 142850,
    follows: 9820,
    categories: ['Utility', 'Quality of Life'],
    loaders: ['arham', 'fabric'],
    versions: ['1.21.x', '1.20.x'],
    icon_url: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=128&auto=format&fit=crop&q=80',
    isArhamNative: true,
    installed: true,
    enabled: true,
    localVersion: '2.4.1',
  },
  {
    id: 'arham-dynamic-lights',
    title: 'Dynamic Handheld Lights',
    description: 'Torches, glowstone, and lava buckets held in hand or dropped on ground cast real dynamic ambient light in dark caves.',
    author: 'OptiTeam',
    downloads: 98400,
    follows: 6240,
    categories: ['Graphics', 'Shaders', 'Quality of Life'],
    loaders: ['arham', 'forge', 'fabric'],
    versions: ['1.21.x', '1.20.x'],
    icon_url: 'https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?w=128&auto=format&fit=crop&q=80',
    isArhamNative: true,
    installed: true,
    enabled: true,
    localVersion: '1.8.0',
  },
  {
    id: 'arham-treecapitator',
    title: 'Timber! TreeCapitator',
    description: 'Chop down entire trees by breaking just the bottom wood log with any axe tool. Saves time and adds leaf decay sound.',
    author: 'Woodcraft',
    downloads: 78500,
    follows: 4950,
    categories: ['Farming', 'Quality of Life'],
    loaders: ['arham', 'neoforge'],
    versions: ['1.21.x'],
    icon_url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=128&auto=format&fit=crop&q=80',
    isArhamNative: true,
    installed: false,
    enabled: false,
    localVersion: '3.1.0',
  },
  {
    id: 'arham-emerald-tools',
    title: 'Emerald Tools & Armor',
    description: 'Craft high-durability emerald pickaxes, swords, axes, and emerald armor sets using mined emeralds.',
    author: 'GemCrafter',
    downloads: 65200,
    follows: 3820,
    categories: ['Weapons', 'Armor', 'Technology'],
    loaders: ['arham', 'forge'],
    versions: ['1.21.x', '1.20.x'],
    icon_url: 'https://images.unsplash.com/photo-1599707367072-cd6ada2bc375?w=128&auto=format&fit=crop&q=80',
    isArhamNative: true,
    installed: true,
    enabled: true,
    localVersion: '1.2.0',
  },
  {
    id: 'arham-fast-leaves',
    title: 'Fast Leaf Decay',
    description: 'Leaves decay rapidly within 2 seconds once a tree trunk is harvested, dropping saplings, sticks, and apples.',
    author: 'SpeedyLeaves',
    downloads: 51200,
    follows: 3100,
    categories: ['Quality of Life', 'Performance'],
    loaders: ['arham', 'fabric', 'quilt'],
    versions: ['1.21.x'],
    icon_url: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?w=128&auto=format&fit=crop&q=80',
    isArhamNative: true,
    installed: true,
    enabled: true,
    localVersion: '1.5.0',
  },
  {
    id: 'arham-fps-boost',
    title: 'OptiVoxel: FPS Optimizer',
    description: 'Aggressive face culling, fast frustum check, memory pooling, and optimized lighting pipeline for mobile and low-end PCs.',
    author: 'JellySquidX',
    downloads: 312000,
    follows: 24500,
    categories: ['Performance', 'Optimization'],
    loaders: ['arham', 'fabric'],
    versions: ['1.21.x'],
    icon_url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=128&auto=format&fit=crop&q=80',
    isArhamNative: true,
    installed: true,
    enabled: true,
    localVersion: '0.6.2',
  },
];

class ModrinthService {
  private cache: Map<string, ModItem[]> = new Map();
  private installedMods: Map<string, ModItem> = new Map();
  private autoDiscoveryInterval: number | null = null;
  public lastSyncTime: number = Date.now();
  public isSyncing: boolean = false;
  private listeners: Set<() => void> = new Set();

  constructor() {
    // Load native installed mods
    ARHAM_NATIVE_MODS.forEach(mod => {
      if (mod.installed) {
        this.installedMods.set(mod.id, { ...mod });
      }
    });

    // Start auto-discovery sync loop (checks repositories periodically)
    this.startAutoDiscovery();
  }

  public subscribe(cb: () => void): () => void {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }

  private notify() {
    this.listeners.forEach(cb => cb());
  }

  // Automatic Background Mod Discovery Service
  public startAutoDiscovery() {
    // Run initial discovery check
    this.discoverLatestMods();

    // Re-check repositories every 3 minutes
    this.autoDiscoveryInterval = window.setInterval(() => {
      this.discoverLatestMods();
    }, 180000);
  }

  public async discoverLatestMods(): Promise<number> {
    this.isSyncing = true;
    this.notify();

    try {
      const res = await fetch(
        'https://api.modrinth.com/v2/search?limit=24&index=updated&facets=[["project_type:mod"]]'
      );
      if (res.ok) {
        const data: ModrinthSearchResult = await res.json();
        const discovered = data.hits.map(hit => this.mapHitToModItem(hit));
        this.cache.set('latest_discovered', discovered);
        this.lastSyncTime = Date.now();
        this.isSyncing = false;
        this.notify();
        return discovered.length;
      }
    } catch {
      // Offline or network error: gracefully keep cache
    }

    this.isSyncing = false;
    this.notify();
    return 0;
  }

  // Query Modrinth API with search string, loader, and category filter
  public async searchMods(
    query: string = '',
    loader?: ModLoaderType,
    category?: string,
    sortBy: 'relevance' | 'downloads' | 'newest' | 'updated' = 'downloads',
    limit: number = 24
  ): Promise<ModItem[]> {
    const cacheKey = `${query}_${loader || 'all'}_${category || 'all'}_${sortBy}`;
    if (this.cache.has(cacheKey)) {
      return this.enrichWithInstalled(this.cache.get(cacheKey)!);
    }

    try {
      // Construct Modrinth API URL
      const facets: string[][] = [['project_type:mod']];
      if (loader && loader !== 'arham') {
        facets.push([`categories:${loader}`]);
      }
      if (category && category !== 'All') {
        const catSlug = category.toLowerCase().replace(/[^a-z0-9]/g, '-');
        facets.push([`categories:${catSlug}`]);
      }

      const indexParam = sortBy === 'downloads' ? 'downloads' : sortBy === 'newest' ? 'newest' : sortBy === 'updated' ? 'updated' : 'relevance';
      const url = `https://api.modrinth.com/v2/search?query=${encodeURIComponent(query)}&index=${indexParam}&limit=${limit}&facets=${encodeURIComponent(JSON.stringify(facets))}`;

      const response = await fetch(url);
      if (response.ok) {
        const data: ModrinthSearchResult = await response.json();
        let items: ModItem[] = data.hits.map(hit => this.mapHitToModItem(hit));

        // Inject matching ARHAM native mods at the top if relevant
        if (!loader || loader === 'arham') {
          const matchedNative = ARHAM_NATIVE_MODS.filter(m => {
            if (query && !m.title.toLowerCase().includes(query.toLowerCase()) && !m.description.toLowerCase().includes(query.toLowerCase())) return false;
            if (category && category !== 'All' && !m.categories.includes(category)) return false;
            return true;
          });
          items = [...matchedNative, ...items];
        }

        this.cache.set(cacheKey, items);
        return this.enrichWithInstalled(items);
      }
    } catch {
      // Fallback to built-in native mods on network error
    }

    return this.enrichWithInstalled(ARHAM_NATIVE_MODS);
  }

  private mapHitToModItem(hit: ModrinthSearchResult['hits'][0]): ModItem {
    const loaders: ModLoaderType[] = [];
    hit.categories.forEach(c => {
      if (['fabric', 'forge', 'neoforge', 'quilt'].includes(c)) {
        loaders.push(c as ModLoaderType);
      }
    });
    if (loaders.length === 0) loaders.push('fabric');

    return {
      id: hit.project_id || hit.slug,
      title: hit.title,
      description: hit.description,
      icon_url: hit.icon_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&auto=format&fit=crop&q=80',
      author: hit.author,
      downloads: hit.downloads,
      follows: hit.follows,
      categories: hit.display_categories || hit.categories,
      loaders,
      versions: hit.versions.slice(-3),
      source_repo: `https://modrinth.com/mod/${hit.slug}`,
      project_url: `https://modrinth.com/mod/${hit.slug}`,
      date_published: hit.date_created,
      date_modified: hit.date_modified,
      gallery: hit.gallery,
      isArhamNative: false,
      installed: this.installedMods.has(hit.project_id || hit.slug),
      enabled: this.installedMods.get(hit.project_id || hit.slug)?.enabled ?? false,
    };
  }

  private enrichWithInstalled(items: ModItem[]): ModItem[] {
    return items.map(item => {
      const installed = this.installedMods.get(item.id);
      if (installed) {
        return { ...item, installed: true, enabled: installed.enabled };
      }
      return item;
    });
  }

  public getInstalledMods(): ModItem[] {
    return Array.from(this.installedMods.values());
  }

  public installMod(mod: ModItem) {
    const updated: ModItem = { ...mod, installed: true, enabled: true };
    this.installedMods.set(mod.id, updated);
    this.notify();
  }

  public uninstallMod(modId: string) {
    this.installedMods.delete(modId);
    this.notify();
  }

  public toggleMod(modId: string, enabled: boolean) {
    const mod = this.installedMods.get(modId);
    if (mod) {
      mod.enabled = enabled;
      this.notify();
    }
  }

  public isModEnabled(modId: string): boolean {
    const mod = this.installedMods.get(modId);
    return !!mod?.enabled;
  }
}

export const modrinthService = new ModrinthService();
