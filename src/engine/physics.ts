/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { BlockType } from '../types/game';
import { isBlockSolid } from './blocks';

export interface AABB {
  minX: number;
  minY: number;
  minZ: number;
  maxX: number;
  maxY: number;
  maxZ: number;
}

export interface RaycastResult {
  hit: boolean;
  blockPos: [number, number, number];
  faceNormal: [number, number, number];
  distance: number;
  blockType: BlockType;
}

export class PhysicsEngine {
  public static GRAVITY = 28.0;
  public static JUMP_SPEED = 8.5;
  public static SWIM_GRAVITY = 6.0;
  public static SWIM_SPEED = 3.5;

  // Axis-Aligned Bounding Box collision test and resolution
  public static moveWithCollision(
    pos: THREE.Vector3,
    vel: THREE.Vector3,
    dt: number,
    isSneaking: boolean,
    isFlying: boolean,
    isInWater: boolean,
    getBlock: (wx: number, wy: number, wz: number) => BlockType
  ): { onGround: boolean; fellDistance: number } {
    let onGround = false;
    let fellDistance = 0;

    const playerWidth = 0.6;
    const playerHeight = isSneaking ? 1.5 : 1.8;
    const halfW = playerWidth / 2;

    // Apply gravity if not flying
    if (!isFlying) {
      if (isInWater) {
        vel.y -= PhysicsEngine.SWIM_GRAVITY * dt;
        vel.y = Math.max(vel.y, -3.0);
      } else {
        vel.y -= PhysicsEngine.GRAVITY * dt;
        vel.y = Math.max(vel.y, -40.0);
      }
    }

    let dx = vel.x * dt;
    let dy = vel.y * dt;
    let dz = vel.z * dt;

    // Sneak edge clamping (prevents walking off edges if sneaking and on ground)
    if (isSneaking && vel.y === 0 && !isFlying) {
      const step = 0.05;
      while (dx !== 0 && !this.hasBlockBelow(pos.x + dx, pos.y, pos.z, playerWidth, getBlock)) {
        if (Math.abs(dx) <= step) { dx = 0; break; }
        dx -= Math.sign(dx) * step;
      }
      while (dz !== 0 && !this.hasBlockBelow(pos.x, pos.y, pos.z + dz, playerWidth, getBlock)) {
        if (Math.abs(dz) <= step) { dz = 0; break; }
        dz -= Math.sign(dz) * step;
      }
    }

    // Step-by-step axis resolution (Y first, then X, then Z)
    // 1. Resolve Y axis
    const oldY = pos.y;
    pos.y += dy;
    const boxY: AABB = {
      minX: pos.x - halfW,
      maxX: pos.x + halfW,
      minY: pos.y,
      maxY: pos.y + playerHeight,
      minZ: pos.z - halfW,
      maxZ: pos.z + halfW,
    };

    const collY = this.getIntersectingBlocks(boxY, getBlock);
    for (const b of collY) {
      if (dy < 0) { // Falling onto ground
        pos.y = b.maxY;
        vel.y = 0;
        onGround = true;
        fellDistance = Math.max(0, oldY - pos.y);
      } else if (dy > 0) { // Hitting ceiling
        pos.y = b.minY - playerHeight;
        vel.y = 0;
      }
      break;
    }

    // 2. Resolve X axis
    pos.x += dx;
    const boxX: AABB = {
      minX: pos.x - halfW,
      maxX: pos.x + halfW,
      minY: pos.y,
      maxY: pos.y + playerHeight,
      minZ: pos.z - halfW,
      maxZ: pos.z + halfW,
    };
    const collX = this.getIntersectingBlocks(boxX, getBlock);
    for (const b of collX) {
      if (dx > 0) {
        pos.x = b.minX - halfW;
        vel.x = 0;
      } else if (dx < 0) {
        pos.x = b.maxX + halfW;
        vel.x = 0;
      }
      break;
    }

    // 3. Resolve Z axis
    pos.z += dz;
    const boxZ: AABB = {
      minX: pos.x - halfW,
      maxX: pos.x + halfW,
      minY: pos.y,
      maxY: pos.y + playerHeight,
      minZ: pos.z - halfW,
      maxZ: pos.z + halfW,
    };
    const collZ = this.getIntersectingBlocks(boxZ, getBlock);
    for (const b of collZ) {
      if (dz > 0) {
        pos.z = b.minZ - halfW;
        vel.z = 0;
      } else if (dz < 0) {
        pos.z = b.maxZ + halfW;
        vel.z = 0;
      }
      break;
    }

    // Apply ground/air friction
    const friction = isFlying ? 0.8 : onGround ? 0.7 : 0.95;
    vel.x *= Math.pow(friction, dt * 60);
    vel.z *= Math.pow(friction, dt * 60);
    if (isFlying) {
      vel.y *= Math.pow(friction, dt * 60);
    }

    return { onGround, fellDistance };
  }

