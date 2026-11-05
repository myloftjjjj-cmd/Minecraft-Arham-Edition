/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { soundEngine } from '../engine/audio';

interface PauseMenuProps {
  onResume: () => void;
  onMods: () => void;
  onSettings: () => void;
  onOpenToLAN: () => void;
  onSaveAndQuit: () => void;
}

export const PauseMenu: React.FC<PauseMenuProps> = ({
  onResume,
  onMods,
  onSettings,
  onOpenToLAN,
  onSaveAndQuit,
}) => {
  const handleClick = (cb: () => void) => {
    soundEngine.playClick();
    cb();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm select-none">
      <div className="w-full max-w-sm flex flex-col gap-3">
        <h2
          className="text-center text-xl sm:text-2xl font-bold text-white tracking-widest uppercase mb-4 drop-shadow-[0_4px_4px_black]"
          style={{ fontFamily: "'Press Start 2P', monospace" }}
        >
          Game Paused
        </h2>

        {/* Back to Game */}
        <button
          onClick={() => handleClick(onResume)}
          className="py-3 px-4 bg-stone-700 hover:bg-stone-600 border-2 border-stone-400 border-b-4 border-b-stone-950 text-white font-bold text-xs uppercase tracking-wider shadow-lg cursor-pointer active:scale-98"
          style={{ fontFamily: "'Press Start 2P', monospace" }}
        >
          Back to Game
        </button>

        {/* 💎 MODS MARKETPLACE */}
        <button
          onClick={() => handleClick(onMods)}
          className="py-3.5 px-4 bg-gradient-to-r from-cyan-700 to-teal-600 hover:from-cyan-600 hover:to-teal-500 border-2 border-cyan-300 border-b-4 border-b-cyan-950 text-white font-bold text-xs uppercase tracking-wider shadow-lg cursor-pointer active:scale-98 flex items-center justify-center gap-2"
          style={{ fontFamily: "'Press Start 2P', monospace" }}
        >
          <span>💎</span>
          <span>Mods Marketplace</span>
          <span>💎</span>
        </button>

        {/* Open to LAN */}
        <button
          onClick={() => handleClick(onOpenToLAN)}
          className="py-3 px-4 bg-stone-700 hover:bg-stone-600 border-2 border-stone-400 border-b-4 border-b-stone-950 text-white font-bold text-xs uppercase tracking-wider shadow-lg cursor-pointer active:scale-98"
          style={{ fontFamily: "'Press Start 2P', monospace" }}
        >
          🌐 Open to LAN
        </button>

        {/* Options */}
        <button
          onClick={() => handleClick(onSettings)}
          className="py-3 px-4 bg-stone-700 hover:bg-stone-600 border-2 border-stone-400 border-b-4 border-b-stone-950 text-white font-bold text-xs uppercase tracking-wider shadow-lg cursor-pointer active:scale-98"
          style={{ fontFamily: "'Press Start 2P', monospace" }}
        >
          ⚙️ Options...
        </button>

        {/* Save and Quit to Title */}
        <button
          onClick={() => handleClick(onSaveAndQuit)}
          className="py-3 px-4 bg-red-900/80 hover:bg-red-800 border-2 border-red-500 border-b-4 border-b-stone-950 text-white font-bold text-xs uppercase tracking-wider shadow-lg cursor-pointer active:scale-98 mt-2"
          style={{ fontFamily: "'Press Start 2P', monospace" }}
        >
          Save and Quit to Title
        </button>
      </div>
    </div>
  );
};
