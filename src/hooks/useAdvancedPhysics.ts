'use client';

import { useRef, useCallback, useEffect } from 'react';
import * as THREE from 'three';

// 物理引擎配置
const PHYSICS_CONFIG = {
  gravity: -9.8, // 重力加速度
  friction: 0.98, // 摩擦力
  airResistance: 0.995, // 空气阻力
  collisionElasticity: 0.7, // 碰撞弹性
  timeStep: 1/60, // 时间步长
};

// 物理对象接口
interface PhysicsObject {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  acceleration: THREE.Vector3;
  mass: number;
  boundingBox?: THREE.Box3;
  isStatic?: boolean;
  colliderType?: 'sphere' | 'box' | 'capsule';
  radius?: number; // 球体半径
  size?: THREE.Vector3; // 盒子尺寸
}

// 碰撞检测结果
interface CollisionResult {
  hasCollision: boolean;
  normal?: THREE.Vector3;
  depth?: number;
  contactPoint?: THREE.Vector3;
}

export const useAdvancedPhysics = () => {
  const physicsObjects = useRef<Map<string, PhysicsObject>>(new Map());
  const lastUpdateTime = useRef<number>(0);
  const animationFrameId = useRef<number>(0);

  // 添加物理对象
  const addPhysicsObject = useCallback((id: string, object: PhysicsObject) => {
    physicsObjects.current.set(id, object);
  }, []);

  // 移除物理对象
  const removePhysicsObject = useCallback((id: string) => {
    physicsObjects.current.delete(id);
  }, []);

  // 更新物理对象
  const updatePhysicsObject = useCallback((id: string, updates: Partial<PhysicsObject>) => {
    const object = physicsObjects.current.get(id);
    if (object) {
      physicsObjects.current.set(id, { ...object, ...updates });
    }
  }, []);

  // 球体-球体碰撞检测
  const sphereSphereCollision = useCallback((obj1: PhysicsObject, obj2: PhysicsObject): CollisionResult => {
    if (!obj1.radius || !obj2.radius) return { hasCollision: false };
    
    const distance = obj1.position.distanceTo(obj2.position);
    const minDistance = obj1.radius + obj2.radius;
    
    if (distance < minDistance) {
      const normal = new THREE.Vector3()
        .subVectors(obj2.position, obj1.position)
        .normalize();
      
      return {
        hasCollision: true,
        normal,
        depth: minDistance - distance,
        contactPoint: obj1.position.clone().add(normal.multiplyScalar(obj1.radius))
      };
    }
    
    return { hasCollision: false };
  }, []);

  // 球体-盒子碰撞检测
  const sphereBoxCollision = useCallback((sphere: PhysicsObject, box: PhysicsObject): CollisionResult => {
    if (!sphere.radius || !box.size) return { hasCollision: false };
    
    // 计算球体到盒子的最近点
    const closestPoint = new THREE.Vector3(
      Math.max(box.position.x - box.size.x/2, Math.min(sphere.position.x, box.position.x + box.size.x/2)),
      Math.max(box.position.y - box.size.y/2, Math.min(sphere.position.y, box.position.y + box.size.y/2)),
      Math.max(box.position.z - box.size.z/2, Math.min(sphere.position.z, box.position.z + box.size.z/2))
    );
    
    const distance = sphere.position.distanceTo(closestPoint);
    
    if (distance < sphere.radius) {
      const normal = new THREE.Vector3()
        .subVectors(sphere.position, closestPoint)
        .normalize();
      
      return {
        hasCollision: true,
        normal,
        depth: sphere.radius - distance,
        contactPoint: closestPoint
      };
    }
    
    return { hasCollision: false };
  }, []);

  // 通用碰撞检测
  const detectCollision = useCallback((obj1: PhysicsObject, obj2: PhysicsObject): CollisionResult => {
    if (obj1.isStatic && obj2.isStatic) return { hasCollision: false };
    
    // 根据碰撞器类型选择检测方法
    if (obj1.colliderType === 'sphere' && obj2.colliderType === 'sphere') {
      return sphereSphereCollision(obj1, obj2);
    } else if (obj1.colliderType === 'sphere' && obj2.colliderType === 'box') {
      return sphereBoxCollision(obj1, obj2);
    } else if (obj1.colliderType === 'box' && obj2.colliderType === 'sphere') {
      const result = sphereBoxCollision(obj2, obj1);
      if (result.normal) result.normal.negate();
      return result;
    }
    
    return { hasCollision: false };
  }, [sphereSphereCollision, sphereBoxCollision]);

  // 处理碰撞响应
  const handleCollision = useCallback((obj1: PhysicsObject, obj2: PhysicsObject, collision: CollisionResult) => {
    if (!collision.normal || !collision.depth) return;
    
    // 分离物体
    const separation = collision.normal.clone().multiplyScalar(collision.depth * 0.5);
    
    if (!obj1.isStatic) {
      obj1.position.sub(separation);
    }
    if (!obj2.isStatic) {
      obj2.position.add(separation);
    }
    
    // 计算相对速度
    const relativeVelocity = new THREE.Vector3()
      .subVectors(obj2.velocity, obj1.velocity);
    
    const velocityAlongNormal = relativeVelocity.dot(collision.normal);
    
    // 如果物体正在分离，不处理碰撞
    if (velocityAlongNormal > 0) return;
    
    // 计算冲量
    const restitution = PHYSICS_CONFIG.collisionElasticity;
    let impulseScalar = -(1 + restitution) * velocityAlongNormal;
    
    if (!obj1.isStatic && !obj2.isStatic) {
      impulseScalar /= obj1.mass + obj2.mass;
    } else if (obj1.isStatic) {
      impulseScalar /= obj2.mass;
    } else {
      impulseScalar /= obj1.mass;
    }
    
    const impulse = collision.normal.clone().multiplyScalar(impulseScalar);
    
    // 应用冲量
    if (!obj1.isStatic) {
      obj1.velocity.sub(impulse.clone().multiplyScalar(obj1.mass));
    }
    if (!obj2.isStatic) {
      obj2.velocity.add(impulse.clone().multiplyScalar(obj2.mass));
    }
  }, []);

  // 更新物理
  const updatePhysics = useCallback((deltaTime: number) => {
    const objects = Array.from(physicsObjects.current.values());
    
    // 应用力和运动
    objects.forEach(obj => {
      if (obj.isStatic) return;
      
      // 应用重力
      obj.acceleration.y += PHYSICS_CONFIG.gravity;
      
      // 更新速度
      obj.velocity.add(obj.acceleration.multiplyScalar(deltaTime));
      
      // 应用空气阻力
      obj.velocity.multiplyScalar(PHYSICS_CONFIG.airResistance);
      
      // 更新位置
      obj.position.add(obj.velocity.clone().multiplyScalar(deltaTime));
      
      // 重置加速度
      obj.acceleration.set(0, 0, 0);
    });
    
    // 碰撞检测和响应
    for (let i = 0; i < objects.length; i++) {
      for (let j = i + 1; j < objects.length; j++) {
        const obj1 = objects[i];
        const obj2 = objects[j];
        
        const collision = detectCollision(obj1, obj2);
        if (collision.hasCollision) {
          handleCollision(obj1, obj2, collision);
        }
      }
    }
  }, [detectCollision, handleCollision]);

  // 物理循环
  const physicsLoop = useCallback((currentTime: number) => {
    if (lastUpdateTime.current === 0) {
      lastUpdateTime.current = currentTime;
    }
    
    const deltaTime = (currentTime - lastUpdateTime.current) / 1000; // 转换为秒
    lastUpdateTime.current = currentTime;
    
    // 使用固定时间步长
    const fixedTimeStep = PHYSICS_CONFIG.timeStep;
    let accumulator = deltaTime;
    
    while (accumulator >= fixedTimeStep) {
      updatePhysics(fixedTimeStep);
      accumulator -= fixedTimeStep;
    }
    
    // 剩余时间使用插值
    if (accumulator > 0) {
      updatePhysics(accumulator);
    }
    
    animationFrameId.current = requestAnimationFrame(physicsLoop);
  }, [updatePhysics]);

  // 启动物理引擎
  const startPhysics = useCallback(() => {
    if (animationFrameId.current === 0) {
      lastUpdateTime.current = 0;
      animationFrameId.current = requestAnimationFrame(physicsLoop);
    }
  }, [physicsLoop]);

  // 停止物理引擎
  const stopPhysics = useCallback(() => {
    if (animationFrameId.current !== 0) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = 0;
    }
  }, []);

  // 应用力
  const applyForce = useCallback((id: string, force: THREE.Vector3) => {
    const obj = physicsObjects.current.get(id);
    if (obj && !obj.isStatic) {
      obj.acceleration.add(force.clone().divideScalar(obj.mass));
    }
  }, []);

  // 应用冲量
  const applyImpulse = useCallback((id: string, impulse: THREE.Vector3) => {
    const obj = physicsObjects.current.get(id);
    if (obj && !obj.isStatic) {
      obj.velocity.add(impulse.clone().divideScalar(obj.mass));
    }
  }, []);

  // 设置约束（如地面）
  const addGroundConstraint = useCallback((groundY: number) => {
    const groundId = 'ground';
    const groundObject: PhysicsObject = {
      position: new THREE.Vector3(0, groundY, 0),
      velocity: new THREE.Vector3(0, 0, 0),
      acceleration: new THREE.Vector3(0, 0, 0),
      mass: Infinity, // 无限质量表示静态物体
      isStatic: true,
      colliderType: 'box',
      size: new THREE.Vector3(100, 0.1, 100) // 大而薄的地面
    };
    
    addPhysicsObject(groundId, groundObject);
  }, [addPhysicsObject]);

  // 清理
  useEffect(() => {
    return () => {
      stopPhysics();
    };
  }, [stopPhysics]);

  return {
    addPhysicsObject,
    removePhysicsObject,
    updatePhysicsObject,
    applyForce,
    applyImpulse,
    addGroundConstraint,
    startPhysics,
    stopPhysics,
    getPhysicsObject: (id: string) => physicsObjects.current.get(id)
  };
};