  private static hasBlockBelow(
    px: number,
    py: number,
    pz: number,
    width: number,
    getBlock: (wx: number, wy: number, wz: number) => BlockType
  ): boolean {
    const hw = width / 2;
    const checkY = Math.floor(py - 0.1);
    for (const cx of [px - hw + 0.05, px + hw - 0.05]) {
      for (const cz of [pz - hw + 0.05, pz + hw - 0.05]) {
        const b = getBlock(Math.floor(cx), checkY, Math.floor(cz));
        if (isBlockSolid(b)) return true;
      }
    }
    return false;
  }

  private static getIntersectingBlocks(
    box: AABB,
    getBlock: (wx: number, wy: number, wz: number) => BlockType
  ): AABB[] {
    const hits: AABB[] = [];
    const minBx = Math.floor(box.minX);
    const maxBx = Math.floor(box.maxX);
    const minBy = Math.floor(box.minY);
    const maxBy = Math.floor(box.maxY);
    const minBz = Math.floor(box.minZ);
    const maxBz = Math.floor(box.maxZ);

    for (let x = minBx; x <= maxBx; x++) {
      for (let y = minBy; y <= maxBy; y++) {
        for (let z = minBz; z <= maxBz; z++) {
          const block = getBlock(x, y, z);
          if (isBlockSolid(block)) {
            // Check bounding box intersection
            const bMinX = x, bMaxX = x + 1;
            const bMinY = y, bMaxY = y + 1;
            const bMinZ = z, bMaxZ = z + 1;

            if (
              box.minX < bMaxX && box.maxX > bMinX &&
              box.minY < bMaxY && box.maxY > bMinY &&
              box.minZ < bMaxZ && box.maxZ > bMinZ
            ) {
              hits.push({
                minX: bMinX, maxX: bMaxX,
                minY: bMinY, maxY: bMaxY,
                minZ: bMinZ, maxZ: bMaxZ,
              });
            }
          }
        }
      }
    }
    return hits;
  }

  // Fast Voxel Traversal algorithm (Amanatides & Woo DDA)
  public static raycastBlock(
    origin: THREE.Vector3,
    direction: THREE.Vector3,
    maxDistance: number,
    getBlock: (wx: number, wy: number, wz: number) => BlockType
  ): RaycastResult {
    let x = Math.floor(origin.x);
    let y = Math.floor(origin.y);
    let z = Math.floor(origin.z);

    const dx = direction.x;
    const dy = direction.y;
    const dz = direction.z;

    const stepX = Math.sign(dx);
    const stepY = Math.sign(dy);
    const stepZ = Math.sign(dz);

    const tDeltaX = Math.abs(1 / dx);
    const tDeltaY = Math.abs(1 / dy);
    const tDeltaZ = Math.abs(1 / dz);

    let tMaxX = stepX > 0 ? (Math.floor(origin.x) + 1 - origin.x) * tDeltaX : (origin.x - Math.floor(origin.x)) * tDeltaX;
    let tMaxY = stepY > 0 ? (Math.floor(origin.y) + 1 - origin.y) * tDeltaY : (origin.y - Math.floor(origin.y)) * tDeltaY;
    let tMaxZ = stepZ > 0 ? (Math.floor(origin.z) + 1 - origin.z) * tDeltaZ : (origin.z - Math.floor(origin.z)) * tDeltaZ;

    let dist = 0;
    let normal: [number, number, number] = [0, 0, 0];

    while (dist <= maxDistance) {
      const block = getBlock(x, y, z);
      if (block !== BlockType.AIR && block !== BlockType.WATER) {
        return {
          hit: true,
          blockPos: [x, y, z],
          faceNormal: normal,
          distance: dist,
          blockType: block,
        };
      }

      if (tMaxX < tMaxY) {
        if (tMaxX < tMaxZ) {
          x += stepX;
          dist = tMaxX;
          tMaxX += tDeltaX;
          normal = [-stepX, 0, 0];
        } else {
          z += stepZ;
          dist = tMaxZ;
          tMaxZ += tDeltaZ;
          normal = [0, 0, -stepZ];
        }
      } else {
        if (tMaxY < tMaxZ) {
          y += stepY;
          dist = tMaxY;
          tMaxY += tDeltaY;
          normal = [0, -stepY, 0];
        } else {
          z += stepZ;
          dist = tMaxZ;
          tMaxZ += tDeltaZ;
          normal = [0, 0, -stepZ];
        }
      }
    }

    return {
      hit: false,
      blockPos: [0, 0, 0],
      faceNormal: [0, 0, 0],
      distance: maxDistance,
      blockType: BlockType.AIR,
    };
  }
}
