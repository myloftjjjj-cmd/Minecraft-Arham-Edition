/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { soundEngine } from '../engine/audio';

interface DeathScreenProps {
  onRespawn: () => void;
  onQuitToTitle: () => void;
}

export const DeathScreen: React.FC<DeathScreenProps> = ({ onRespawn, onQuitToTitle }) => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-red-950/80 backdrop-blur-md select-none">
      <h1
        className="text-4xl sm:text-6xl font-black text-red-500 tracking-wider uppercase mb-6 drop-shadow-[0_6px_0_#450a0a]"
        style={{ fontFamily: "'Press Start 2P', monospace" }}
      >
        You Died!
      </h1>
      <p className="text-stone-300 font-mono text-sm sm:text-base mb-8">
        Score: <span className="text-yellow-400 font-bold">1,420</span>
      </p>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <button
          onClick={() => {
            soundEngine.playItemPickup();
            onRespawn();
          }}
          className="py-3 px-6 bg-stone-700 hover:bg-stone-600 border-2 border-stone-400 border-b-4 border-b-stone-950 text-white font-bold text-xs uppercase tracking-wider shadow-xl cursor-pointer active:scale-98"
          style={{ fontFamily: "'Press Start 2P', monospace" }}
        >
          Respawn
        </button>

        <button
          onClick={() => {
            soundEngine.playClick();
            onQuitToTitle();
          }}
          className="py-3 px-6 bg-stone-800 hover:bg-stone-700 border-2 border-stone-500 border-b-4 border-b-stone-950 text-stone-300 font-bold text-xs uppercase tracking-wider shadow-xl cursor-pointer active:scale-98"
          style={{ fontFamily: "'Press Start 2P', monospace" }}
        >
          Title Screen
        </button>
      </div>
    </div>
  );
};
