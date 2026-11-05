/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { soundEngine } from '../engine/audio';

interface MainMenuProps {
  onSingleplayer: () => void;
  onMultiplayer: () => void;
  onMods: () => void;
  onResourcePacks: () => void;
  onSettings: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  onSingleplayer,
  onMultiplayer,
  onMods,
  onResourcePacks,
  onSettings,
}) => {
  const splashes = [
    'Now with 💎 Mods Marketplace!',
    'Infinite Procedural 3D Voxels!',
    'Runs smoothly on Android & Desktop!',
    'Built with Three.js & WebGL!',
    'Original ARHAM-MC Engine!',
    'Watch out for exploding Creepers!',
    'Real Modrinth API Integration!',
    'Java Edition Inspired Sandbox!',
  ];

  const [splash, setSplash] = useState(splashes[0]);

  useEffect(() => {
    const randomSplash = splashes[Math.floor(Math.random() * splashes.length)];
    setSplash(randomSplash);
  }, []);

  const handleClick = (cb: () => void) => {
    soundEngine.playClick();
    cb();
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-between py-10 select-none overflow-hidden bg-slate-950">
      {/* Animated 3D Panorama Voxel Background Backdrop */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-75 scale-105 animate-[spin_180s_linear_infinite]"
        style={{
          backgroundImage: `radial-gradient(circle at center, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.95) 100%), url('https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1600&auto=format&fit=crop&q=80')`,
        }}
      />

      {/* Subtle dirt overlay vignette */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black/40 via-transparent to-black/80" />

      {/* Header & Logo Lockup */}
      <div className="relative z-10 flex flex-col items-center mt-6">
        <div className="relative group">
          {/* Logo Drop Shadow */}
          <h1
            className="text-5xl sm:text-7xl md:text-8xl font-black tracking-wider text-center text-transparent bg-clip-text bg-gradient-to-b from-stone-100 via-stone-300 to-stone-500 uppercase drop-shadow-[0_8px_0_#1e293b]"
            style={{ fontFamily: "'Press Start 2P', monospace, sans-serif" }}
          >
            ARHAM-MC
          </h1>
          {/* Glowing Bevel Accent */}
          <div className="absolute -inset-1 blur-sm bg-cyan-500/20 -z-10 group-hover:bg-cyan-500/30 transition-all" />

          {/* Golden Splash Text */}
          <div
            className="absolute -bottom-4 right-0 transform translate-x-4 rotate-[-12deg] text-yellow-300 font-bold text-xs sm:text-base tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] animate-bounce"
            style={{ fontFamily: "'Press Start 2P', monospace, sans-serif" }}
          >
            {splash}
          </div>
        </div>
        <p className="mt-8 text-xs sm:text-sm text-cyan-200/80 tracking-widest uppercase font-mono">
          Voxel Sandbox Engine · Java Edition Inspired
        </p>
      </div>

      {/* Menu Buttons Group */}
      <div className="relative z-10 flex flex-col gap-3.5 w-full max-w-md px-6">
        {/* 1. SINGLEPLAYER */}
        <button
          onClick={() => handleClick(onSingleplayer)}
          className="group relative w-full py-3.5 px-6 bg-gradient-to-b from-stone-600 via-stone-700 to-stone-800 hover:from-stone-500 hover:to-stone-700 active:from-stone-800 active:to-stone-900 border-2 border-stone-400 border-b-4 border-b-stone-950 text-white font-bold text-sm tracking-wider uppercase shadow-xl transition-transform active:scale-[0.98] flex items-center justify-center gap-3 cursor-pointer"
          style={{ fontFamily: "'Press Start 2P', monospace" }}
        >
          <span className="text-emerald-400 group-hover:scale-110 transition-transform">⚔️</span>
          <span>Singleplayer</span>
        </button>

        {/* 2. MULTIPLAYER */}
        <button
          onClick={() => handleClick(onMultiplayer)}
          className="group relative w-full py-3.5 px-6 bg-gradient-to-b from-stone-600 via-stone-700 to-stone-800 hover:from-stone-500 hover:to-stone-700 active:from-stone-800 active:to-stone-900 border-2 border-stone-400 border-b-4 border-b-stone-950 text-white font-bold text-sm tracking-wider uppercase shadow-xl transition-transform active:scale-[0.98] flex items-center justify-center gap-3 cursor-pointer"
          style={{ fontFamily: "'Press Start 2P', monospace" }}
        >
          <span className="text-sky-400 group-hover:scale-110 transition-transform">🌐</span>
          <span>Multiplayer</span>
        </button>

        {/* 3. 💎 MODS - CRITICAL FLAGSHIP FEATURE */}
        <button
          onClick={() => handleClick(onMods)}
          className="group relative w-full py-4 px-6 bg-gradient-to-r from-blue-700 via-cyan-600 to-teal-600 hover:from-blue-600 hover:via-cyan-500 hover:to-teal-500 active:from-blue-800 active:to-teal-700 border-2 border-cyan-300 border-b-4 border-b-cyan-950 text-white font-black text-sm sm:text-base tracking-widest uppercase shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all hover:shadow-[0_0_30px_rgba(6,182,212,0.7)] active:scale-[0.98] flex items-center justify-center gap-3 cursor-pointer animate-[pulse_3s_infinite]"
          style={{ fontFamily: "'Press Start 2P', monospace" }}
        >
          <span className="text-xl sm:text-2xl group-hover:rotate-12 transition-transform drop-shadow-[0_0_8px_#ffffff]">💎</span>
          <span className="text-cyan-100 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">MODS MARKETPLACE</span>
          <span className="text-xl sm:text-2xl group-hover:-rotate-12 transition-transform drop-shadow-[0_0_8px_#ffffff]">💎</span>
        </button>

        {/* Row 4: RESOURCE PACKS & SETTINGS */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleClick(onResourcePacks)}
            className="py-3 px-3 bg-gradient-to-b from-stone-600 via-stone-700 to-stone-800 hover:from-stone-500 hover:to-stone-700 border-2 border-stone-400 border-b-4 border-b-stone-950 text-white font-bold text-xs tracking-wider uppercase shadow-lg transition-transform active:scale-[0.98] cursor-pointer"
            style={{ fontFamily: "'Press Start 2P', monospace" }}
          >
            🎨 Packs
          </button>
          <button
            onClick={() => handleClick(onSettings)}
            className="py-3 px-3 bg-gradient-to-b from-stone-600 via-stone-700 to-stone-800 hover:from-stone-500 hover:to-stone-700 border-2 border-stone-400 border-b-4 border-b-stone-950 text-white font-bold text-xs tracking-wider uppercase shadow-lg transition-transform active:scale-[0.98] cursor-pointer"
            style={{ fontFamily: "'Press Start 2P', monospace" }}
          >
            ⚙️ Settings
          </button>
        </div>
      </div>

      {/* Footer Info */}
      <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between w-full max-w-4xl px-8 text-[11px] text-stone-400 font-mono tracking-wider">
        <div>ARHAM-MC v1.21.0 · WebGL 3D Edition</div>
        <div className="text-stone-500">Playable on Android & PC · IndexedDB Storage</div>
      </div>
    </div>
  );
};
