'use client';

import { useRef, useCallback, useEffect } from 'react';
import * as THREE from 'three';

// 高级物理系统配置
const ENHANCED_PHYSICS_CONFIG = {
  // 基础物理参数
  gravity: -9.8,
  airDensity: 1.2, // 空气密度 kg/m³
  dragCoefficient: 0.47, // 球体阻力系数
  
  // 材质属性
  materials: {
    character: { friction: 0.3, restitution: 0.7, density: 1000 },
    furniture: { friction: 0.5, restitution: 0.2, density: 500 },
    ground: { friction: 0.8, restitution: 0.1, density: Infinity }
  },
  
  // 高级效果
  enableFluidDynamics: true, // 流体动力学
  enableSoftBody: false, // 软体物理（未来扩展）
  enableWindEffects: true, // 风效
  enableThermalEffects: false // 热效应（未来扩展）
};

// 物理对象接口
interface EnhancedPhysicsObject {
  id: string;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  acceleration: THREE.Vector3;
  rotation: THREE.Euler;
  angularVelocity: THREE.Vector3;
  
  // 物理属性
  mass: number;
  volume: number;
  boundingBox: THREE.Box3;
  colliderType: 'sphere' | 'box' | 'capsule' | 'mesh';
  
  // 材质属性
  material: {
    friction: number;
    restitution: number;
    density: number;
  };
  
  // 状态
  isStatic: boolean;
  isSleeping: boolean; // 睡眠状态优化
  
  // 高级效果
  temperature?: number; // 温度（用于热效应）
  windAffected?: boolean; // 是否受风影响
}

// 环境效果
interface EnvironmentEffects {
  wind: {
    direction: THREE.Vector3;
    speed: number; // m/s
    turbulence: number; // 湍流强度
  };
  temperature: number; // 环境温度
  humidity: number; // 湿度
}

