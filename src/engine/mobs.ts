/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { MobEntity, MobType, ItemStack } from '../types/game';
import { createItemStack } from './items';
import { soundEngine } from './audio';

export interface MobDrop {
  item: ItemStack;
  chance: number;
}

export class MobManager {
  public mobs: Map<string, { entity: MobEntity; mesh: THREE.Group; parts: Record<string, THREE.Mesh> }> = new Map();
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  public spawnMob(type: MobType, pos: [number, number, number]): MobEntity {
    const isHostile = ['zombie', 'skeleton', 'creeper', 'spider', 'enderman'].includes(type);
    const maxHealth = type === 'enderman' ? 40 : type === 'spider' ? 16 : 20;

    const entity: MobEntity = {
      id: 'mob_' + Math.random().toString(36).substring(2, 9),
      type,
      isHostile,
      position: [...pos],
      velocity: [0, 0, 0],
      yaw: Math.random() * Math.PI * 2,
      pitch: 0,
      health: maxHealth,
      maxHealth,
      hurtTimer: 0,
      walkTimer: 0,
      attackCooldown: 0,
      targetPlayer: isHostile,
      exploding: false,
      explodeTimer: 0,
    };

    const { mesh, parts } = this.createMobMesh(type);
    mesh.position.set(pos[0], pos[1], pos[2]);
    this.scene.add(mesh);

    this.mobs.set(entity.id, { entity, mesh, parts });
    return entity;
  }

  private createMobMesh(type: MobType): { mesh: THREE.Group; parts: Record<string, THREE.Mesh> } {
    const group = new THREE.Group();
    const parts: Record<string, THREE.Mesh> = {};

    // Colors
    let bodyColor = 0x5b3e24;
    let headColor = 0x6e4a2c;
    let limbColor = 0x472f1b;

    if (type === 'zombie') {
      headColor = 0x228b22;
      bodyColor = 0x008080; // teal shirt
      limbColor = 0x191970; // blue pants
    } else if (type === 'skeleton') {
      headColor = 0xdcdcdc;
      bodyColor = 0xc0c0c0;
      limbColor = 0xb0b0b0;
    } else if (type === 'creeper') {
      headColor = 0x2e8b57;
      bodyColor = 0x2e8b57;
      limbColor = 0x1f663d;
    } else if (type === 'enderman') {
      headColor = 0x111111;
      bodyColor = 0x161616;
      limbColor = 0x0a0a0a;
    } else if (type === 'pig') {
      headColor = 0xf08080;
      bodyColor = 0xf08080;
      limbColor = 0xe07070;
    } else if (type === 'sheep') {
      headColor = 0xf5f5f5;
      bodyColor = 0xffffff;
      limbColor = 0xdddddd;
    } else if (type === 'chicken') {
      headColor = 0xffffff;
      bodyColor = 0xffffff;
      limbColor = 0xffa500;
    }

    const mat = (col: number) => new THREE.MeshLambertMaterial({ color: col });

    if (type === 'creeper') {
      // Creeper: tall body + 4 stubby feet + cube head
      const headGeom = new THREE.BoxGeometry(0.5, 0.5, 0.5);
      const headMesh = new THREE.Mesh(headGeom, mat(headColor));
      headMesh.position.set(0, 1.45, 0);
      group.add(headMesh);
      parts.head = headMesh;

      const bodyGeom = new THREE.BoxGeometry(0.4, 0.7, 0.25);
      const bodyMesh = new THREE.Mesh(bodyGeom, mat(bodyColor));
      bodyMesh.position.set(0, 0.85, 0);
      group.add(bodyMesh);
      parts.body = bodyMesh;

      // 4 feet
      const footGeom = new THREE.BoxGeometry(0.2, 0.4, 0.2);
      const f1 = new THREE.Mesh(footGeom, mat(limbColor)); f1.position.set(-0.15, 0.2, 0.15);
      const f2 = new THREE.Mesh(footGeom, mat(limbColor)); f2.position.set(0.15, 0.2, 0.15);
      const f3 = new THREE.Mesh(footGeom, mat(limbColor)); f3.position.set(-0.15, 0.2, -0.15);
      const f4 = new THREE.Mesh(footGeom, mat(limbColor)); f4.position.set(0.15, 0.2, -0.15);
      group.add(f1, f2, f3, f4);
      parts.leg1 = f1; parts.leg2 = f2; parts.leg3 = f3; parts.leg4 = f4;
    } else if (['cow', 'pig', 'sheep'].includes(type)) {
      // Quadruped animal
      const headGeom = new THREE.BoxGeometry(0.45, 0.45, 0.45);
      const headMesh = new THREE.Mesh(headGeom, mat(headColor));
      headMesh.position.set(0, 0.9, 0.45);
      group.add(headMesh);
      parts.head = headMesh;

      const bodyGeom = new THREE.BoxGeometry(0.6, 0.55, 0.9);
      const bodyMesh = new THREE.Mesh(bodyGeom, mat(bodyColor));
      bodyMesh.position.set(0, 0.65, 0);
      group.add(bodyMesh);
      parts.body = bodyMesh;

      const legGeom = new THREE.BoxGeometry(0.2, 0.5, 0.2);
      const l1 = new THREE.Mesh(legGeom, mat(limbColor)); l1.position.set(-0.2, 0.25, 0.3);
      const l2 = new THREE.Mesh(legGeom, mat(limbColor)); l2.position.set(0.2, 0.25, 0.3);
      const l3 = new THREE.Mesh(legGeom, mat(limbColor)); l3.position.set(-0.2, 0.25, -0.3);
      const l4 = new THREE.Mesh(legGeom, mat(limbColor)); l4.position.set(0.2, 0.25, -0.3);
      group.add(l1, l2, l3, l4);
      parts.leg1 = l1; parts.leg2 = l2; parts.leg3 = l3; parts.leg4 = l4;
    } else {
      // Biped humanoid (Zombie, Skeleton, Enderman, Villager)
      const scaleY = type === 'enderman' ? 1.4 : 1.0;
      const headGeom = new THREE.BoxGeometry(0.45, 0.45, 0.45);
      const headMesh = new THREE.Mesh(headGeom, mat(headColor));
      headMesh.position.set(0, 1.6 * scaleY, 0);
      group.add(headMesh);
      parts.head = headMesh;

      const bodyGeom = new THREE.BoxGeometry(0.5, 0.7 * scaleY, 0.3);
      const bodyMesh = new THREE.Mesh(bodyGeom, mat(bodyColor));
      bodyMesh.position.set(0, 1.0 * scaleY, 0);
      group.add(bodyMesh);
      parts.body = bodyMesh;

      // Arms
      const armGeom = new THREE.BoxGeometry(0.18, 0.65 * scaleY, 0.18);
      const armL = new THREE.Mesh(armGeom, mat(headColor)); armL.position.set(-0.35, 1.0 * scaleY, 0);
      const armR = new THREE.Mesh(armGeom, mat(headColor)); armR.position.set(0.35, 1.0 * scaleY, 0);
      group.add(armL, armR);
      parts.armL = armL; parts.armR = armR;

      // Legs
      const legGeom = new THREE.BoxGeometry(0.2, 0.65 * scaleY, 0.2);
      const legL = new THREE.Mesh(legGeom, mat(limbColor)); legL.position.set(-0.15, 0.35 * scaleY, 0);
      const legR = new THREE.Mesh(legGeom, mat(limbColor)); legR.position.set(0.15, 0.35 * scaleY, 0);
      group.add(legL, legR);
      parts.leg1 = legL; parts.leg2 = legR;
    }

    return { mesh: group, parts };
  }

