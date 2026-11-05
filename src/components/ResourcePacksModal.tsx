/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ResourcePack } from '../types/game';
import { modLoader } from '../engine/mods';
import { soundEngine } from '../engine/audio';

interface ResourcePacksModalProps {
  onClose: () => void;
}

export const ResourcePacksModal: React.FC<ResourcePacksModalProps> = ({ onClose }) => {
  const [packs, setPacks] = useState<ResourcePack[]>([...modLoader.resourcePacks]);

  const handleActivate = (packId: string) => {
    soundEngine.playItemPickup();
    modLoader.setResourcePack(packId);
    setPacks([...modLoader.resourcePacks]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none">
      <div className="relative w-full max-w-2xl bg-stone-900 border-4 border-stone-600 shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 bg-stone-800 border-b-2 border-stone-700 flex items-center justify-between">
          <h2
            className="text-base sm:text-lg font-bold text-white tracking-wider uppercase"
            style={{ fontFamily: "'Press Start 2P', monospace" }}
          >
            Resource Packs
          </h2>
          <button
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="text-stone-400 hover:text-white font-mono text-sm cursor-pointer"
          >
            ✕ Close
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 flex flex-col gap-3">
          <p className="text-xs text-stone-300 font-mono">
            Select an active texture pack. Texture atlas re-binds instantly without reloading the game!
          </p>

          <div className="flex flex-col gap-2 mt-2">
            {packs.map(p => (
              <div
                key={p.id}
                className={`p-3 border-2 flex items-center justify-between transition-colors ${
                  p.isActive
                    ? 'bg-stone-800 border-cyan-400'
                    : 'bg-stone-950 border-stone-800 hover:border-stone-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{p.icon}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">{p.name}</span>
                      <span className="text-[10px] bg-stone-700 text-stone-300 px-1.5 py-0.2 font-mono">
                        {p.resolution}
                      </span>
                    </div>
                    <p className="text-xs text-stone-400 font-mono mt-0.5">{p.description}</p>
                    <span className="text-[10px] text-stone-500 font-mono">by {p.author}</span>
                  </div>
                </div>

                <div>
                  {p.isActive ? (
                    <span className="text-xs font-mono font-bold text-emerald-400 px-3 py-1 bg-emerald-950 border border-emerald-600">
                      ✓ Active
                    </span>
                  ) : (
                    <button
                      onClick={() => handleActivate(p.id)}
                      className="px-3 py-1 bg-cyan-700 hover:bg-cyan-600 text-white font-bold text-xs uppercase cursor-pointer"
                    >
                      Activate
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-800 border-t-2 border-stone-700 flex justify-end">
          <button
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider border-2 border-emerald-400 border-b-4 border-b-emerald-950 cursor-pointer"
            style={{ fontFamily: "'Press Start 2P', monospace" }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
