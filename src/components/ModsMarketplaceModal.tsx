/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ModItem, ModCategory, ModLoaderType } from '../types/game';
import { modrinthService } from '../engine/modrinth';
import { modLoader } from '../engine/mods';
import { soundEngine } from '../engine/audio';

interface ModsMarketplaceModalProps {
  onClose: () => void;
}

export const ModsMarketplaceModal: React.FC<ModsMarketplaceModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'browse' | 'installed' | 'loader'>('browse');
  const [mods, setMods] = useState<ModItem[]>([]);
  const [installedMods, setInstalledMods] = useState<ModItem[]>([]);
  const [selectedMod, setSelectedMod] = useState<ModItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedLoader, setSelectedLoader] = useState<ModLoaderType | 'all'>('all');
  const [sortBy, setSortBy] = useState<'downloads' | 'newest' | 'updated'>('downloads');
  const [syncStatus, setSyncStatus] = useState<string>('');

  const categories: ModCategory[] = [
    'All',
    'Technology',
    'Magic',
    'Weapons',
    'Armor',
    'Mobs',
    'Biomes',
    'World Generation',
    'Structures',
    'Furniture',
    'Farming',
    'Performance',
    'Adventure',
    'Utility',
    'Shaders',
    'Quality of Life',
  ];

  const fetchMods = async () => {
    setLoading(true);
    const results = await modrinthService.searchMods(
      searchQuery,
      selectedLoader === 'all' ? undefined : selectedLoader,
      selectedCategory,
      sortBy
    );
    setMods(results);
    setInstalledMods(modrinthService.getInstalledMods());
    setLoading(false);
  };

  useEffect(() => {
    fetchMods();
  }, [searchQuery, selectedCategory, selectedLoader, sortBy]);

  // Subscribe to mod updates
  useEffect(() => {
    const unsub = modrinthService.subscribe(() => {
      setInstalledMods(modrinthService.getInstalledMods());
    });
    return () => {
      unsub();
    };
  }, []);

  const handleInstall = (mod: ModItem) => {
    soundEngine.playItemPickup();
    modrinthService.installMod(mod);
    modLoader.addLog(`[Mod Manager] Installed "${mod.title}" (v${mod.localVersion || 'latest'})`);
    setInstalledMods(modrinthService.getInstalledMods());
    if (selectedMod?.id === mod.id) {
      setSelectedMod({ ...mod, installed: true, enabled: true });
    }
  };

  const handleUninstall = (modId: string) => {
    soundEngine.playClick();
    modrinthService.uninstallMod(modId);
    modLoader.addLog(`[Mod Manager] Uninstalled mod ID: ${modId}`);
    setInstalledMods(modrinthService.getInstalledMods());
    if (selectedMod?.id === modId) {
      setSelectedMod({ ...selectedMod, installed: false, enabled: false });
    }
  };

  const handleToggle = (modId: string, currentEnabled: boolean) => {
    soundEngine.playClick();
    modrinthService.toggleMod(modId, !currentEnabled);
    modLoader.addLog(`[Mod Manager] Mod ${modId} set to ${!currentEnabled ? 'ENABLED' : 'DISABLED'}`);
    setInstalledMods(modrinthService.getInstalledMods());
  };

  const handleSyncDiscovery = async () => {
    soundEngine.playClick();
    setSyncStatus('Querying live Modrinth API...');
    const discovered = await modrinthService.discoverLatestMods();
    setSyncStatus(`Discovered ${discovered} new public mods from repository.`);
    setTimeout(() => setSyncStatus(''), 4000);
    fetchMods();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md select-none">
      <div className="relative w-full max-w-5xl h-[92vh] bg-stone-900 border-4 border-cyan-500 shadow-[0_0_40px_rgba(6,182,212,0.3)] flex flex-col overflow-hidden">
        {/* Marketplace Header */}
        <div className="p-3 sm:p-4 bg-gradient-to-r from-stone-950 via-slate-900 to-stone-950 border-b-2 border-cyan-600 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl sm:text-3xl animate-pulse">💎</span>
            <div>
              <h2
                className="text-base sm:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-teal-100 tracking-wider uppercase"
                style={{ fontFamily: "'Press Start 2P', monospace" }}
              >
                ARHAM 💎 MODS MARKETPLACE
              </h2>
              <p className="text-[11px] font-mono text-cyan-400/80">
                Connected to Modrinth API & ARHAM-MC Mod Loader · Real Repositories
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSyncDiscovery}
              className="px-3 py-1.5 bg-cyan-900/60 hover:bg-cyan-800 border border-cyan-400 text-cyan-200 text-xs font-mono flex items-center gap-1.5 cursor-pointer"
            >
              <span>🔄 Auto-Discover Mods</span>
            </button>
            <button
              onClick={() => {
                soundEngine.playClick();
                onClose();
              }}
              className="px-3 py-1.5 bg-stone-800 hover:bg-red-800 border border-stone-600 text-stone-200 text-xs font-mono font-bold cursor-pointer"
            >
              ✕ Close
            </button>
          </div>
        </div>

        {/* Sync notification bar */}
        {syncStatus && (
          <div className="bg-cyan-950 px-4 py-1 text-xs font-mono text-cyan-300 border-b border-cyan-800 animate-pulse">
            {syncStatus}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-stone-800 bg-stone-950/80 px-4 pt-2 gap-2">
          <button
            onClick={() => setActiveTab('browse')}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider cursor-pointer border-t-2 border-x-2 transition-colors ${
              activeTab === 'browse'
                ? 'bg-stone-900 border-cyan-400 text-cyan-300'
                : 'bg-stone-950 border-transparent text-stone-400 hover:text-stone-200'
            }`}
            style={{ fontFamily: "'Press Start 2P', monospace" }}
          >
            Browse ({mods.length})
          </button>
          <button
            onClick={() => setActiveTab('installed')}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider cursor-pointer border-t-2 border-x-2 transition-colors flex items-center gap-2 ${
              activeTab === 'installed'
                ? 'bg-stone-900 border-cyan-400 text-cyan-300'
                : 'bg-stone-950 border-transparent text-stone-400 hover:text-stone-200'
            }`}
            style={{ fontFamily: "'Press Start 2P', monospace" }}
          >
            <span>Installed</span>
            <span className="px-1.5 py-0.2 bg-cyan-800 text-white rounded text-[10px]">
              {installedMods.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('loader')}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider cursor-pointer border-t-2 border-x-2 transition-colors ${
              activeTab === 'loader'
                ? 'bg-stone-900 border-cyan-400 text-cyan-300'
                : 'bg-stone-950 border-transparent text-stone-400 hover:text-stone-200'
            }`}
            style={{ fontFamily: "'Press Start 2P', monospace" }}
          >
            Mod Loader & Logs
          </button>
        </div>

        {/* TAB 1: BROWSE MARKETPLACE */}
        {activeTab === 'browse' && (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Filters Sidebar */}
            <div className="w-full md:w-64 bg-stone-950/60 p-3 border-r border-stone-800 flex flex-col gap-3 overflow-y-auto">
              <div>
                <label className="block text-[11px] font-mono text-cyan-300 mb-1 font-bold">Search Mods</label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="e.g. Minimap, Optics, Create..."
                  className="w-full px-2.5 py-1.5 bg-stone-900 border border-stone-700 text-xs font-mono text-white focus:border-cyan-400 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-cyan-300 mb-1 font-bold">Mod Loader</label>
                <select
                  value={selectedLoader}
                  onChange={e => setSelectedLoader(e.target.value as ModLoaderType | 'all')}
                  className="w-full px-2.5 py-1.5 bg-stone-900 border border-stone-700 text-xs font-mono text-white focus:border-cyan-400 outline-none"
                >
                  <option value="all">All Loaders</option>
                  <option value="arham">⚡ ARHAM-MC Native (Playable Now)</option>
                  <option value="fabric">Fabric</option>
                  <option value="forge">Forge</option>
                  <option value="neoforge">NeoForge</option>
                  <option value="quilt">Quilt</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-cyan-300 mb-1 font-bold">Sort By</label>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as 'downloads' | 'newest' | 'updated')}
                  className="w-full px-2.5 py-1.5 bg-stone-900 border border-stone-700 text-xs font-mono text-white focus:border-cyan-400 outline-none"
                >
                  <option value="downloads">Most Downloaded</option>
                  <option value="newest">Recently Published</option>
                  <option value="updated">Recently Updated</option>
                </select>
              </div>

              <div className="flex-1">
                <label className="block text-[11px] font-mono text-cyan-300 mb-1 font-bold">Categories</label>
                <div className="flex flex-col gap-1 max-h-48 md:max-h-64 overflow-y-auto pr-1">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`text-left px-2 py-1 text-xs font-mono rounded cursor-pointer ${
                        selectedCategory === cat
                          ? 'bg-cyan-900 text-cyan-200 font-bold'
                          : 'text-stone-400 hover:bg-stone-900 hover:text-stone-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Mods Grid */}
            <div className="flex-1 p-3 sm:p-4 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-64 text-stone-400 font-mono text-sm">
                  Connecting to Modrinth API...
                </div>
              ) : mods.length === 0 ? (
                <div className="text-center py-16 text-stone-400 font-mono">
                  No mods matched your search criteria.
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {mods.map(mod => {
                    const isInstalled = modrinthService.isModEnabled(mod.id) || mod.installed;
                    return (
                      <div
                        key={mod.id}
                        onClick={() => setSelectedMod(mod)}
                        className={`p-3 bg-stone-950/80 border-2 transition-all cursor-pointer flex gap-3 ${
                          selectedMod?.id === mod.id
                            ? 'border-cyan-400 bg-stone-900'
                            : 'border-stone-800 hover:border-stone-600'
                        }`}
                      >
                        <img
                          src={mod.icon_url}
                          alt={mod.title}
                          className="w-14 h-14 object-cover border border-stone-700 bg-stone-800 shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&auto=format&fit=crop&q=80';
                          }}
                        />

                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between gap-1">
                              <h3 className="font-bold text-xs sm:text-sm text-white truncate">{mod.title}</h3>
                              {mod.isArhamNative && (
                                <span className="text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-600 px-1.5 py-0.2 uppercase font-mono font-bold">
                                  ARHAM
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-stone-400 line-clamp-2 mt-1 leading-snug">
                              {mod.description}
                            </p>
                          </div>

                          <div className="flex items-center justify-between mt-2 pt-1 border-t border-stone-800 text-[10px] text-stone-500 font-mono">
                            <span>by {mod.author}</span>
                            <div className="flex items-center gap-2">
                              <span>📥 {(mod.downloads || 0).toLocaleString()}</span>
                              {isInstalled ? (
                                <span className="text-emerald-400 font-bold">✓ Installed</span>
                              ) : (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleInstall(mod);
                                  }}
                                  className="px-2 py-0.5 bg-cyan-700 hover:bg-cyan-600 text-white font-bold cursor-pointer"
                                >
                                  Install
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: INSTALLED MODS */}
        {activeTab === 'installed' && (
          <div className="flex-1 p-4 overflow-y-auto">
            <h3 className="text-sm font-bold text-cyan-300 font-mono mb-4 uppercase">
              Installed Mods & Engine Modules ({installedMods.length})
            </h3>
            {installedMods.length === 0 ? (
              <div className="text-center py-16 text-stone-400 font-mono">
                No mods installed yet. Browse the marketplace to add mods!
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {installedMods.map(m => (
                  <div
                    key={m.id}
                    className="p-3 bg-stone-950 border border-stone-800 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={m.icon_url}
                        alt={m.title}
                        className="w-10 h-10 object-cover border border-stone-700 bg-stone-800"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&auto=format&fit=crop&q=80';
                        }}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white">{m.title}</span>
                          <span className="text-[10px] text-stone-400 font-mono">v{m.localVersion || '1.0.0'}</span>
                          {m.isArhamNative && (
                            <span className="text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-600 px-1 py-0.2 font-mono">
                              Native
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-stone-400 line-clamp-1">{m.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1.5 cursor-pointer text-xs font-mono text-stone-300">
                        <input
                          type="checkbox"
                          checked={m.enabled ?? true}
                          onChange={() => handleToggle(m.id, m.enabled ?? true)}
                          className="w-4 h-4 accent-cyan-500"
                        />
                        <span>{m.enabled ?? true ? 'Enabled' : 'Disabled'}</span>
                      </label>
                      <button
                        onClick={() => handleUninstall(m.id)}
                        className="px-2.5 py-1 bg-red-900/60 hover:bg-red-800 text-red-200 border border-red-700 text-xs font-mono cursor-pointer"
                      >
                        Uninstall
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: MOD LOADER & LOGS */}
        {activeTab === 'loader' && (
          <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4">
            <div className="bg-stone-950 p-3 border border-stone-800 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-cyan-300 font-mono">ARHAM-MC Mod Loader Architecture</h4>
                <p className="text-xs text-stone-400 font-mono mt-0.5">
                  Sandboxed Three.js / WebGL execution with Java Edition compatibility layer.
                </p>
              </div>
              <div className="text-xs font-mono text-stone-400">
                Active Profile: <span className="text-cyan-300 font-bold">{modLoader.activeProfile}</span>
              </div>
            </div>

            <div>
              <h5 className="text-xs font-mono text-stone-300 mb-1 font-bold">Loader System Logs:</h5>
              <div className="p-3 bg-black border border-stone-800 font-mono text-xs text-emerald-400 h-64 overflow-y-auto space-y-1">
                {modLoader.logs.map((log, idx) => (
                  <div key={idx}>{log}</div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Mod Detail Modal Popup */}
        {selectedMod && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="relative w-full max-w-xl bg-stone-900 border-2 border-cyan-400 p-5 shadow-2xl flex flex-col max-h-[85vh]">
              <div className="flex items-start justify-between gap-4 pb-3 border-b border-stone-800">
                <div className="flex gap-3">
                  <img
                    src={selectedMod.icon_url}
                    alt={selectedMod.title}
                    className="w-14 h-14 object-cover border border-stone-700 bg-stone-800"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&auto=format&fit=crop&q=80';
                    }}
                  />
                  <div>
                    <h3 className="font-bold text-sm sm:text-base text-white">{selectedMod.title}</h3>
                    <p className="text-xs text-stone-400 font-mono">by {selectedMod.author}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedMod.loaders.map(l => (
                        <span key={l} className="text-[10px] bg-stone-800 text-stone-300 px-1.5 py-0.2 uppercase font-mono">
                          {l}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedMod(null)}
                  className="text-stone-400 hover:text-white text-sm font-mono cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-3 space-y-3 text-xs text-stone-300 font-mono leading-relaxed">
                <p>{selectedMod.description}</p>
                <div className="p-3 bg-stone-950 border border-stone-800 rounded">
                  <h4 className="text-cyan-300 font-bold mb-1">Compatibility & Architecture:</h4>
                  {selectedMod.isArhamNative ? (
                    <p className="text-emerald-400">
                      ⚡ ARHAM Native Mod: Fully compiled and executable inside the active 3D Three.js game engine!
                    </p>
                  ) : (
                    <p className="text-stone-400">
                      ☕ Java Edition Mod ({selectedMod.loaders.join(', ')}): Real public mod repository entry. Can be downloaded and installed into your local Minecraft Java profile directory.
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-stone-400">
                  <div>Downloads: <span className="text-white font-bold">{(selectedMod.downloads || 0).toLocaleString()}</span></div>
                  <div>Followers: <span className="text-white font-bold">{(selectedMod.follows || 0).toLocaleString()}</span></div>
                  <div>Categories: <span className="text-white font-bold">{selectedMod.categories.join(', ')}</span></div>
                  <div>Versions: <span className="text-white font-bold">{selectedMod.versions.join(', ') || '1.21.x'}</span></div>
                </div>
              </div>

              <div className="pt-3 border-t border-stone-800 flex justify-end gap-2">
                {selectedMod.installed ? (
                  <button
                    onClick={() => handleUninstall(selectedMod.id)}
                    className="px-4 py-2 bg-red-800 hover:bg-red-700 text-white font-bold text-xs uppercase cursor-pointer"
                  >
                    Uninstall
                  </button>
                ) : (
                  <button
                    onClick={() => handleInstall(selectedMod)}
                    className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs uppercase tracking-wider cursor-pointer"
                    style={{ fontFamily: "'Press Start 2P', monospace" }}
                  >
                    Install Mod
                  </button>
                )}
                <button
                  onClick={() => setSelectedMod(null)}
                  className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-mono cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
