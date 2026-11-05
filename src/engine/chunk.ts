/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { BlockType } from '../types/game';
import { getBlockDef, isBlockTransparent } from './blocks';
import { TextureManager } from './textures';
import { WorldGenerator } from './worldgen';

export interface ChunkKey {
  cx: number;
  cz: number;
}

export class Chunk {
  public cx: number;
  public cz: number;
  public data: Uint8Array;
  public mesh: THREE.Mesh | null = null;
  public waterMesh: THREE.Mesh | null = null;
  public isDirty: boolean = true;

  public static SIZE_X = WorldGenerator.CHUNK_SIZE_X;
  public static SIZE_Z = WorldGenerator.CHUNK_SIZE_Z;
  public static SIZE_Y = WorldGenerator.CHUNK_HEIGHT;

  constructor(cx: number, cz: number, rawData?: Uint8Array) {
    this.cx = cx;
    this.cz = cz;
    this.data = rawData || new Uint8Array(Chunk.SIZE_X * Chunk.SIZE_Y * Chunk.SIZE_Z);
  }

  public getIndex(lx: number, ly: number, lz: number): number {
    return (ly * Chunk.SIZE_Z + lz) * Chunk.SIZE_X + lx;
  }

  public getBlock(lx: number, ly: number, lz: number): BlockType {
    if (
      lx < 0 || lx >= Chunk.SIZE_X ||
      ly < 0 || ly >= Chunk.SIZE_Y ||
      lz < 0 || lz >= Chunk.SIZE_Z
    ) {
      return BlockType.AIR;
    }
    return this.data[this.getIndex(lx, ly, lz)] as BlockType;
  }

  public setBlock(lx: number, ly: number, lz: number, block: BlockType) {
    if (
      lx < 0 || lx >= Chunk.SIZE_X ||
      ly < 0 || ly >= Chunk.SIZE_Y ||
      lz < 0 || lz >= Chunk.SIZE_Z
    ) {
      return;
    }
    this.data[this.getIndex(lx, ly, lz)] = block;
    this.isDirty = true;
  }

