/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { soundEngine } from '../engine/audio';

interface MultiplayerModalProps {
  onClose: () => void;
  onConnectServer: (serverUrl: string) => void;
}

export const MultiplayerModal: React.FC<MultiplayerModalProps> = ({ onClose, onConnectServer }) => {
  const [servers] = useState([
    {
      id: 'official_1',
      name: 'ARHAM Official Survival Realm',
      ip: 'play.arham-mc.net',
      players: '42/100',
      ping: '28ms',
      motd: 'Welcome to ARHAM-MC Official Server! Economy & Land Claims.',
    },
    {
      id: 'creative_1',
      name: 'Creative Mega-Builders',
      ip: 'creative.arham-mc.net',
      players: '18/50',
      ping: '45ms',
      motd: 'Infinite blocks & creative plots for voxel architects.',
    },
    {
      id: 'lan_local',
      name: 'Local Network (LAN Room)',
      ip: '192.168.1.104:25565',
      players: '2/8',
      ping: '4ms',
      motd: 'Local peer-to-peer multiplayer session.',
    },
  ]);

  const [selectedServer, setSelectedServer] = useState<string | null>(servers[0].id);
  const [directConnectUrl, setDirectConnectUrl] = useState('');
  const [showDirect, setShowDirect] = useState(false);

  const handleJoin = (ip: string) => {
    soundEngine.playClick();
    onConnectServer(ip);
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
            Play Multiplayer
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
          <div className="flex flex-col gap-2">
            {servers.map(s => {
              const isSelected = selectedServer === s.id;
              return (
                <div
                  key={s.id}
                  onClick={() => {
                    setSelectedServer(s.id);
                    soundEngine.playClick();
                  }}
                  onDoubleClick={() => handleJoin(s.ip)}
                  className={`p-3 border-2 flex items-center justify-between cursor-pointer transition-colors ${
                    isSelected ? 'bg-stone-800 border-yellow-400' : 'bg-stone-950 border-stone-800 hover:border-stone-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">{s.name}</span>
                      <span className="text-[10px] text-cyan-400 font-mono">[{s.ip}]</span>
                    </div>
                    <p className="text-xs text-stone-400 font-mono mt-0.5">{s.motd}</p>
                  </div>

                  <div className="text-right font-mono text-xs">
                    <div className="text-emerald-400 font-bold">{s.players}</div>
                    <div className="text-[10px] text-stone-500">📶 {s.ping}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Direct Connect Section */}
          {showDirect && (
            <div className="p-3 bg-stone-950 border border-stone-800 mt-2">
              <label className="block text-xs font-mono text-stone-300 mb-1">Server Address</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={directConnectUrl}
                  onChange={e => setDirectConnectUrl(e.target.value)}
                  placeholder="e.g. 192.168.1.50:25565 or ws://server.com"
                  className="flex-1 px-3 py-1.5 bg-stone-900 border border-stone-700 text-xs font-mono text-white outline-none focus:border-cyan-400"
                />
                <button
                  onClick={() => handleJoin(directConnectUrl || 'localhost:25565')}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase cursor-pointer"
                >
                  Join
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-800 border-t-2 border-stone-700 flex flex-wrap justify-between gap-2">
          <div className="flex gap-2">
            <button
              onClick={() => {
                const s = servers.find(srv => srv.id === selectedServer);
                if (s) handleJoin(s.ip);
              }}
              disabled={!selectedServer}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-xs uppercase tracking-wider border-2 border-emerald-400 border-b-4 border-b-emerald-950 cursor-pointer"
              style={{ fontFamily: "'Press Start 2P', monospace" }}
            >
              Join Server
            </button>
            <button
              onClick={() => setShowDirect(!showDirect)}
              className="px-4 py-2.5 bg-stone-700 hover:bg-stone-600 text-white font-bold text-xs uppercase tracking-wider border-2 border-stone-500 border-b-4 border-b-stone-950 cursor-pointer"
              style={{ fontFamily: "'Press Start 2P', monospace" }}
            >
              Direct Connect
            </button>
          </div>

          <button
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-mono cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
