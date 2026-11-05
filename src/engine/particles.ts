/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';

interface Particle {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  color: THREE.Color;
  size: number;
  life: number;
  maxLife: number;
}

export class ParticleSystem {
  private particles: Particle[] = [];
  private rainCount = 600;
  private rainGeom: THREE.BufferGeometry;
  private rainPoints: THREE.Points | null = null;
  private rainPosArray: Float32Array;
  private scene: THREE.Scene;

  // Instanced points for particles
  private pGeom: THREE.BufferGeometry;
  private pPoints: THREE.Points;
  private pPositions: Float32Array;
  private pColors: Float32Array;
  private maxParticles = 500;

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    // Standard particles (bursts, explosions, crits)
    this.pGeom = new THREE.BufferGeometry();
    this.pPositions = new Float32Array(this.maxParticles * 3);
    this.pColors = new Float32Array(this.maxParticles * 3);
    this.pGeom.setAttribute('position', new THREE.BufferAttribute(this.pPositions, 3));
    this.pGeom.setAttribute('color', new THREE.BufferAttribute(this.pColors, 3));

    const pMat = new THREE.PointsMaterial({
      size: 0.12,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
    });
    this.pPoints = new THREE.Points(this.pGeom, pMat);
    this.pPoints.frustumCulled = false;
    this.scene.add(this.pPoints);

    // Weather Rain
    this.rainGeom = new THREE.BufferGeometry();
    this.rainPosArray = new Float32Array(this.rainCount * 3);
    for (let i = 0; i < this.rainCount; i++) {
      this.rainPosArray[i * 3 + 0] = (Math.random() - 0.5) * 40;
      this.rainPosArray[i * 3 + 1] = Math.random() * 25;
      this.rainPosArray[i * 3 + 2] = (Math.random() - 0.5) * 40;
    }
    this.rainGeom.setAttribute('position', new THREE.BufferAttribute(this.rainPosArray, 3));
    const rainMat = new THREE.PointsMaterial({
      color: 0x88ccff,
      size: 0.08,
      transparent: true,
      opacity: 0.6,
    });
    this.rainPoints = new THREE.Points(this.rainGeom, rainMat);
    this.rainPoints.visible = false;
    this.scene.add(this.rainPoints);
  }

  public spawnBlockBreak(x: number, y: number, z: number, colorHex: number) {
    const col = new THREE.Color(colorHex);
    for (let i = 0; i < 18; i++) {
      if (this.particles.length >= this.maxParticles) break;
      this.particles.push({
        pos: new THREE.Vector3(x + 0.5 + (Math.random() - 0.5) * 0.4, y + 0.5 + (Math.random() - 0.5) * 0.4, z + 0.5 + (Math.random() - 0.5) * 0.4),
        vel: new THREE.Vector3((Math.random() - 0.5) * 3, Math.random() * 3 + 1, (Math.random() - 0.5) * 3),
        color: col.clone().offsetHSL(0, 0, (Math.random() - 0.5) * 0.1),
        size: 0.1,
        life: 0.45 + Math.random() * 0.2,
        maxLife: 0.65,
      });
    }
  }

  public spawnExplosion(x: number, y: number, z: number) {
    for (let i = 0; i < 60; i++) {
      if (this.particles.length >= this.maxParticles) break;
      const isFire = Math.random() > 0.4;
      this.particles.push({
        pos: new THREE.Vector3(x, y, z),
        vel: new THREE.Vector3((Math.random() - 0.5) * 10, Math.random() * 8 + 2, (Math.random() - 0.5) * 10),
        color: isFire ? new THREE.Color(0xff4500) : new THREE.Color(0x555555),
        size: 0.2,
        life: 0.6 + Math.random() * 0.4,
        maxLife: 1.0,
      });
    }
  }

  public setWeather(weather: 'clear' | 'rain' | 'thunder') {
    if (this.rainPoints) {
      this.rainPoints.visible = weather === 'rain' || weather === 'thunder';
    }
  }

  public update(dt: number, playerPos: THREE.Vector3) {
    // Update general particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      p.vel.y -= 15 * dt; // gravity
      p.pos.addScaledVector(p.vel, dt);
    }

    // Write to buffer
    for (let i = 0; i < this.maxParticles; i++) {
      if (i < this.particles.length) {
        const p = this.particles[i];
        this.pPositions[i * 3 + 0] = p.pos.x;
        this.pPositions[i * 3 + 1] = p.pos.y;
        this.pPositions[i * 3 + 2] = p.pos.z;

        this.pColors[i * 3 + 0] = p.color.r;
        this.pColors[i * 3 + 1] = p.color.g;
        this.pColors[i * 3 + 2] = p.color.b;
      } else {
        this.pPositions[i * 3 + 0] = 0;
        this.pPositions[i * 3 + 1] = -999;
        this.pPositions[i * 3 + 2] = 0;
      }
    }
    this.pGeom.attributes.position.needsUpdate = true;
    this.pGeom.attributes.color.needsUpdate = true;

    // Update rain cylinder around player
    if (this.rainPoints && this.rainPoints.visible) {
      const posAttr = this.rainGeom.attributes.position;
      const arr = posAttr.array as Float32Array;
      const fallSpeed = 35 * dt;

      for (let i = 0; i < this.rainCount; i++) {
        let rx = arr[i * 3 + 0];
        let ry = arr[i * 3 + 1] - fallSpeed;
        let rz = arr[i * 3 + 2];

        // Wrap around player box
        if (ry < playerPos.y - 4) {
          ry = playerPos.y + 16 + Math.random() * 4;
          rx = playerPos.x + (Math.random() - 0.5) * 32;
          rz = playerPos.z + (Math.random() - 0.5) * 32;
        }

        arr[i * 3 + 0] = rx;
        arr[i * 3 + 1] = ry;
        arr[i * 3 + 2] = rz;
      }
      posAttr.needsUpdate = true;
    }
  }

  public dispose() {
    this.scene.remove(this.pPoints);
    this.pGeom.dispose();
    if (this.rainPoints) {
      this.scene.remove(this.rainPoints);
      this.rainGeom.dispose();
    }
  }
}