  // Update AI and animations for all active mobs
  public update(
    dt: number,
    playerPos: THREE.Vector3,
    onPlayerDamage: (dmg: number) => void,
    onMobDeath: (mob: MobEntity, drops: ItemStack[]) => void,
    onExplosion: (x: number, y: number, z: number, radius: number) => void
  ) {
    const toRemove: string[] = [];

    this.mobs.forEach(({ entity, mesh, parts }, id) => {
      // Hurt flash timer
      if (entity.hurtTimer > 0) {
        entity.hurtTimer -= dt;
        const isFlashing = Math.floor(entity.hurtTimer * 10) % 2 === 0;
        Object.values(parts).forEach(p => {
          (p.material as THREE.MeshLambertMaterial).color.setHex(isFlashing ? 0xff0000 : 0xffffff);
        });
      }

      // Check death
      if (entity.health <= 0) {
        toRemove.push(id);
        const drops = this.getMobDrops(entity.type);
        onMobDeath(entity, drops);
        return;
      }

      const dx = playerPos.x - entity.position[0];
      const dz = playerPos.z - entity.position[2];
      const dist = Math.hypot(dx, dz);

      // AI Behavior: Wander or Chase Player
      let moveSpeed = 1.6;
      if (entity.isHostile && dist < 16) {
        // Chase player
        entity.yaw = Math.atan2(dx, dz);
        moveSpeed = entity.type === 'enderman' ? 3.5 : 2.2;

        // Creeper countdown
        if (entity.type === 'creeper') {
          if (dist < 3.2) {
            if (!entity.exploding) {
              entity.exploding = true;
              entity.explodeTimer = 0;
              soundEngine.playCreeperHiss();
            }
            entity.explodeTimer = (entity.explodeTimer || 0) + dt;

            // Flash white during countdown
            const flash = Math.sin(entity.explodeTimer * 20) > 0;
            Object.values(parts).forEach(p => {
              (p.material as THREE.MeshLambertMaterial).color.setHex(flash ? 0xffffff : 0x2e8b57);
            });

            if (entity.explodeTimer >= 1.5) {
              // DETONATE!
              onExplosion(entity.position[0], entity.position[1], entity.position[2], 3.5);
              toRemove.push(id);
              return;
            }
          } else {
            entity.exploding = false;
            entity.explodeTimer = 0;
          }
        }

        // Melee attack
        if (dist < 1.4 && entity.attackCooldown <= 0 && entity.type !== 'creeper') {
          entity.attackCooldown = 1.0;
          const dmg = entity.type === 'zombie' ? 3 : entity.type === 'enderman' ? 6 : 2;
          onPlayerDamage(dmg);
          soundEngine.playHurt();
        }
      } else {
        // Random wandering
        if (Math.random() < 0.02) {
          entity.yaw += (Math.random() - 0.5) * 1.5;
        }
        moveSpeed = 0.8;
      }

      if (entity.attackCooldown > 0) {
        entity.attackCooldown -= dt;
      }

      // Move forward in yaw direction
      const vx = Math.sin(entity.yaw) * moveSpeed;
      const vz = Math.cos(entity.yaw) * moveSpeed;

      entity.position[0] += vx * dt;
      entity.position[2] += vz * dt;

      // Update mesh position and rotation
      mesh.position.set(entity.position[0], entity.position[1], entity.position[2]);
      mesh.rotation.y = entity.yaw;

      // Walk cycle animation
      entity.walkTimer += dt * moveSpeed * 5;
      const legAngle = Math.sin(entity.walkTimer) * 0.45;
      if (parts.leg1) parts.leg1.rotation.x = legAngle;
      if (parts.leg2) parts.leg2.rotation.x = -legAngle;
      if (parts.leg3) parts.leg3.rotation.x = -legAngle;
      if (parts.leg4) parts.leg4.rotation.x = legAngle;
      if (parts.armL) parts.armL.rotation.x = -legAngle;
      if (parts.armR) parts.armR.rotation.x = legAngle;
    });

    // Cleanup dead mobs
    for (const id of toRemove) {
      const mob = this.mobs.get(id);
      if (mob) {
        this.scene.remove(mob.mesh);
        this.mobs.delete(id);
      }
    }
  }

