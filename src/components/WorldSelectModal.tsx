/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { WorldMetadata, GameMode, Difficulty, WorldType } from '../types/game';
import { WorldStorage } from '../engine/storage';
import { soundEngine } from '../engine/audio';

interface WorldSelectModalProps {
  onSelectWorld: (worldId: string) => void;
  onBack: () => void;
}

export const WorldSelectModal: React.FC<WorldSelectModalProps> = ({ onSelectWorld, onBack }) => {
  const [worlds, setWorlds] = useState<WorldMetadata[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showCreate, setShowCreate] = useState<boolean>(false);

  // New world form state
  const [newName, setNewName] = useState('New Voxel World');
  const [newSeed, setNewSeed] = useState('');
  const [newMode, setNewMode] = useState<GameMode>('survival');
  const [newDifficulty, setNewDifficulty] = useState<Difficulty>('normal');
  const [newType, setNewType] = useState<WorldType>('default');
  const [allowCheats, setAllowCheats] = useState<boolean>(true);

  const loadWorldList = async () => {
    setLoading(true);
    const list = await WorldStorage.listWorlds();
    setWorlds(list);
    if (list.length > 0 && !selectedId) {
      setSelectedId(list[0].id);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadWorldList();
  }, []);

  const handlePlay = () => {
    if (!selectedId) return;
    soundEngine.playClick();
    onSelectWorld(selectedId);
  };

  const handleCreate = async () => {
    soundEngine.playClick();
    const created = await WorldStorage.createNewWorld(
      newName,
      newSeed,
      newMode,
      newDifficulty,
      newType,
      allowCheats
    );
    await loadWorldList();
    setShowCreate(false);
    onSelectWorld(created.id);
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    if (confirm('Are you sure you want to delete this world? This action is permanent!')) {
      soundEngine.playClick();
      await WorldStorage.deleteWorld(selectedId);
      setSelectedId(null);
      await loadWorldList();
    }
  };

  const handleDuplicate = async () => {
    if (!selectedId) return;
    soundEngine.playClick();
    await WorldStorage.duplicateWorld(selectedId);
    await loadWorldList();
  };

  const handleExport = async () => {
    if (!selectedId) return;
    soundEngine.playClick();
    const json = await WorldStorage.exportWorldJSON(selectedId);
    if (!json) return;
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `arham_mc_world_${selectedId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    try {
      const meta = await WorldStorage.importWorldJSON(text);
      soundEngine.playClick();
      await loadWorldList();
      setSelectedId(meta.id);
    } catch {
      alert('Invalid world JSON file.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none">
      <div className="relative w-full max-w-2xl bg-stone-900 border-4 border-stone-600 rounded-none shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-stone-800 border-b-2 border-stone-700 flex items-center justify-between">
          <h2
            className="text-lg sm:text-xl font-bold text-white tracking-wider uppercase"
            style={{ fontFamily: "'Press Start 2P', monospace" }}
          >
            {showCreate ? 'Create New World' : 'Select World'}
          </h2>
          <span className="text-xs font-mono text-stone-400">IndexedDB Local Storage</span>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {!showCreate ? (
            <div className="flex flex-col gap-4">
              {loading ? (
                <div className="text-center py-12 text-stone-400 font-mono">Loading worlds...</div>
              ) : worlds.length === 0 ? (
                <div className="text-center py-10 bg-stone-950/60 border border-stone-800 p-6">
                  <p className="text-stone-300 font-mono mb-4">No worlds found. Create your first procedural voxel world!</p>
                  <button
                    onClick={() => setShowCreate(true)}
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider border-2 border-emerald-400 border-b-4 border-b-emerald-950 cursor-pointer"
                    style={{ fontFamily: "'Press Start 2P', monospace" }}
                  >
                    + Create New World
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
                  {worlds.map(w => {
                    const isSelected = selectedId === w.id;
                    const dateStr = new Date(w.lastPlayedAt).toLocaleDateString();
                    return (
                      <div
                        key={w.id}
                        onClick={() => {
                          setSelectedId(w.id);
                          soundEngine.playClick();
                        }}
                        onDoubleClick={handlePlay}
                        className={`p-3 border-2 cursor-pointer transition-colors flex items-center justify-between ${
                          isSelected
                            ? 'bg-stone-700 border-yellow-400 text-white'
                            : 'bg-stone-950/80 border-stone-800 hover:bg-stone-800/80 text-stone-300'
                        }`}
                      >
                        <div className="flex flex-col gap-1">
                          <div className="font-bold text-sm flex items-center gap-2">
                            <span>{w.name}</span>
                            <span
                              className={`text-[10px] px-2 py-0.5 uppercase ${
                                w.gameMode === 'creative' ? 'bg-purple-900/60 text-purple-300' : 'bg-emerald-900/60 text-emerald-300'
                              }`}
                            >
                              {w.gameMode}
                            </span>
                          </div>
                          <div className="text-xs text-stone-400 font-mono">
                            Seed: {w.seed} · Type: {w.worldType} · Difficulty: {w.difficulty}
                          </div>
                        </div>
                        <div className="text-xs text-stone-400 font-mono text-right">{dateStr}</div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Import button */}
              <div className="flex items-center justify-between pt-2 border-t border-stone-800">
                <label className="text-xs text-stone-400 hover:text-white cursor-pointer font-mono flex items-center gap-2">
                  <span>📥 Import World JSON:</span>
                  <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
                  <span className="px-2 py-1 bg-stone-800 hover:bg-stone-700 border border-stone-600 text-[10px] uppercase font-bold text-stone-200">
                    Browse File
                  </span>
                </label>
                {selectedId && (
                  <button
                    onClick={handleExport}
                    className="text-xs text-stone-400 hover:text-cyan-300 font-mono underline cursor-pointer"
                  >
                    📤 Export World
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* CREATE WORLD FORM */
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-mono text-stone-300 mb-1">World Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-700 text-white font-mono text-sm focus:border-cyan-400 outline-none"
                  placeholder="World Name"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-stone-300 mb-1">World Seed (Leave blank for random)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSeed}
                    onChange={e => setNewSeed(e.target.value)}
                    className="flex-1 px-3 py-2 bg-stone-950 border border-stone-700 text-white font-mono text-sm focus:border-cyan-400 outline-none"
                    placeholder="e.g. 123456 or Minecraft"
                  />
                  <button
                    type="button"
                    onClick={() => setNewSeed(String(Math.floor(Math.random() * 99999999)))}
                    className="px-3 py-2 bg-stone-800 hover:bg-stone-700 border border-stone-600 text-xs font-mono text-white cursor-pointer"
                  >
                    Random
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-stone-300 mb-1">Game Mode</label>
                  <select
                    value={newMode}
                    onChange={e => setNewMode(e.target.value as GameMode)}
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-700 text-white font-mono text-sm focus:border-cyan-400 outline-none"
                  >
                    <option value="survival">Survival (Health, Hunger, Mining)</option>
                    <option value="creative">Creative (Flying, Infinite Blocks)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-stone-300 mb-1">Difficulty</label>
                  <select
                    value={newDifficulty}
                    onChange={e => setNewDifficulty(e.target.value as Difficulty)}
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-700 text-white font-mono text-sm focus:border-cyan-400 outline-none"
                  >
                    <option value="peaceful">Peaceful (No hostile mobs)</option>
                    <option value="easy">Easy</option>
                    <option value="normal">Normal</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-stone-300 mb-1">World Type</label>
                  <select
                    value={newType}
                    onChange={e => setNewType(e.target.value as WorldType)}
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-700 text-white font-mono text-sm focus:border-cyan-400 outline-none"
                  >
                    <option value="default">Default (Biomes, Hills, Caves)</option>
                    <option value="amplified">Amplified (Giant Mountains)</option>
                    <option value="islands">Floating / Ocean Islands</option>
                    <option value="flat">Superflat</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 mt-5">
                  <input
                    type="checkbox"
                    id="cheats"
                    checked={allowCheats}
                    onChange={e => setAllowCheats(e.target.checked)}
                    className="w-4 h-4 accent-cyan-500 cursor-pointer"
                  />
                  <label htmlFor="cheats" className="text-xs font-mono text-stone-300 cursor-pointer">
                    Allow Commands & Cheats (/tp, /time, etc.)
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-stone-800 border-t-2 border-stone-700 flex flex-wrap gap-2 justify-between">
          {!showCreate ? (
            <>
              <div className="flex gap-2">
                <button
                  onClick={handlePlay}
                  disabled={!selectedId}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-xs uppercase tracking-wider border-2 border-emerald-400 border-b-4 border-b-emerald-950 cursor-pointer"
                  style={{ fontFamily: "'Press Start 2P', monospace" }}
                >
                  Play Selected
                </button>
                <button
                  onClick={() => setShowCreate(true)}
                  className="px-4 py-2.5 bg-stone-700 hover:bg-stone-600 text-white font-bold text-xs uppercase tracking-wider border-2 border-stone-500 border-b-4 border-b-stone-950 cursor-pointer"
                  style={{ fontFamily: "'Press Start 2P', monospace" }}
                >
                  Create New
                </button>
              </div>

              <div className="flex gap-2">
                {selectedId && (
                  <>
                    <button
                      onClick={handleDuplicate}
                      className="px-3 py-2 bg-stone-700 hover:bg-stone-600 text-white text-xs font-mono cursor-pointer"
                    >
                      Duplicate
                    </button>
                    <button
                      onClick={handleDelete}
                      className="px-3 py-2 bg-red-800 hover:bg-red-700 text-white text-xs font-mono cursor-pointer"
                    >
                      Delete
                    </button>
                  </>
                )}
                <button
                  onClick={onBack}
                  className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-mono cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <>
              <button
                onClick={handleCreate}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider border-2 border-emerald-400 border-b-4 border-b-emerald-950 cursor-pointer"
                style={{ fontFamily: "'Press Start 2P', monospace" }}
              >
                Create World
              </button>
              <button
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 bg-stone-700 hover:bg-stone-600 text-stone-300 text-xs font-mono cursor-pointer"
              >
                Back to Worlds
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