  // Build optimized BufferGeometry with face culling
  public buildMesh(
    getNeighborBlock: (wx: number, wy: number, wz: number) => BlockType,
    opaqueMaterial: THREE.Material,
    waterMaterial: THREE.Material
  ) {
    const texManager = TextureManager.getInstance();

    // Arrays for opaque blocks
    const positions: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    const colors: number[] = [];

    // Arrays for water/transparent
    const wPositions: number[] = [];
    const wNormals: number[] = [];
    const wUvs: number[] = [];
    const wColors: number[] = [];

    const startX = this.cx * Chunk.SIZE_X;
    const startZ = this.cz * Chunk.SIZE_Z;

    // Face normal offsets: [+X, -X, +Y, -Y, +Z, -Z]
    const faces = [
      { dir: [1, 0, 0], norm: [1, 0, 0], side: 'east', light: 0.85 },
      { dir: [-1, 0, 0], norm: [-1, 0, 0], side: 'west', light: 0.85 },
      { dir: [0, 1, 0], norm: [0, 1, 0], side: 'top', light: 1.0 },
      { dir: [0, -1, 0], norm: [0, -1, 0], side: 'bottom', light: 0.55 },
      { dir: [0, 0, 1], norm: [0, 0, 1], side: 'south', light: 0.75 },
      { dir: [0, 0, -1], norm: [0, 0, -1], side: 'north', light: 0.75 },
    ];

    for (let lx = 0; lx < Chunk.SIZE_X; lx++) {
      for (let lz = 0; lz < Chunk.SIZE_Z; lz++) {
        for (let ly = 0; ly < Chunk.SIZE_Y; ly++) {
          const block = this.getBlock(lx, ly, lz);
          if (block === BlockType.AIR) continue;

          const def = getBlockDef(block);
          const isWater = block === BlockType.WATER;
          const wx = startX + lx;
          const wy = ly;
          const wz = startZ + lz;

          // Special case for cross-model blocks (Rose, Dandelion)
          if (block === BlockType.ROSE || block === BlockType.DANDELION) {
            const uvCoords = texManager.getTileUV(def.textureIndices.top);
            this.addCrossGeometry(positions, normals, uvs, colors, wx, wy, wz, uvCoords);
            continue;
          }

          // Special case for Torch (smaller 3D stick model)
          if (block === BlockType.TORCH) {
            const uvCoords = texManager.getTileUV(def.textureIndices.top);
            this.addTorchGeometry(positions, normals, uvs, colors, wx, wy, wz, uvCoords);
            continue;
          }

          for (const face of faces) {
            const nx = lx + face.dir[0];
            const ny = ly + face.dir[1];
            const nz = lz + face.dir[2];

            let neighborBlock: BlockType;
            if (
              nx >= 0 && nx < Chunk.SIZE_X &&
              ny >= 0 && ny < Chunk.SIZE_Y &&
              nz >= 0 && nz < Chunk.SIZE_Z
            ) {
              neighborBlock = this.getBlock(nx, ny, nz);
            } else {
              neighborBlock = getNeighborBlock(wx + face.dir[0], wy + face.dir[1], wz + face.dir[2]);
            }

            // Face culling rule:
            // Draw face if neighbor is air, or transparent (and not the same transparent block)
            let shouldDraw = false;
            if (isWater) {
              shouldDraw = neighborBlock === BlockType.AIR;
            } else if (def.isTransparent) {
              shouldDraw = neighborBlock === BlockType.AIR || (!isBlockTransparent(neighborBlock) ? false : neighborBlock !== block);
            } else {
              shouldDraw = isBlockTransparent(neighborBlock);
            }

            if (!shouldDraw) continue;

            // Pick texture index for face
            let tileIndex = def.textureIndices.sides;
            if (face.side === 'top') tileIndex = def.textureIndices.top;
            else if (face.side === 'bottom') tileIndex = def.textureIndices.bottom;
            else if (face.side === 'north' && def.textureIndices.front !== undefined) {
              tileIndex = def.textureIndices.front;
            }

            const [uMin, vMin, uMax, vMax] = texManager.getTileUV(tileIndex);
            const targetPos = isWater ? wPositions : positions;
            const targetNorm = isWater ? wNormals : normals;
            const targetUvs = isWater ? wUvs : uvs;
            const targetCols = isWater ? wColors : colors;

            this.addQuad(
              targetPos,
              targetNorm,
              targetUvs,
              targetCols,
              wx, wy, wz,
              face.dir,
              face.norm,
              uMin, vMin, uMax, vMax,
              face.light
            );
          }
        }
      }
    }

    // Update Opaque Mesh
    if (positions.length > 0) {
      if (!this.mesh) {
        const geom = new THREE.BufferGeometry();
        this.mesh = new THREE.Mesh(geom, opaqueMaterial);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
      }
      const geom = this.mesh.geometry;
      geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geom.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
      geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
      geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
      geom.computeBoundingSphere();
    } else if (this.mesh) {
      this.mesh.geometry.dispose();
      this.mesh = null;
    }

    // Update Water Mesh
    if (wPositions.length > 0) {
      if (!this.waterMesh) {
        const wGeom = new THREE.BufferGeometry();
        this.waterMesh = new THREE.Mesh(wGeom, waterMaterial);
      }
      const wGeom = this.waterMesh.geometry;
      wGeom.setAttribute('position', new THREE.Float32BufferAttribute(wPositions, 3));
      wGeom.setAttribute('normal', new THREE.Float32BufferAttribute(wNormals, 3));
      wGeom.setAttribute('uv', new THREE.Float32BufferAttribute(wUvs, 2));
      wGeom.setAttribute('color', new THREE.Float32BufferAttribute(wColors, 3));
      wGeom.computeBoundingSphere();
    } else if (this.waterMesh) {
      this.waterMesh.geometry.dispose();
      this.waterMesh = null;
    }

    this.isDirty = false;
  }