  public damageMob(mobId: string, amount: number, knockbackDir?: THREE.Vector3) {
    const mob = this.mobs.get(mobId);
    if (!mob) return;

    mob.entity.health -= amount;
    mob.entity.hurtTimer = 0.35;
    soundEngine.playHitImpact();

    if (knockbackDir) {
      mob.entity.position[0] += knockbackDir.x * 0.8;
      mob.entity.position[2] += knockbackDir.z * 0.8;
    }
  }

  public getMobDrops(type: MobType): ItemStack[] {
    const drops: ItemStack[] = [];
    switch (type) {
      case 'cow':
        drops.push(createItemStack('item:raw_beef', Math.floor(Math.random() * 2) + 1));
        drops.push(createItemStack('item:leather', Math.floor(Math.random() * 2)));
        break;
      case 'pig':
        drops.push(createItemStack('item:raw_porkchop', Math.floor(Math.random() * 2) + 1));
        break;
      case 'sheep':
        drops.push(createItemStack('item:raw_beef', 1));
        break;
      case 'chicken':
        drops.push(createItemStack('item:feather', Math.floor(Math.random() * 2) + 1));
        break;
      case 'zombie':
        drops.push(createItemStack('item:raw_beef', 1));
        break;
      case 'skeleton':
        drops.push(createItemStack('item:arrow', Math.floor(Math.random() * 3) + 1));
        break;
      case 'creeper':
        drops.push(createItemStack('item:gunpowder', Math.floor(Math.random() * 2) + 1));
        break;
      case 'spider':
        drops.push(createItemStack('item:string', Math.floor(Math.random() * 2) + 1));
        break;
      case 'enderman':
        drops.push(createItemStack('item:diamond', 1));
        break;
    }
    return drops.filter(d => d.count > 0);
  }

  public clearAll() {
    this.mobs.forEach(({ mesh }) => this.scene.remove(mesh));
    this.mobs.clear();
  }
}
