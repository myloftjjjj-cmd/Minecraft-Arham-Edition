/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { GameSettings } from '../types/game';
import { soundEngine } from '../engine/audio';

interface SettingsModalProps {
  settings: GameSettings;
  onSaveSettings: (settings: GameSettings) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onSaveSettings,
  onClose,
}) => {
  const [localSettings, setLocalSettings] = useState<GameSettings>({ ...settings });
  const [activeTab, setActiveTab] = useState<'video' | 'controls' | 'audio'>('video');

  const updateSetting = <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => {
    setLocalSettings(prev => {
      const next = { ...prev, [key]: value };
      if (key === 'masterVolume' || key === 'sfxVolume' || key === 'musicVolume') {
        soundEngine.setVolumes(next.masterVolume, next.sfxVolume, next.musicVolume);
      }
      return next;
    });
  };

  const handleDone = () => {
    soundEngine.playClick();
    onSaveSettings(localSettings);
    onClose();
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
            Settings
          </h2>
          <button
            onClick={handleDone}
            className="text-stone-400 hover:text-white font-mono text-sm cursor-pointer"
          >
            ✕ Close
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-stone-800 bg-stone-950 px-4 pt-2 gap-2">
          {(['video', 'controls', 'audio'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider cursor-pointer border-t-2 border-x-2 transition-colors ${
                activeTab === tab
                  ? 'bg-stone-900 border-stone-500 text-yellow-300'
                  : 'bg-stone-950 border-transparent text-stone-400 hover:text-stone-200'
              }`}
              style={{ fontFamily: "'Press Start 2P', monospace" }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 font-mono text-xs text-stone-200 space-y-4">
          {activeTab === 'video' && (
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span>Render Distance</span>
                  <span className="text-yellow-400 font-bold">{localSettings.renderDistance} Chunks</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="8"
                  value={localSettings.renderDistance}
                  onChange={e => updateSetting('renderDistance', parseInt(e.target.value, 10))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span>Field of View (FOV)</span>
                  <span className="text-yellow-400 font-bold">{localSettings.fov}°</span>
                </div>
                <input
                  type="range"
                  min="60"
                  max="100"
                  value={localSettings.fov}
                  onChange={e => updateSetting('fov', parseInt(e.target.value, 10))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1">Graphics Quality</label>
                  <select
                    value={localSettings.graphics}
                    onChange={e => updateSetting('graphics', e.target.value as 'fast' | 'fancy')}
                    className="w-full px-2 py-1.5 bg-stone-950 border border-stone-700 text-white outline-none"
                  >
                    <option value="fancy">Fancy (Leaves cutout, soft lighting)</option>
                    <option value="fast">Fast (Maximum mobile performance)</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1">FPS Limit</label>
                  <select
                    value={localSettings.fpsLimit}
                    onChange={e => updateSetting('fpsLimit', parseInt(e.target.value, 10))}
                    className="w-full px-2 py-1.5 bg-stone-950 border border-stone-700 text-white outline-none"
                  >
                    <option value="60">60 FPS</option>
                    <option value="120">120 FPS</option>
                    <option value="30">30 FPS (Battery Saver)</option>
                    <option value="0">Unlimited</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="shadows"
                  checked={localSettings.shadows}
                  onChange={e => updateSetting('shadows', e.target.checked)}
                  className="w-4 h-4 accent-cyan-500"
                />
                <label htmlFor="shadows" className="cursor-pointer">
                  Enable Real-Time Directional Shadows
                </label>
              </div>
            </div>
          )}

          {activeTab === 'controls' && (
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span>Mouse Sensitivity</span>
                  <span className="text-yellow-400 font-bold">{localSettings.mouseSensitivity.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="2.5"
                  step="0.05"
                  value={localSettings.mouseSensitivity}
                  onChange={e => updateSetting('mouseSensitivity', parseFloat(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span>Mobile Touch Sensitivity</span>
                  <span className="text-yellow-400 font-bold">{localSettings.mobileSensitivity.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="3.0"
                  step="0.1"
                  value={localSettings.mobileSensitivity}
                  onChange={e => updateSetting('mobileSensitivity', parseFloat(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span>Virtual Joystick Size</span>
                    <span className="text-yellow-400 font-bold">{localSettings.mobileJoystickSize}px</span>
                  </div>
                  <input
                    type="range"
                    min="80"
                    max="150"
                    value={localSettings.mobileJoystickSize}
                    onChange={e => updateSetting('mobileJoystickSize', parseInt(e.target.value, 10))}
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span>Action Buttons Size</span>
                    <span className="text-yellow-400 font-bold">{localSettings.mobileButtonSize}px</span>
                  </div>
                  <input
                    type="range"
                    min="40"
                    max="70"
                    value={localSettings.mobileButtonSize}
                    onChange={e => updateSetting('mobileButtonSize', parseInt(e.target.value, 10))}
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="inverty"
                  checked={localSettings.invertY}
                  onChange={e => updateSetting('invertY', e.target.checked)}
                  className="w-4 h-4 accent-cyan-500"
                />
                <label htmlFor="inverty" className="cursor-pointer">
                  Invert Y Axis
                </label>
              </div>
            </div>
          )}

          {activeTab === 'audio' && (
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span>Master Volume</span>
                  <span className="text-yellow-400 font-bold">{Math.round(localSettings.masterVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={localSettings.masterVolume}
                  onChange={e => updateSetting('masterVolume', parseFloat(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span>Sound Effects (SFX)</span>
                  <span className="text-yellow-400 font-bold">{Math.round(localSettings.sfxVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={localSettings.sfxVolume}
                  onChange={e => updateSetting('sfxVolume', parseFloat(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span>Music Volume</span>
                  <span className="text-yellow-400 font-bold">{Math.round(localSettings.musicVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={localSettings.musicVolume}
                  onChange={e => updateSetting('musicVolume', parseFloat(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-800 border-t-2 border-stone-700 flex justify-end">
          <button
            onClick={handleDone}
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
