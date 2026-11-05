/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { BlockType, ItemStack, GameSettings, PlayerState, SavedWorldData } from '../types/game';
import { BLOCK_DEFS, getBlockDef, isBlockSolid } from '../engine/blocks';
import { Chunk } from '../engine/chunk';
import { WorldGenerator } from '../engine/worldgen';
import { TextureManager } from '../engine/textures';
import { PhysicsEngine } from '../engine/physics';
import { MobManager } from '../engine/mobs';
import { ParticleSystem } from '../engine/particles';
import { soundEngine } from '../engine/audio';
import { modLoader } from '../engine/mods';
import { modrinthService } from '../engine/modrinth';

interface GameCanvasProps {
  worldData: SavedWorldData;
  settings: GameSettings;
  onUpdatePlayer: (updater: (prev: PlayerState) => PlayerState) => void;
  onOpenInventory: () => void;
  onOpenCraftingTable: () => void;
  onOpenFurnace: () => void;
  onOpenChest: (chestPos: [number, number, number]) => void;
  onDeath: () => void;
  onPause: () => void;
  // Mobile virtual joystick & buttons pass-through
  mobileMoveVector?: { x: number; y: number };
  mobileCameraDelta?: { dx: number; dy: number };
  mobileJumpPressed?: boolean;
  mobileSneakPressed?: boolean;
  mobileMinePressed?: boolean;
  mobilePlacePressed?: boolean;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  worldData,
  settings,
  onUpdatePlayer,
  onOpenInventory,
  onOpenCraftingTable,
  onOpenFurnace,
  onOpenChest,
  onDeath,
  onPause,
  mobileMoveVector,
  mobileCameraDelta,
  mobileJumpPressed,
  mobileSneakPressed,
  mobileMinePressed,
  mobilePlacePressed,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  // References to keep game loop completely decoupled from React state updates
  const stateRef = useRef({
    worldData,
    settings,
    playerState: worldData.player,
    isPaused: false,
    keys: {} as Record<string, boolean>,
    mouseButtons: {} as Record<number, boolean>,
    pointerLocked: false,
    yaw: worldData.player.rotation[0],
    pitch: worldData.player.rotation[1],
    targetBlock: null as { pos: [number, number, number]; normal: [number, number, number]; type: BlockType } | null,
    miningProgress: 0,
    miningTimer: 0,
    handSwing: 0,
    flyCooldown: 0,
    spaceTaps: 0,
  });

  // Keep stateRef up to date with props
  useEffect(() => {
    stateRef.current.settings = settings;
    stateRef.current.worldData = worldData;
  }, [settings, worldData]);