  private addQuad(
    pos: number[],
    norm: number[],
    uvs: number[],
    cols: number[],
    x: number, y: number, z: number,
    dir: number[],
    normal: number[],
    uMin: number, vMin: number, uMax: number, vMax: number,
    light: number
  ) {
    let p1: [number, number, number],
        p2: [number, number, number],
        p3: [number, number, number],
        p4: [number, number, number];

    if (dir[0] === 1) { // East (+X)
      p1 = [x + 1, y, z];
      p2 = [x + 1, y, z + 1];
      p3 = [x + 1, y + 1, z + 1];
      p4 = [x + 1, y + 1, z];
    } else if (dir[0] === -1) { // West (-X)
      p1 = [x, y, z + 1];
      p2 = [x, y, z];
      p3 = [x, y + 1, z];
      p4 = [x, y + 1, z + 1];
    } else if (dir[1] === 1) { // Top (+Y)
      p1 = [x, y + 1, z + 1];
      p2 = [x + 1, y + 1, z + 1];
      p3 = [x + 1, y + 1, z];
      p4 = [x, y + 1, z];
    } else if (dir[1] === -1) { // Bottom (-Y)
      p1 = [x, y, z];
      p2 = [x + 1, y, z];
      p3 = [x + 1, y, z + 1];
      p4 = [x, y, z + 1];
    } else if (dir[2] === 1) { // South (+Z)
      p1 = [x + 1, y, z + 1];
      p2 = [x, y, z + 1];
      p3 = [x, y + 1, z + 1];
      p4 = [x + 1, y + 1, z + 1];
    } else { // North (-Z)
      p1 = [x, y, z];
      p2 = [x + 1, y, z];
      p3 = [x + 1, y + 1, z];
      p4 = [x, y + 1, z];
    }

    // Tri 1 (p1, p2, p3)
    pos.push(...p1, ...p2, ...p3);
    norm.push(...normal, ...normal, ...normal);
    uvs.push(uMin, vMin, uMax, vMin, uMax, vMax);
    cols.push(light, light, light, light, light, light, light, light, light);

    // Tri 2 (p1, p3, p4)
    pos.push(...p1, ...p3, ...p4);
    norm.push(...normal, ...normal, ...normal);
    uvs.push(uMin, vMin, uMax, vMax, uMin, vMax);
    cols.push(light, light, light, light, light, light, light, light, light);
  }

  // Cross quad geometry for flowers / plants
  private addCrossGeometry(
    pos: number[],
    norm: number[],
    uvs: number[],
    cols: number[],
    x: number, y: number, z: number,
    [uMin, vMin, uMax, vMax]: [number, number, number, number]
  ) {
    const l = 0.9;
    // Diagonal 1
    pos.push(
      x, y, z, x + 1, y, z + 1, x + 1, y + 1, z + 1,
      x, y, z, x + 1, y + 1, z + 1, x, y + 1, z
    );
    norm.push(0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0);
    uvs.push(uMin, vMin, uMax, vMin, uMax, vMax, uMin, vMin, uMax, vMax, uMin, vMax);
    for (let i = 0; i < 6; i++) cols.push(l, l, l);

    // Diagonal 2
    pos.push(
      x + 1, y, z, x, y, z + 1, x, y + 1, z + 1,
      x + 1, y, z, x, y + 1, z + 1, x + 1, y + 1, z
    );
    norm.push(0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0);
    uvs.push(uMin, vMin, uMax, vMin, uMax, vMax, uMin, vMin, uMax, vMax, uMin, vMax);
    for (let i = 0; i < 6; i++) cols.push(l, l, l);
  }

  // Torch geometry (centered 2x2 pixel stick)
  private addTorchGeometry(
    pos: number[],
    norm: number[],
    uvs: number[],
    cols: number[],
    x: number, y: number, z: number,
    [uMin, vMin, uMax, vMax]: [number, number, number, number]
  ) {
    const minX = x + 0.4, maxX = x + 0.6;
    const minZ = z + 0.4, maxZ = z + 0.6;
    const minY = y, maxY = y + 0.7;

    // Simplified box for torch
    pos.push(
      minX, minY, maxZ, maxX, minY, maxZ, maxX, maxY, maxZ,
      minX, minY, maxZ, maxX, maxY, maxZ, minX, maxY, maxZ
    );
    norm.push(0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1);
    uvs.push(uMin, vMin, uMax, vMin, uMax, vMax, uMin, vMin, uMax, vMax, uMin, vMax);
    for (let i = 0; i < 6; i++) cols.push(1, 1, 1);
  }

  public dispose() {
    if (this.mesh) {
      this.mesh.geometry.dispose();
      this.mesh = null;
    }
    if (this.waterMesh) {
      this.waterMesh.geometry.dispose();
      this.waterMesh = null;
    }
  }
}