export const useEnhancedPhysicsSystem = () => {
  const physicsObjects = useRef<Map<string, EnhancedPhysicsObject>>(new Map());
  const environment = useRef<EnvironmentEffects>({
    wind: { direction: new THREE.Vector3(1, 0, 0), speed: 0, turbulence: 0.1 },
    temperature: 20,
    humidity: 50
  });
  
  const lastUpdateTime = useRef<number>(0);
  const animationFrameId = useRef<number>(0);
  const collisionPairs = useRef<Set<string>>(new Set());

  // 添加物理对象
  const addPhysicsObject = useCallback((object: EnhancedPhysicsObject) => {
    physicsObjects.current.set(object.id, object);
  }, []);

  // 移除物理对象
  const removePhysicsObject = useCallback((id: string) => {
    physicsObjects.current.delete(id);
  }, []);

  // 更新环境效果
  const updateEnvironment = useCallback((effects: Partial<EnvironmentEffects>) => {
    environment.current = { ...environment.current, ...effects };
  }, []);

  // 计算空气阻力
  const calculateAirResistance = useCallback((object: EnhancedPhysicsObject): THREE.Vector3 => {
    if (!ENHANCED_PHYSICS_CONFIG.enableFluidDynamics || object.isStatic) {
      return new THREE.Vector3(0, 0, 0);
    }

    const velocity = object.velocity.length();
    if (velocity === 0) return new THREE.Vector3(0, 0, 0);

    // 计算阻力 F = 0.5 * ρ * v² * Cd * A
    const dragForce = 0.5 * ENHANCED_PHYSICS_CONFIG.airDensity * 
                      Math.pow(velocity, 2) * 
                      ENHANCED_PHYSICS_CONFIG.dragCoefficient * 
                      calculateCrossSectionalArea(object);

    // 阻力方向与速度方向相反
    const dragDirection = object.velocity.clone().normalize().negate();
    return dragDirection.multiplyScalar(dragForce / object.mass);
  }, []);

  // 计算横截面积
  const calculateCrossSectionalArea = useCallback((object: EnhancedPhysicsObject): number => {
    switch (object.colliderType) {
      case 'sphere':
        const radius = object.boundingBox.getSize(new THREE.Vector3()).x / 2;
        return Math.PI * Math.pow(radius, 2);
      case 'box':
        const size = object.boundingBox.getSize(new THREE.Vector3());
        // 近似计算最大横截面
        return Math.max(size.x * size.y, size.x * size.z, size.y * size.z);
      default:
        return 1.0; // 默认面积
    }
  }, []);

  // 计算风力
  const calculateWindForce = useCallback((object: EnhancedPhysicsObject): THREE.Vector3 => {
    if (!ENHANCED_PHYSICS_CONFIG.enableWindEffects || !object.windAffected || object.isStatic) {
      return new THREE.Vector3(0, 0, 0);
    }

    const wind = environment.current.wind;
    
    // 基础风力
    let windForce = wind.direction.clone().multiplyScalar(wind.speed);
    
    // 添加湍流
    const turbulence = new THREE.Vector3(
      (Math.random() - 0.5) * wind.turbulence,
      (Math.random() - 0.5) * wind.turbulence * 0.5, // 垂直方向湍流较小
      (Math.random() - 0.5) * wind.turbulence
    );
    
    windForce.add(turbulence);
    
    // 根据物体表面积计算风力
    const area = calculateCrossSectionalArea(object);
    return windForce.multiplyScalar(area * 0.1); // 缩放系数
  }, [calculateCrossSectionalArea]);

  // 高级碰撞检测
  const detectCollision = useCallback((obj1: EnhancedPhysicsObject, obj2: EnhancedPhysicsObject) => {
    if (obj1.isStatic && obj2.isStatic) return null;
    
    const pairKey = `${obj1.id}-${obj2.id}`;
    if (collisionPairs.current.has(pairKey)) return null;

    // 使用包围盒进行快速检测
    const box1 = obj1.boundingBox.clone().translate(obj1.position);
    const box2 = obj2.boundingBox.clone().translate(obj2.position);
    
    if (!box1.intersectsBox(box2)) return null;

    // 精确碰撞检测（根据碰撞器类型）
    let collision = null;
    
    if (obj1.colliderType === 'sphere' && obj2.colliderType === 'sphere') {
      collision = detectSphereSphereCollision(obj1, obj2);
    } else if (obj1.colliderType === 'box' && obj2.colliderType === 'box') {
      collision = detectBoxBoxCollision(obj1, obj2);
    } else if (obj1.colliderType === 'sphere' && obj2.colliderType === 'box') {
      collision = detectSphereBoxCollision(obj1, obj2);
    } else if (obj1.colliderType === 'box' && obj2.colliderType === 'sphere') {
      collision = detectSphereBoxCollision(obj2, obj1);
      if (collision) collision.normal.negate();
    }

    if (collision) {
      collisionPairs.current.add(pairKey);
    }
    
    return collision;
  }, []);

  // 球体-球体碰撞检测
  const detectSphereSphereCollision = useCallback((sphere1: EnhancedPhysicsObject, sphere2: EnhancedPhysicsObject) => {
    const distance = sphere1.position.distanceTo(sphere2.position);
    const radius1 = sphere1.boundingBox.getSize(new THREE.Vector3()).x / 2;
    const radius2 = sphere2.boundingBox.getSize(new THREE.Vector3()).x / 2;
    
    if (distance < radius1 + radius2) {
      const normal = sphere2.position.clone().sub(sphere1.position).normalize();
      return {
        normal,
        depth: radius1 + radius2 - distance,
        contactPoint: sphere1.position.clone().add(normal.multiplyScalar(radius1))
      };
    }
    
    return null;
  }, []);

  // 盒子-盒子碰撞检测
  const detectBoxBoxCollision = useCallback((box1: EnhancedPhysicsObject, box2: EnhancedPhysicsObject) => {
    // 分离轴定理实现
    const axes = [
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(0, 0, 1)
    ];
    
    let minOverlap = Infinity;
    let collisionNormal = new THREE.Vector3();
    
    for (const axis of axes) {
      const proj1 = projectBoxOnAxis(box1, axis);
      const proj2 = projectBoxOnAxis(box2, axis);
      
      const overlap = Math.min(proj1.max, proj2.max) - Math.max(proj1.min, proj2.min);
      
      if (overlap <= 0) return null; // 无碰撞
      
      if (overlap < minOverlap) {
        minOverlap = overlap;
        collisionNormal.copy(axis);
      }
    }
    
    return {
      normal: collisionNormal,
      depth: minOverlap,
      contactPoint: calculateContactPoint(box1, box2)
    };
  }, []);

  // 球体-盒子碰撞检测
  const detectSphereBoxCollision = useCallback((sphere: EnhancedPhysicsObject, box: EnhancedPhysicsObject) => {
    const boxSize = box.boundingBox.getSize(new THREE.Vector3());
    const sphereRadius = sphere.boundingBox.getSize(new THREE.Vector3()).x / 2;
    
    // 计算球体到盒子的最近点
    const closestPoint = new THREE.Vector3(
      Math.max(box.position.x - boxSize.x/2, Math.min(sphere.position.x, box.position.x + boxSize.x/2)),
      Math.max(box.position.y - boxSize.y/2, Math.min(sphere.position.y, box.position.y + boxSize.y/2)),
      Math.max(box.position.z - boxSize.z/2, Math.min(sphere.position.z, box.position.z + boxSize.z/2))
    );
    
    const distance = sphere.position.distanceTo(closestPoint);
    
    if (distance < sphereRadius) {
      const normal = sphere.position.clone().sub(closestPoint).normalize();
      return {
        normal,
        depth: sphereRadius - distance,
        contactPoint: closestPoint
      };
    }
    
    return null;
  }, []);

  // 辅助函数：在轴上投影盒子
  const projectBoxOnAxis = useCallback((box: EnhancedPhysicsObject, axis: THREE.Vector3) => {
    const size = box.boundingBox.getSize(new THREE.Vector3());
    const center = box.position;
    
    const projection = axis.dot(center);
    const radius = Math.abs(axis.x * size.x/2) + Math.abs(axis.y * size.y/2) + Math.abs(axis.z * size.z/2);
    
    return { min: projection - radius, max: projection + radius };
  }, []);

  // 计算接触点
  const calculateContactPoint = useCallback((obj1: EnhancedPhysicsObject, obj2: EnhancedPhysicsObject) => {
    // 简化实现：返回两个物体中心的中间点
    return obj1.position.clone().add(obj2.position).multiplyScalar(0.5);
  }, []);

  // 处理碰撞响应
  const handleCollision = useCallback((obj1: EnhancedPhysicsObject, obj2: EnhancedPhysicsObject, collision: any) => {
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
    const relativeVelocity = obj2.velocity.clone().sub(obj1.velocity);
    const velocityAlongNormal = relativeVelocity.dot(collision.normal);
    
    if (velocityAlongNormal > 0) return; // 物体正在分离

    // 计算恢复系数（结合两个物体的材质）
    const restitution = Math.min(obj1.material.restitution, obj2.material.restitution);
    
    // 计算冲量
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

    // 摩擦力处理
    const friction = Math.sqrt(obj1.material.friction * obj2.material.friction);
    const tangent = relativeVelocity.clone().sub(collision.normal.clone().multiplyScalar(velocityAlongNormal));
    
    if (tangent.length() > 0.001) {
      tangent.normalize();
      const frictionImpulse = tangent.multiplyScalar(-friction * impulseScalar);
      
      if (!obj1.isStatic) {
        obj1.velocity.sub(frictionImpulse.clone().multiplyScalar(obj1.mass));
      }
      if (!obj2.isStatic) {
        obj2.velocity.add(frictionImpulse.clone().multiplyScalar(obj2.mass));
      }
    }
  }, []);

  // 更新物理
  const updatePhysics = useCallback((deltaTime: number) => {
    const objects = Array.from(physicsObjects.current.values());
    collisionPairs.current.clear();

    // 应用力和运动
    objects.forEach(obj => {
      if (obj.isStatic || obj.isSleeping) return;

      // 重置加速度
      obj.acceleration.set(0, 0, 0);

      // 应用重力
      obj.acceleration.y += ENHANCED_PHYSICS_CONFIG.gravity;

      // 应用空气阻力
      const airResistance = calculateAirResistance(obj);
      obj.acceleration.add(airResistance);

      // 应用风力
      const windForce = calculateWindForce(obj);
      obj.acceleration.add(windForce);

      // 更新速度
      obj.velocity.add(obj.acceleration.clone().multiplyScalar(deltaTime));

      // 更新位置
      obj.position.add(obj.velocity.clone().multiplyScalar(deltaTime));

      // 更新旋转
      if (obj.angularVelocity.length() > 0) {
        const rotationQuaternion = new THREE.Quaternion().setFromEuler(obj.rotation);
        const angularQuaternion = new THREE.Quaternion(
          obj.angularVelocity.x * deltaTime / 2,
          obj.angularVelocity.y * deltaTime / 2,
          obj.angularVelocity.z * deltaTime / 2,
          0
        );
        rotationQuaternion.multiply(angularQuaternion);
        rotationQuaternion.normalize();
        obj.rotation.setFromQuaternion(rotationQuaternion);
      }

      // 检查睡眠状态
      if (obj.velocity.length() < 0.01 && obj.angularVelocity.length() < 0.01) {
        obj.isSleeping = true;
      }
    });

    // 碰撞检测和响应
    for (let i = 0; i < objects.length; i++) {
      for (let j = i + 1; j < objects.length; j++) {
        const obj1 = objects[i];
        const obj2 = objects[j];
        
        const collision = detectCollision(obj1, obj2);
        if (collision) {
          obj1.isSleeping = false;
          obj2.isSleeping = false;
          handleCollision(obj1, obj2, collision);
        }
      }
    }
  }, [calculateAirResistance, calculateWindForce, detectCollision, handleCollision]);

  // 物理循环
  const physicsLoop = useCallback((currentTime: number) => {
    if (lastUpdateTime.current === 0) {
      lastUpdateTime.current = currentTime;
    }
    
    const deltaTime = (currentTime - lastUpdateTime.current) / 1000;
    lastUpdateTime.current = currentTime;
    
    // 使用固定时间步长
    const fixedTimeStep = 1/60;
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
      obj.isSleeping = false;
      obj.acceleration.add(force.clone().divideScalar(obj.mass));
    }
  }, []);

  // 应用扭矩
  const applyTorque = useCallback((id: string, torque: THREE.Vector3) => {
    const obj = physicsObjects.current.get(id);
    if (obj && !obj.isStatic) {
      obj.isSleeping = false;
      obj.angularVelocity.add(torque.clone().divideScalar(obj.mass));
    }
  }, []);

  // 唤醒物体
  const wakeObject = useCallback((id: string) => {
    const obj = physicsObjects.current.get(id);
    if (obj) {
      obj.isSleeping = false;
    }
  }, []);

  // 清理
  useEffect(() => {
    return () => {
      stopPhysics();
    };
  }, [stopPhysics]);

  return {
    addPhysicsObject,
    removePhysicsObject,
    updateEnvironment,
    applyForce,
    applyTorque,
    wakeObject,
    startPhysics,
    stopPhysics,
    getPhysicsObject: (id: string) => physicsObjects.current.get(id),
    getEnvironment: () => environment.current
  };
};