  // Main 3D Engine Setup
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect software GL
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x78a7ff);
    scene.fog = new THREE.FogExp2(0x78a7ff, 0.016);

    const camera = new THREE.PerspectiveCamera(settings.fov, width / height, 0.1, 300);
    camera.rotation.order = 'YXZ';

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.shadowMap.enabled = settings.shadows && !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // Texture Manager & Materials
    const texManager = TextureManager.getInstance();
    const atlasTex = texManager.getAtlasTexture();

    const opaqueMaterial = new THREE.MeshLambertMaterial({
      map: atlasTex,
      vertexColors: true,
      transparent: true,
      alphaTest: 0.1,
    });

    const waterMaterial = new THREE.MeshLambertMaterial({
      map: atlasTex,
      vertexColors: true,
      transparent: true,
      opacity: 0.72,
    });

    // World & Chunks
    const worldGen = new WorldGenerator(worldData.metadata.seed, worldData.metadata.worldType);
    const chunks = new Map<string, Chunk>();
    const modifiedBlocks = { ...worldData.modifiedBlocks };

    const getBlock = (wx: number, wy: number, wz: number): BlockType => {
      if (wy < 0 || wy >= WorldGenerator.CHUNK_HEIGHT) return BlockType.AIR;
      const key = `${wx},${wy},${wz}`;
      if (modifiedBlocks[key] !== undefined) {
        return modifiedBlocks[key];
      }
      const cx = Math.floor(wx / Chunk.SIZE_X);
      const cz = Math.floor(wz / Chunk.SIZE_Z);
      const chunkKey = `${cx},${cz}`;
      let chunk = chunks.get(chunkKey);
      if (!chunk) {
        // Generate chunk data on the fly
        const raw = worldGen.generateChunkData(cx, cz);
        chunk = new Chunk(cx, cz, raw);
        chunks.set(chunkKey, chunk);
      }
      const lx = ((wx % Chunk.SIZE_X) + Chunk.SIZE_X) % Chunk.SIZE_X;
      const lz = ((wz % Chunk.SIZE_Z) + Chunk.SIZE_Z) % Chunk.SIZE_Z;
      return chunk.getBlock(lx, wy, lz);
    };

    const setBlock = (wx: number, wy: number, wz: number, type: BlockType) => {
      const key = `${wx},${wy},${wz}`;
      modifiedBlocks[key] = type;
      worldData.modifiedBlocks[key] = type;

      const cx = Math.floor(wx / Chunk.SIZE_X);
      const cz = Math.floor(wz / Chunk.SIZE_Z);
      const chunkKey = `${cx},${cz}`;
      const chunk = chunks.get(chunkKey);
      if (chunk) {
        const lx = ((wx % Chunk.SIZE_X) + Chunk.SIZE_X) % Chunk.SIZE_X;
        const lz = ((wz % Chunk.SIZE_Z) + Chunk.SIZE_Z) % Chunk.SIZE_Z;
        chunk.setBlock(lx, wy, lz, type);
        chunk.buildMesh(getBlock, opaqueMaterial, waterMaterial);
      }

      // Rebuild neighbor chunks if on border
      const lx = ((wx % Chunk.SIZE_X) + Chunk.SIZE_X) % Chunk.SIZE_X;
      const lz = ((wz % Chunk.SIZE_Z) + Chunk.SIZE_Z) % Chunk.SIZE_Z;
      if (lx === 0) chunks.get(`${cx - 1},${cz}`)?.buildMesh(getBlock, opaqueMaterial, waterMaterial);
      if (lx === Chunk.SIZE_X - 1) chunks.get(`${cx + 1},${cz}`)?.buildMesh(getBlock, opaqueMaterial, waterMaterial);
      if (lz === 0) chunks.get(`${cx},${cz - 1}`)?.buildMesh(getBlock, opaqueMaterial, waterMaterial);
      if (lz === Chunk.SIZE_Z - 1) chunks.get(`${cx},${cz + 1}`)?.buildMesh(getBlock, opaqueMaterial, waterMaterial);
    };

    // Lights
    const hemiLight = new THREE.HemisphereLight(0xddeeff, 0x334422, 0.7);
    scene.add(hemiLight);

    const sunDirLight = new THREE.DirectionalLight(0xfffaed, 1.2);
    sunDirLight.position.set(50, 100, 30);
    sunDirLight.castShadow = settings.shadows && !isSoftwareGl;
    sunDirLight.shadow.mapSize.width = 1024;
    sunDirLight.shadow.mapSize.height = 1024;
    sunDirLight.shadow.camera.near = 0.5;
    sunDirLight.shadow.camera.far = 250;
    const d = 40;
    sunDirLight.shadow.camera.left = -d;
    sunDirLight.shadow.camera.right = d;
    sunDirLight.shadow.camera.top = d;
    sunDirLight.shadow.camera.bottom = -d;
    scene.add(sunDirLight);

    // Sun & Moon Mesh Billboards
    const sunGeom = new THREE.PlaneGeometry(16, 16);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xfff499, side: THREE.DoubleSide });
    const sunMesh = new THREE.Mesh(sunGeom, sunMat);
    scene.add(sunMesh);

    const moonGeom = new THREE.PlaneGeometry(12, 12);
    const moonMat = new THREE.MeshBasicMaterial({ color: 0xddddff, side: THREE.DoubleSide });
    const moonMesh = new THREE.Mesh(moonGeom, moonMat);
    scene.add(moonMesh);

    // Target Block Outline Box Wireframe
    const outlineGeom = new THREE.BoxGeometry(1.004, 1.004, 1.004);
    const outlineMat = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 });
    const wireframe = new THREE.LineSegments(new THREE.EdgesGeometry(outlineGeom), outlineMat);
    wireframe.visible = false;
    scene.add(wireframe);

    // Player Model & Hand Rig
    const playerPos = new THREE.Vector3(...worldData.player.position);
    const playerVel = new THREE.Vector3(0, 0, 0);

    const handGroup = new THREE.Group();
    const handGeom = new THREE.BoxGeometry(0.18, 0.45, 0.18);
    const handMat = new THREE.MeshLambertMaterial({ color: 0xb57c4c });
    const handMesh = new THREE.Mesh(handGeom, handMat);
    handMesh.position.set(0.35, -0.3, -0.5);
    handMesh.rotation.set(-0.2, 0.1, 0);
    handGroup.add(handMesh);
    camera.add(handGroup);
    scene.add(camera);

    // Entity & Particle Systems
    const mobManager = new MobManager(scene);
    const particleSystem = new ParticleSystem(scene);

    // Spawn initial peaceful & hostile mobs in nearby surroundings
    const initialMobTypes: ('cow' | 'pig' | 'sheep' | 'zombie' | 'creeper')[] = ['cow', 'pig', 'sheep', 'zombie', 'creeper'];
    for (let i = 0; i < 6; i++) {
      const mx = playerPos.x + (Math.random() - 0.5) * 36;
      const mz = playerPos.z + (Math.random() - 0.5) * 36;
      const my = worldGen.getHeight(mx, mz) + 1;
      const mType = initialMobTypes[i % initialMobTypes.length];
      mobManager.spawnMob(mType, [mx, my, mz]);
    }

    // Input handlers
    const onKeyDown = (e: KeyboardEvent) => {
      stateRef.current.keys[e.code] = true;

      // Hotbar selection numbers 1-9
      if (e.code.startsWith('Digit')) {
        const num = parseInt(e.code.replace('Digit', ''), 10);
        if (num >= 1 && num <= 9) {
          onUpdatePlayer(prev => ({ ...prev, selectedSlot: num - 1 }));
          soundEngine.playClick();
        }
      }

      // Inventory E
      if (e.code === 'KeyE') {
        onOpenInventory();
      }

      // Pause / Esc
      if (e.code === 'Escape') {
        onPause();
      }

      // Space double-tap for Creative Fly
      if (e.code === 'Space') {
        const now = performance.now();
        if (stateRef.current.worldData.metadata.gameMode === 'creative') {
          if (now - stateRef.current.flyCooldown < 300) {
            onUpdatePlayer(prev => ({ ...prev, isFlying: !prev.isFlying }));
            stateRef.current.flyCooldown = 0;
          } else {
            stateRef.current.flyCooldown = now;
          }
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      stateRef.current.keys[e.code] = false;
    };

    const onMouseDown = (e: MouseEvent) => {
      if (!stateRef.current.pointerLocked) {
        renderer.domElement.requestPointerLock?.();
        return;
      }
      stateRef.current.mouseButtons[e.button] = true;

      if (e.button === 0) {
        // Attack or mine start
        stateRef.current.handSwing = 1.0;
        soundEngine.playAttackSwing();

        // Check if hitting a mob
        const rayDir = new THREE.Vector3();
        camera.getWorldDirection(rayDir);
        let hitMobId: string | null = null;
        let hitDist = 3.5;

        mobManager.mobs.forEach(({ entity }, id) => {
          const mobV = new THREE.Vector3(...entity.position);
          const toMob = mobV.clone().sub(camera.position);
          const proj = toMob.dot(rayDir);
          if (proj > 0 && proj < hitDist) {
            const closestPoint = camera.position.clone().addScaledVector(rayDir, proj);
            if (closestPoint.distanceTo(mobV.clone().add(new THREE.Vector3(0, 0.8, 0))) < 1.0) {
              hitMobId = id;
              hitDist = proj;
            }
          }
        });

        if (hitMobId) {
          const curSlot = stateRef.current.playerState.selectedSlot;
          const heldItem = stateRef.current.playerState.inventory[curSlot];
          const dmg = heldItem?.damage || 1;
          mobManager.damageMob(hitMobId, dmg, rayDir);
          return;
        }
      } else if (e.button === 2) {
        // Right click: place block or interact
        const target = stateRef.current.targetBlock;
        if (target) {
          // Check interactive blocks (Crafting table, furnace, chest)
          if (target.type === BlockType.CRAFTING_TABLE) {
            onOpenCraftingTable();
            return;
          } else if (target.type === BlockType.FURNACE) {
            onOpenFurnace();
            return;
          } else if (target.type === BlockType.CHEST) {
            onOpenChest(target.pos);
            return;
          }

          // Place held block
          const curSlot = stateRef.current.playerState.selectedSlot;
          const heldItem = stateRef.current.playerState.inventory[curSlot];
          if (heldItem && heldItem.isBlock && heldItem.blockType !== undefined) {
            const placeX = target.pos[0] + target.normal[0];
            const placeY = target.pos[1] + target.normal[1];
            const placeZ = target.pos[2] + target.normal[2];

            // Ensure not placing inside player AABB
            const pMinX = playerPos.x - 0.3, pMaxX = playerPos.x + 0.3;
            const pMinY = playerPos.y, pMaxY = playerPos.y + (stateRef.current.keys['ShiftLeft'] ? 1.5 : 1.8);
            const pMinZ = playerPos.z - 0.3, pMaxZ = playerPos.z + 0.3;

            const insidePlayer =
              placeX < pMaxX && placeX + 1 > pMinX &&
              placeY < pMaxY && placeY + 1 > pMinY &&
              placeZ < pMaxZ && placeZ + 1 > pMinZ;

            if (!insidePlayer) {
              setBlock(placeX, placeY, placeZ, heldItem.blockType);
              soundEngine.playBlockPlace();
              stateRef.current.handSwing = 0.8;

              // Consume 1 from inventory in survival
              if (stateRef.current.worldData.metadata.gameMode === 'survival') {
                onUpdatePlayer(prev => {
                  const inv = [...prev.inventory];
                  const item = inv[curSlot];
                  if (item) {
                    item.count -= 1;
                    if (item.count <= 0) inv[curSlot] = null;
                  }
                  return { ...prev, inventory: inv };
                });
              }
            }
          }
        }
      }
    };

    const onMouseUp = (e: MouseEvent) => {
      stateRef.current.mouseButtons[e.button] = false;
      if (e.button === 0) {
        stateRef.current.miningProgress = 0;
        stateRef.current.miningTimer = 0;
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!stateRef.current.pointerLocked) return;
      const sens = (settings.mouseSensitivity || 1.0) * 0.0022;
      stateRef.current.yaw -= e.movementX * sens;
      stateRef.current.pitch -= e.movementY * sens * (settings.invertY ? -1 : 1);
      stateRef.current.pitch = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, stateRef.current.pitch));
    };

    const onPointerLockChange = () => {
      stateRef.current.pointerLocked = document.pointerLockElement === renderer.domElement;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    renderer.domElement.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMove);
    document.addEventListener('pointerlockchange', onPointerLockChange);

    // Main Simulation Tick & Animation Loop
    let lastTime = performance.now();
    let frameId = 0;
    let timeOfDay = worldData.timeOfDay || 6000;

    const tick = () => {
      const now = performance.now();
      const rawDt = (now - lastTime) / 1000;
      lastTime = now;
      const dt = Math.min(rawDt, 0.05);

      // Handle Mobile Touch Controls Camera Swipe
      if (mobileCameraDelta && (mobileCameraDelta.dx !== 0 || mobileCameraDelta.dy !== 0)) {
        const mobSens = (settings.mobileSensitivity || 1.0) * 0.0035;
        stateRef.current.yaw -= mobileCameraDelta.dx * mobSens;
        stateRef.current.pitch -= mobileCameraDelta.dy * mobSens * (settings.invertY ? -1 : 1);
        stateRef.current.pitch = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, stateRef.current.pitch));
      }

      // Day / Night cycle progression
      timeOfDay = (timeOfDay + dt * 20) % 24000;
      worldData.timeOfDay = timeOfDay;

      // Celestial orbit (Sun & Moon position)
      const sunAngle = (timeOfDay / 24000) * Math.PI * 2 - Math.PI / 2;
      const orbitDist = 180;
      const sunX = playerPos.x + Math.cos(sunAngle) * orbitDist;
      const sunY = playerPos.y + Math.sin(sunAngle) * orbitDist;
      const sunZ = playerPos.z + 40;

      sunMesh.position.set(sunX, sunY, sunZ);
      sunMesh.lookAt(playerPos);
      moonMesh.position.set(playerPos.x - Math.cos(sunAngle) * orbitDist, playerPos.y - Math.sin(sunAngle) * orbitDist, sunZ);
      moonMesh.lookAt(playerPos);

      sunDirLight.position.set(sunX, sunY, sunZ);
      sunDirLight.target.position.copy(playerPos);
      sunDirLight.target.updateMatrixWorld();

      // Sky and ambient light color by time of day
      const isDay = sunY > playerPos.y;
      const skyFactor = Math.max(0, Math.sin(sunAngle));
      const skyColor = new THREE.Color().lerpColors(
        new THREE.Color(0x0a1024), // deep night blue
        new THREE.Color(0x78a7ff), // daytime sky
        skyFactor
      );
      scene.background = skyColor;
      if (scene.fog) (scene.fog as THREE.FogExp2).color = skyColor;
      sunDirLight.intensity = Math.max(0.08, skyFactor * 1.3);
      hemiLight.intensity = Math.max(0.2, skyFactor * 0.7);

      // Handheld Dynamic Light Mod Hook
      if (modrinthService.isModEnabled('arham-dynamic-lights')) {
        const curItem = stateRef.current.playerState.inventory[stateRef.current.playerState.selectedSlot];
        if (curItem?.id === 'block:torch' || curItem?.id === 'block:lava') {
          hemiLight.intensity = Math.max(hemiLight.intensity, 0.85);
        }
      }

      // Player Movement Kinematics
      const isSneaking = stateRef.current.keys['ShiftLeft'] || !!mobileSneakPressed;
      const isSprinting = stateRef.current.keys['ControlLeft'] || stateRef.current.keys['KeyR'];
      const isFlying = !!stateRef.current.playerState.isFlying;

      const moveForward = (stateRef.current.keys['KeyW'] ? 1 : 0) - (stateRef.current.keys['KeyS'] ? 1 : 0) + (mobileMoveVector ? -mobileMoveVector.y : 0);
      const moveRight = (stateRef.current.keys['KeyD'] ? 1 : 0) - (stateRef.current.keys['KeyA'] ? 1 : 0) + (mobileMoveVector ? mobileMoveVector.x : 0);

      const sinYaw = Math.sin(stateRef.current.yaw);
      const cosYaw = Math.cos(stateRef.current.yaw);

      let baseSpeed = 4.3;
      if (isSprinting) baseSpeed = 6.2;
      if (isSneaking) baseSpeed = 1.8;
      if (isFlying) baseSpeed = 10.0;

      const wishDirX = sinYaw * moveForward + cosYaw * moveRight;
      const wishDirZ = cosYaw * moveForward - sinYaw * moveRight;
      const wishLen = Math.hypot(wishDirX, wishDirZ);

      if (wishLen > 0.01) {
        playerVel.x += (wishDirX / wishLen) * baseSpeed * 12 * dt;
        playerVel.z += (wishDirZ / wishLen) * baseSpeed * 12 * dt;

        // Footstep sounds
        if (!isFlying && (Math.hypot(playerVel.x, playerVel.z) > 1.5)) {
          if (Math.random() < dt * 3.5) {
            soundEngine.playStep('grass');
          }
        }
      }

      // Jumping & Flying vertical movement
      const wantJump = stateRef.current.keys['Space'] || !!mobileJumpPressed;
      if (isFlying) {
        if (wantJump) playerVel.y = 8.0;
        else if (isSneaking) playerVel.y = -8.0;
        else playerVel.y *= 0.8;
      } else {
        const isInWater = getBlock(Math.floor(playerPos.x), Math.floor(playerPos.y + 0.5), Math.floor(playerPos.z)) === BlockType.WATER;
        if (wantJump) {
          if (isInWater) {
            playerVel.y = PhysicsEngine.SWIM_SPEED;
          }
        }
      }

      // Physics integration & collision resolution
      const blockUnder = getBlock(Math.floor(playerPos.x), Math.floor(playerPos.y + 0.2), Math.floor(playerPos.z));
      const isInWater = blockUnder === BlockType.WATER;

      const { onGround, fellDistance } = PhysicsEngine.moveWithCollision(
        playerPos,
        playerVel,
        dt,
        isSneaking,
        isFlying,
        isInWater,
        getBlock
      );

      // Jump from ground
      if (!isFlying && onGround && wantJump) {
        playerVel.y = PhysicsEngine.JUMP_SPEED;
        soundEngine.playStep('stone');
      }

      // Fall damage in Survival
      if (stateRef.current.worldData.metadata.gameMode === 'survival' && fellDistance > 3.5) {
        const damage = Math.floor(fellDistance - 3);
        if (damage > 0) {
          onUpdatePlayer(prev => {
            const nextHp = Math.max(0, prev.health - damage);
            if (nextHp === 0) onDeath();
            return { ...prev, health: nextHp };
          });
          soundEngine.playHurt();
        }
      }

      // Void death at y < -20
      if (playerPos.y < -20) {
        onUpdatePlayer(prev => ({ ...prev, health: 0 }));
        onDeath();
      }

      // Camera orientation & view bobbing
      camera.position.set(playerPos.x, playerPos.y + (isSneaking ? 1.4 : 1.62), playerPos.z);
      camera.rotation.set(stateRef.current.pitch, stateRef.current.yaw, 0);

      // Hand swing animation
      if (stateRef.current.handSwing > 0) {
        stateRef.current.handSwing = Math.max(0, stateRef.current.handSwing - dt * 4.5);
        const swingArc = Math.sin(stateRef.current.handSwing * Math.PI);
        handMesh.rotation.x = -0.2 - swingArc * 0.8;
        handMesh.rotation.y = 0.1 - swingArc * 0.3;
        handMesh.position.z = -0.5 + swingArc * 0.15;
      }

      // Raycasting for target block in crosshair
      const rayDir = new THREE.Vector3();
      camera.getWorldDirection(rayDir);
      const hit = PhysicsEngine.raycastBlock(camera.position, rayDir, 5.5, getBlock);

      if (hit.hit) {
        stateRef.current.targetBlock = {
          pos: hit.blockPos,
          normal: hit.faceNormal,
          type: hit.blockType,
        };
        wireframe.visible = true;
        wireframe.position.set(hit.blockPos[0] + 0.5, hit.blockPos[1] + 0.5, hit.blockPos[2] + 0.5);

        // Mining block on mouse down or mobile mine button
        const isMining = stateRef.current.mouseButtons[0] || !!mobileMinePressed;
        if (isMining) {
          const bDef = getBlockDef(hit.blockType);
          const hardness = bDef.hardness;

          if (hardness >= 0) { // Not bedrock
            stateRef.current.handSwing = 1.0;
            const curSlot = stateRef.current.playerState.selectedSlot;
            const held = stateRef.current.playerState.inventory[curSlot];

            // Speed multiplier based on appropriate tool
            let speed = 1.0;
            if (stateRef.current.worldData.metadata.gameMode === 'creative') {
              speed = 999; // Instant breaking in Creative
            } else if (held && held.toolType === bDef.tool) {
              speed = held.toolMaterial === 'diamond' ? 8.0 : held.toolMaterial === 'iron' ? 5.0 : held.toolMaterial === 'stone' ? 3.0 : 2.0;
            }

            stateRef.current.miningTimer += dt * speed;

            // Spawn digging particles & crunch sound
            if (Math.random() < dt * 8) {
              soundEngine.playStep('stone');
              particleSystem.spawnBlockBreak(hit.blockPos[0], hit.blockPos[1], hit.blockPos[2], 0x888888);
            }

            if (stateRef.current.miningTimer >= hardness) {
              // BLOCK BROKEN!
              const brokenType = hit.blockType;
              setBlock(hit.blockPos[0], hit.blockPos[1], hit.blockPos[2], BlockType.AIR);
              soundEngine.playBlockBreak();
              particleSystem.spawnBlockBreak(hit.blockPos[0], hit.blockPos[1], hit.blockPos[2], 0x88aa44);

              // TreeCapitator hook
              modLoader.onBlockBreakHook(
                hit.blockPos[0], hit.blockPos[1], hit.blockPos[2],
                brokenType,
                (bx, by, bz) => {
                  setBlock(bx, by, bz, BlockType.AIR);
                  particleSystem.spawnBlockBreak(bx, by, bz, 0x6e4a2c);
                },
                getBlock
              );

              // Drop item into inventory in Survival mode
              if (stateRef.current.worldData.metadata.gameMode === 'survival' && bDef.dropsItem) {
                const dropId = bDef.dropsItem;
                const dropAmt = bDef.dropCount || 1;
                onUpdatePlayer(prev => {
                  const inv = [...prev.inventory];
                  // Try stack first
                  let remaining = dropAmt;
                  for (let i = 0; i < 36; i++) {
                    if (inv[i]?.id === dropId && inv[i]!.count < inv[i]!.maxStack) {
                      inv[i]!.count += remaining;
                      remaining = 0;
                      break;
                    }
                  }
                  // Put in empty slot
                  if (remaining > 0) {
                    for (let i = 0; i < 36; i++) {
                      if (!inv[i]) {
                        inv[i] = { id: dropId, count: remaining, maxStack: 64, name: dropId.replace(/^(block|item):/, '') };
                        break;
                      }
                    }
                  }
                  soundEngine.playItemPickup();
                  return { ...prev, inventory: inv };
                });
              }

              stateRef.current.miningTimer = 0;
            }
          }
        } else {
          stateRef.current.miningTimer = 0;
        }
      } else {
        stateRef.current.targetBlock = null;
        wireframe.visible = false;
        stateRef.current.miningTimer = 0;
      }

      // Update active chunks around player (dynamic loading & unloading)
      const playerChunkX = Math.floor(playerPos.x / Chunk.SIZE_X);
      const playerChunkZ = Math.floor(playerPos.z / Chunk.SIZE_Z);
      const radius = settings.renderDistance || 3;

      for (let dx = -radius; dx <= radius; dx++) {
        for (let dz = -radius; dz <= radius; dz++) {
          const cx = playerChunkX + dx;
          const cz = playerChunkZ + dz;
          const key = `${cx},${cz}`;
          let chunk = chunks.get(key);
          if (!chunk) {
            const raw = worldGen.generateChunkData(cx, cz);
            chunk = new Chunk(cx, cz, raw);
            chunks.set(key, chunk);
          }
          if (chunk.isDirty) {
            chunk.buildMesh(getBlock, opaqueMaterial, waterMaterial);
            if (chunk.mesh && !chunk.mesh.parent) scene.add(chunk.mesh);
            if (chunk.waterMesh && !chunk.waterMesh.parent) scene.add(chunk.waterMesh);
          }
        }
      }

      // Update Mobs AI & animations
      mobManager.update(
        dt,
        playerPos,
        dmg => {
          onUpdatePlayer(prev => {
            const nextHp = Math.max(0, prev.health - dmg);
            if (nextHp === 0) onDeath();
            return { ...prev, health: nextHp };
          });
        },
        (_mob, drops) => {
          // Loot pickup
          onUpdatePlayer(prev => {
            const inv = [...prev.inventory];
            for (const drop of drops) {
              for (let i = 0; i < 36; i++) {
                if (!inv[i]) {
                  inv[i] = drop;
                  break;
                }
              }
            }
            soundEngine.playItemPickup();
            return { ...prev, inventory: inv };
          });
        },
        (ex, ey, ez, radius) => {
          // Explosion crater & knockback
          soundEngine.playExplosion();
          particleSystem.spawnExplosion(ex, ey, ez);

          const rInt = Math.floor(radius);
          for (let bx = -rInt; bx <= rInt; bx++) {
            for (let by = -rInt; by <= rInt; by++) {
              for (let bz = -rInt; bz <= rInt; bz++) {
                if (Math.hypot(bx, by, bz) <= radius) {
                  const wx = Math.floor(ex + bx);
                  const wy = Math.floor(ey + by);
                  const wz = Math.floor(ez + bz);
                  const blk = getBlock(wx, wy, wz);
                  if (blk !== BlockType.BEDROCK && blk !== BlockType.AIR) {
                    setBlock(wx, wy, wz, BlockType.AIR);
                  }
                }
              }
            }
          }

          // Damage player if near explosion
          const pDist = playerPos.distanceTo(new THREE.Vector3(ex, ey, ez));
          if (pDist < radius + 2) {
            const dmg = Math.floor((1 - pDist / (radius + 2)) * 14);
            onUpdatePlayer(prev => {
              const next = Math.max(0, prev.health - dmg);
              if (next === 0) onDeath();
              return { ...prev, health: next };
            });
            soundEngine.playHurt();
          }
        }
      );

      // Update particle effects
      particleSystem.setWeather(worldData.weather || 'clear');
      particleSystem.update(dt, playerPos);

      // Render Scene
      renderer.render(scene, camera);

      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);

    // Window resize handler
    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      renderer.domElement.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('pointerlockchange', onPointerLockChange);
      window.removeEventListener('resize', onResize);

      chunks.forEach(c => c.dispose());
      mobManager.clearAll();
      particleSystem.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="w-full h-full absolute inset-0 select-none overflow-hidden"
      style={{ touchAction: 'none' }}
    />
  );
};
