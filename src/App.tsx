/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  GameMode,
  GameSettings,
  PlayerState,
  SavedWorldData,
} from './types/game';
import { WorldStorage } from './engine/storage';
import { soundEngine } from './engine/audio';
import { createItemStack } from './engine/items';
import { CommandContext } from './engine/mods';

// UI Components
import { MainMenu } from './components/MainMenu';
import { WorldSelectModal } from './components/WorldSelectModal';
import { ModsMarketplaceModal } from './components/ModsMarketplaceModal';
import { ResourcePacksModal } from './components/ResourcePacksModal';
import { MultiplayerModal } from './components/MultiplayerModal';
import { SettingsModal } from './components/SettingsModal';
import { GameCanvas } from './components/GameCanvas';
import { InGameHUD } from './components/InGameHUD';
import { InventoryModal, InventoryMode } from './components/InventoryModal';
import { PauseMenu } from './components/PauseMenu';
import { DeathScreen } from './components/DeathScreen';
import { ChatBox } from './components/ChatBox';
import { MobileControls } from './components/MobileControls';

export default function App() {
  // Screen States
  const [screen, setScreen] = useState<'main_menu' | 'world_select' | 'playing'>('main_menu');
  const [showModsMarketplace, setShowModsMarketplace] = useState<boolean>(false);
  const [showResourcePacks, setShowResourcePacks] = useState<boolean>(false);
  const [showMultiplayer, setShowMultiplayer] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);

  // In-Game Modals
  const [inventoryMode, setInventoryMode] = useState<InventoryMode | null>(null);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isDead, setIsDead] = useState<boolean>(false);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [showF3, setShowF3] = useState<boolean>(false);

  // Active World State
  const [activeWorld, setActiveWorld] = useState<SavedWorldData | null>(null);

  // Mobile Input States
  const [isMobileDevice, setIsMobileDevice] = useState<boolean>(false);
  const [mobileMoveVec, setMobileMoveVec] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [mobileCamDelta, setMobileCamDelta] = useState<{ dx: number; dy: number }>({ dx: 0, dy: 0 });
  const [mobileJump, setMobileJump] = useState<boolean>(false);
  const [mobileSneak, setMobileSneak] = useState<boolean>(false);
  const [mobileMine, setMobileMine] = useState<boolean>(false);

  // Settings
  const [settings, setSettings] = useState<GameSettings>({
    renderDistance: 4,
    fov: 75,
    graphics: 'fancy',
    smoothLighting: true,
    shadows: true,
    fpsLimit: 60,
    brightness: 80,
    viewBobbing: true,
    showFps: true,
    showCoordinates: true,
    mouseSensitivity: 1.0,
    invertY: false,
    mobileJoystickSize: 110,
    mobileButtonSize: 48,
    mobileSensitivity: 1.2,
    masterVolume: 0.8,
    sfxVolume: 0.8,
    musicVolume: 0.5,
    ambientVolume: 0.6,
    difficulty: 'normal',
    cameraMode: 'first_person',
    autoSaveIntervalMinutes: 2,
  });

  // Detect touch device
  useEffect(() => {
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    setIsMobileDevice(isTouch);
  }, []);

  // Keyboard shortcut listeners (E for inventory, T or / for chat, F3 for debug)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (screen !== 'playing') return;

      // Toggle Chat with T or /
      if ((e.code === 'KeyT' || e.key === '/') && !isChatOpen && !inventoryMode && !isPaused) {
        e.preventDefault();
        setIsChatOpen(true);
        return;
      }

      // F3 Debug
      if (e.code === 'F3') {
        e.preventDefault();
        setShowF3(prev => !prev);
        return;
      }

      // Pause toggle
      if (e.code === 'Escape') {
        if (isChatOpen) {
          setIsChatOpen(false);
          return;
        }
        if (inventoryMode) {
          setInventoryMode(null);
          return;
        }
        if (showModsMarketplace) {
          setShowModsMarketplace(false);
          return;
        }
        if (showSettings) {
          setShowSettings(false);
          return;
        }
        setIsPaused(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [screen, isChatOpen, inventoryMode, isPaused, showModsMarketplace, showSettings]);

  // Load selected world from IndexedDB
  const handleSelectWorld = async (worldId: string) => {
    const data = await WorldStorage.loadWorld(worldId);
    if (!data) return;
    setActiveWorld(data);
    setScreen('playing');
    setIsPaused(false);
    setIsDead(false);
    setInventoryMode(null);
  };

  // Save current world to IndexedDB
  const saveCurrentWorld = useCallback(async () => {
    if (!activeWorld) return;
    await WorldStorage.saveWorld(activeWorld);
  }, [activeWorld]);

  // Periodic auto-save
  useEffect(() => {
    if (screen !== 'playing' || !activeWorld) return;
    const interval = setInterval(() => {
      saveCurrentWorld();
    }, (settings.autoSaveIntervalMinutes || 2) * 60000);
    return () => clearInterval(interval);
  }, [screen, activeWorld, settings.autoSaveIntervalMinutes, saveCurrentWorld]);

  // Player state updater
  const handleUpdatePlayer = useCallback((updater: (prev: PlayerState) => PlayerState) => {
    setActiveWorld(prev => {
      if (!prev) return prev;
      const nextPlayer = updater(prev.player);
      return { ...prev, player: nextPlayer };
    });
  }, []);

  // Death trigger
  const handlePlayerDeath = () => {
    setIsDead(true);
    soundEngine.playHurt();
  };

  // Respawn action
  const handleRespawn = () => {
    setIsDead(false);
    handleUpdatePlayer(prev => ({
      ...prev,
      health: 20,
      hunger: 20,
      position: [prev.position[0], 36, prev.position[2]],
    }));
  };

  // Return to Title Screen
  const handleQuitToTitle = async () => {
    await saveCurrentWorld();
    setActiveWorld(null);
    setScreen('main_menu');
    setIsPaused(false);
    setIsDead(false);
    setInventoryMode(null);
  };

  // Slash commands execution context
  const commandContext: CommandContext = {
    args: [],
    setGameMode: (mode: GameMode) => {
      handleUpdatePlayer(prev => ({ ...prev, gameMode: mode, isFlying: mode === 'creative' }));
    },
    setTimeOfDay: (time: number) => {
      setActiveWorld(prev => (prev ? { ...prev, timeOfDay: time } : null));
    },
    setWeather: (w: 'clear' | 'rain' | 'thunder') => {
      setActiveWorld(prev => (prev ? { ...prev, weather: w } : null));
    },
    teleportPlayer: (x: number, y: number, z: number) => {
      handleUpdatePlayer(prev => ({ ...prev, position: [x, y, z] }));
    },
    giveItem: (itemId: string, count: number) => {
      handleUpdatePlayer(prev => {
        const inv = [...prev.inventory];
        const item = createItemStack(itemId, count);
        for (let i = 0; i < 36; i++) {
          if (!inv[i]) {
            inv[i] = item;
            break;
          }
        }
        return { ...prev, inventory: inv };
      });
    },
    spawnMob: (_type: string) => {
      // mob manager spawns via engine
    },
    addChatMessage: () => {},
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black select-none font-sans">
      {/* 1. MAIN MENU */}
      {screen === 'main_menu' && (
        <MainMenu
          onSingleplayer={() => setScreen('world_select')}
          onMultiplayer={() => setShowMultiplayer(true)}
          onMods={() => setShowModsMarketplace(true)}
          onResourcePacks={() => setShowResourcePacks(true)}
          onSettings={() => setShowSettings(true)}
        />
      )}

      {/* 2. WORLD SELECTION MODAL */}
      {screen === 'world_select' && (
        <WorldSelectModal
          onSelectWorld={handleSelectWorld}
          onBack={() => setScreen('main_menu')}
        />
      )}

      {/* 3. ACTIVE 3D GAMEPLAY */}
      {screen === 'playing' && activeWorld && (
        <>
          {/* Three.js Isolated Canvas Mount */}
          <GameCanvas
            worldData={activeWorld}
            settings={settings}
            onUpdatePlayer={handleUpdatePlayer}
            onOpenInventory={() => setInventoryMode('inventory')}
            onOpenCraftingTable={() => setInventoryMode('crafting_table')}
            onOpenFurnace={() => setInventoryMode('furnace')}
            onOpenChest={() => setInventoryMode('chest')}
            onDeath={handlePlayerDeath}
            onPause={() => setIsPaused(true)}
            mobileMoveVector={mobileMoveVec}
            mobileCameraDelta={mobileCamDelta}
            mobileJumpPressed={mobileJump}
            mobileSneakPressed={mobileSneak}
            mobileMinePressed={mobileMine}
          />

          {/* In-Game HUD: Hearts, Hunger, Crosshair, Hotbar, Minimap, F3 Debug */}
          <InGameHUD
            playerState={activeWorld.player}
            settings={settings}
            fps={60}
            biome="Plains"
            lightLevel={15}
            facing="North (Z-)"
            timeString={`${Math.floor((activeWorld.timeOfDay / 1000 + 6) % 24)}:00`}
            showF3={showF3}
            onSlotSelect={slot => handleUpdatePlayer(prev => ({ ...prev, selectedSlot: slot }))}
          />

          {/* Android Mobile Touch Controls Overlay */}
          {isMobileDevice && (
            <MobileControls
              settings={settings}
              onMove={setMobileMoveVec}
              onCameraSwipe={setMobileCamDelta}
              onJumpChange={setMobileJump}
              onSneakChange={setMobileSneak}
              onMineChange={setMobileMine}
              onPlacePress={() => {
                // place action triggered in canvas via raycast
              }}
              onOpenInventory={() => setInventoryMode('inventory')}
              onPause={() => setIsPaused(true)}
            />
          )}

          {/* Chat Box & Commands Overlay */}
          <ChatBox
            isOpen={isChatOpen}
            onClose={() => setIsChatOpen(false)}
            cmdContext={commandContext}
          />

          {/* In-Game Inventory & Crafting Table & Furnace Modal */}
          {inventoryMode && (
            <InventoryModal
              mode={inventoryMode}
              playerState={activeWorld.player}
              onUpdatePlayer={handleUpdatePlayer}
              onClose={() => setInventoryMode(null)}
            />
          )}

          {/* Pause Menu Modal */}
          {isPaused && (
            <PauseMenu
              onResume={() => setIsPaused(false)}
              onMods={() => setShowModsMarketplace(true)}
              onSettings={() => setShowSettings(true)}
              onOpenToLAN={() => setShowMultiplayer(true)}
              onSaveAndQuit={handleQuitToTitle}
            />
          )}

          {/* Death Screen */}
          {isDead && (
            <DeathScreen
              onRespawn={handleRespawn}
              onQuitToTitle={handleQuitToTitle}
            />
          )}
        </>
      )}

      {/* 4. GLOBAL MODALS (Openable from Main Menu or In-Game) */}

      {/* 💎 MODS MARKETPLACE (Flagship Feature) */}
      {showModsMarketplace && (
        <ModsMarketplaceModal onClose={() => setShowModsMarketplace(false)} />
      )}

      {/* Resource Packs Manager */}
      {showResourcePacks && (
        <ResourcePacksModal onClose={() => setShowResourcePacks(false)} />
      )}

      {/* Multiplayer Servers Modal */}
      {showMultiplayer && (
        <MultiplayerModal
          onClose={() => setShowMultiplayer(false)}
          onConnectServer={(url) => {
            soundEngine.playItemPickup();
            alert(`Connecting to server "${url}"...\nMultiplayer session joined!`);
            setShowMultiplayer(false);
          }}
        />
      )}

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal
          settings={settings}
          onSaveSettings={setSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
