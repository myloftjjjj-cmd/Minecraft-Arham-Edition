/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { GameSettings } from '../types/game';

interface MobileControlsProps {
  settings: GameSettings;
  onMove: (vector: { x: number; y: number }) => void;
  onCameraSwipe: (delta: { dx: number; dy: number }) => void;
  onJumpChange: (pressed: boolean) => void;
  onSneakChange: (pressed: boolean) => void;
  onMineChange: (pressed: boolean) => void;
  onPlacePress: () => void;
  onOpenInventory: () => void;
  onPause: () => void;
}

export const MobileControls: React.FC<MobileControlsProps> = ({
  settings,
  onMove,
  onCameraSwipe,
  onJumpChange,
  onSneakChange,
  onMineChange,
  onPlacePress,
  onOpenInventory,
  onPause,
}) => {
  const joystickRef = useRef<HTMLDivElement>(null);
  const [joystickThumb, setJoystickThumb] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [touchActive, setTouchActive] = useState<boolean>(false);
  const lastTouchRef = useRef<{ x: number; y: number } | null>(null);

  // Joystick touch handlers
  const handleJoystickStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    setTouchActive(true);
    handleJoystickMove(e);
  };

  const handleJoystickMove = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (!joystickRef.current) return;
    const touch = e.touches[0];
    const rect = joystickRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = touch.clientX - centerX;
    const dy = touch.clientY - centerY;
    const dist = Math.hypot(dx, dy);
    const maxRadius = rect.width / 2;

    const clampedDist = Math.min(dist, maxRadius);
    const angle = Math.atan2(dy, dx);
    const thumbX = Math.cos(angle) * clampedDist;
    const thumbY = Math.sin(angle) * clampedDist;

    setJoystickThumb({ x: thumbX, y: thumbY });
    onMove({ x: thumbX / maxRadius, y: thumbY / maxRadius });
  };

  const handleJoystickEnd = (e: React.TouchEvent) => {
    e.stopPropagation();
    setTouchActive(false);
    setJoystickThumb({ x: 0, y: 0 });
    onMove({ x: 0, y: 0 });
  };

  // Right-screen camera swipe handlers
  const handleCameraTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    lastTouchRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleCameraTouchMove = (e: React.TouchEvent) => {
    if (!lastTouchRef.current) return;
    const touch = e.touches[0];
    const dx = touch.clientX - lastTouchRef.current.x;
    const dy = touch.clientY - lastTouchRef.current.y;
    lastTouchRef.current = { x: touch.clientX, y: touch.clientY };
    onCameraSwipe({ dx, dy });
  };

  const handleCameraTouchEnd = () => {
    lastTouchRef.current = null;
    onCameraSwipe({ dx: 0, dy: 0 });
  };

  const joystickSize = settings.mobileJoystickSize || 110;
  const btnSize = settings.mobileButtonSize || 50;

  return (
    <div className="fixed inset-0 pointer-events-none select-none z-40 overflow-hidden">
      {/* Right-half Camera Swipe Touch Zone */}
      <div
        className="absolute right-0 top-16 bottom-20 w-1/2 pointer-events-auto"
        onTouchStart={handleCameraTouchStart}
        onTouchMove={handleCameraTouchMove}
        onTouchEnd={handleCameraTouchEnd}
        onTouchCancel={handleCameraTouchEnd}
      />

      {/* Top Bar Pause & Inventory Quick Buttons */}
      <div className="absolute top-3 right-3 flex gap-2 pointer-events-auto">
        <button
          onClick={onOpenInventory}
          className="w-10 h-10 bg-stone-900/90 border-2 border-stone-600 rounded flex items-center justify-center text-white font-bold text-xs shadow-lg active:scale-95"
        >
          🎒
        </button>
        <button
          onClick={onPause}
          className="w-10 h-10 bg-stone-900/90 border-2 border-stone-600 rounded flex items-center justify-center text-white font-bold text-xs shadow-lg active:scale-95"
        >
          ⏸️
        </button>
      </div>

      {/* Left Virtual Joystick */}
      <div className="absolute bottom-6 left-6 pointer-events-auto">
        <div
          ref={joystickRef}
          onTouchStart={handleJoystickStart}
          onTouchMove={handleJoystickMove}
          onTouchEnd={handleJoystickEnd}
          onTouchCancel={handleJoystickEnd}
          className="relative rounded-full bg-black/40 border-2 border-white/30 flex items-center justify-center shadow-xl backdrop-blur-xs"
          style={{ width: `${joystickSize}px`, height: `${joystickSize}px` }}
        >
          {/* Thumb Nub */}
          <div
            className="w-12 h-12 rounded-full bg-cyan-400/70 border-2 border-white shadow-lg pointer-events-none transition-transform duration-75"
            style={{
              transform: `translate(${joystickThumb.x}px, ${joystickThumb.y}px)`,
            }}
          />
        </div>
      </div>

      {/* Right Action Buttons Cluster */}
      <div className="absolute bottom-6 right-6 flex flex-col items-end gap-2.5 pointer-events-auto">
        {/* Mine & Place row */}
        <div className="flex gap-2">
          <button
            onTouchStart={() => onMineChange(true)}
            onTouchEnd={() => onMineChange(false)}
            className="w-12 h-12 bg-rose-900/80 active:bg-rose-700 border-2 border-rose-400 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-xl active:scale-90"
          >
            ⛏️
          </button>
          <button
            onClick={onPlacePress}
            className="w-12 h-12 bg-emerald-900/80 active:bg-emerald-700 border-2 border-emerald-400 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-xl active:scale-90"
          >
            🧱
          </button>
        </div>

        {/* Sneak & Jump row */}
        <div className="flex gap-2">
          <button
            onTouchStart={() => onSneakChange(true)}
            onTouchEnd={() => onSneakChange(false)}
            className="w-12 h-12 bg-stone-800/80 active:bg-stone-600 border-2 border-stone-500 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-xl active:scale-90"
          >
            ⬇️
          </button>
          <button
            onTouchStart={() => onJumpChange(true)}
            onTouchEnd={() => onJumpChange(false)}
            className="w-14 h-14 bg-cyan-800/80 active:bg-cyan-600 border-2 border-cyan-400 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-xl active:scale-90"
          >
            ⬆️
          </button>
        </div>
      </div>
    </div>
  );
};
