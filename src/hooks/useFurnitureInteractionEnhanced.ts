'use client';

import { useCallback } from 'react';
import * as THREE from 'three';
import { useViewportBoundary } from '@/hooks/useViewportBoundary';
import { useAdvancedPhysics } from '@/hooks/useAdvancedPhysics';

interface FurnitureInteractionConfig {
  margin?: number;
  enableSmartPositioning?: boolean;
  enableBoundaryConstraints?: boolean;
  enablePostureAdaptation?: boolean;
}

interface InteractionResult {
  targetPos: [number, number, number];
  targetRot: [number, number, number];
  postureAdjustment?: {
    rotation: [number, number, number];
    scale: number;
  };
}

interface ViewportData {
  size: { width: number; height: number };
  camera: THREE.Camera;
}

export const useFurnitureInteractionEnhanced = (viewportData: ViewportData, config: FurnitureInteractionConfig = {}) => {
  const { constrainPosition } = useViewportBoundary(viewportData, {
    margin: config.margin || 0.4,
    enableX: true,
    enableZ: true,
    bounceEffect: false
  });

  // 物理引擎
  const physics = useAdvancedPhysics();

  const {
    enableBoundaryConstraints = true,
    enablePostureAdaptation = true
  } = config;

  // 智能位置计算 - 考虑家具尺寸和模型姿态
  const computeSmartInteractionTarget = useCallback((
    furnitureItem: any
  ): InteractionResult => {
    const position = new THREE.Vector3(...furnitureItem.position);
    const rotation = new THREE.Euler(...furnitureItem.rotation);
    const quaternion = new THREE.Quaternion().setFromEuler(rotation);

    // 根据家具类型和交互类型计算目标位置
    let targetPos = position.clone();
    let targetRot = new THREE.Euler().copy(rotation);
    let postureAdjustment: { rotation: [number, number, number]; scale: number } | undefined;

    switch (furnitureItem.type) {
      case 'chair':
        // 椅子：坐在椅子前方
        const chairForward = new THREE.Vector3(0, 0, -1).applyQuaternion(quaternion);
        targetPos.add(chairForward.multiplyScalar(0.3));
        targetPos.y += 0.5; // 坐在椅子上方
        
        // 面向椅子
        targetRot.y = Math.atan2(chairForward.x, chairForward.z);
        
        if (enablePostureAdaptation) {
          postureAdjustment = {
            rotation: [0, 0, 0],
            scale: 0.9
          };
        }
        break;

      case 'table':
        // 桌子：站在桌子前方
        const tableForward = new THREE.Vector3(0, 0, -1).applyQuaternion(quaternion);
        targetPos.add(tableForward.multiplyScalar(0.5));
        
        // 面向桌子
        targetRot.y = Math.atan2(tableForward.x, tableForward.z);
        
        if (enablePostureAdaptation) {
          postureAdjustment = {
            rotation: [0, 0, 0],
            scale: 1.0
          };
        }
        break;

      case 'bed':
        // 床：躺在床上
        targetPos.y += 0.2;
        
        if (enablePostureAdaptation) {
          postureAdjustment = {
            rotation: [0, 0, 0],
            scale: 0.8
          };
        }
        break;

      case 'sofa':
        // 沙发：坐在沙发上
        const sofaForward = new THREE.Vector3(0, 0, -1).applyQuaternion(quaternion);
        targetPos.add(sofaForward.multiplyScalar(0.4));
        targetPos.y += 0.3;
        
        targetRot.y = Math.atan2(sofaForward.x, sofaForward.z);
        
        if (enablePostureAdaptation) {
          postureAdjustment = {
            rotation: [0, 0, 0],
            scale: 0.85
          };
        }
        break;

      default:
        // 默认：站在家具前方
        const defaultForward = new THREE.Vector3(0, 0, -1).applyQuaternion(quaternion);
        targetPos.add(defaultForward.multiplyScalar(0.6));
        targetRot.y = Math.atan2(defaultForward.x, defaultForward.z);
        break;
    }

    // 应用边界约束
    if (enableBoundaryConstraints) {
      targetPos = constrainPosition(targetPos);
    }

    return {
      targetPos: [targetPos.x, targetPos.y, targetPos.z],
      targetRot: [targetRot.x, targetRot.y, targetRot.z],
      postureAdjustment
    };
  }, [constrainPosition, enableBoundaryConstraints, enablePostureAdaptation]);

  // 检查家具交互是否可行
  const checkInteractionFeasibility = useCallback((
    furnitureItem: any,
    characterPosition: THREE.Vector3
  ): { isFeasible: boolean; distance: number; angle: number } => {
    const furniturePos = new THREE.Vector3(...furnitureItem.position);
    const distance = characterPosition.distanceTo(furniturePos);
    
    // 计算角度差
    const direction = furniturePos.clone().sub(characterPosition).normalize();
    const characterForward = new THREE.Vector3(0, 0, -1);
    const angle = Math.acos(direction.dot(characterForward));
    
    // 判断交互是否可行
    const isFeasible = distance < 3.0 && angle < Math.PI / 2; // 距离3米内，角度90度内
    
    return { isFeasible, distance, angle };
  }, []);

  // 获取家具交互提示
  const getInteractionHint = useCallback((furnitureItem: any): string => {
    switch (furnitureItem.type) {
      case 'chair':
        return '点击椅子让角色坐下';
      case 'table':
        return '点击桌子让角色站在桌边';
      case 'bed':
        return '点击床让角色躺下';
      case 'sofa':
        return '点击沙发让角色坐下';
      default:
        return '点击家具与角色互动';
    }
  }, []);

  // 获取家具交互动画
  const getInteractionAnimation = useCallback((furnitureType: string): string => {
    switch (furnitureType) {
      case 'chair':
      case 'sofa':
        return 'sit';
      case 'bed':
        return 'lie_down';
      case 'table':
        return 'stand_interact';
      default:
        return 'idle';
    }
  }, []);

  // 检查交互位置是否在边界内
  const isInteractionWithinBounds = useCallback((position: [number, number, number]): boolean => {
    const pos = new THREE.Vector3(...position);
    const bounds = {
      minX: -2.5,
      maxX: 2.5,
      minZ: -2,
      maxZ: 3.5,
      minY: -0.5,
      maxY: 2.0
    };
    
    return (
      pos.x >= bounds.minX && pos.x <= bounds.maxX &&
      pos.z >= bounds.minZ && pos.z <= bounds.maxZ &&
      pos.y >= bounds.minY && pos.y <= bounds.maxY
    );
  }, []);

  // 物理碰撞检测
  const checkCollision = useCallback((characterPos: THREE.Vector3, furnitureItems: any[]): boolean => {
    // 为角色创建碰撞体（球体）
    const characterCollider = {
      position: characterPos,
      radius: 0.3, // 角色碰撞半径
      type: 'sphere' as const
    };

    // 检查与每个家具的碰撞
    for (const furniture of furnitureItems) {
      const furniturePos = new THREE.Vector3(...furniture.position);
      
      // 根据家具类型创建碰撞体
      let furnitureCollider;
      
      switch (furniture.type) {
        case 'chair':
        case 'sofa':
          furnitureCollider = {
            position: furniturePos,
            size: new THREE.Vector3(0.8, 1.0, 0.8), // 椅子/沙发尺寸
            type: 'box' as const
          };
          break;
        case 'table':
          furnitureCollider = {
            position: furniturePos,
            size: new THREE.Vector3(1.2, 0.8, 1.2), // 桌子尺寸
            type: 'box' as const
          };
          break;
        case 'bed':
          furnitureCollider = {
            position: furniturePos,
            size: new THREE.Vector3(2.0, 0.5, 1.5), // 床尺寸
            type: 'box' as const
          };
          break;
        default:
          furnitureCollider = {
            position: furniturePos,
            size: new THREE.Vector3(1.0, 1.0, 1.0), // 默认尺寸
            type: 'box' as const
          };
      }

      // 球体-盒子碰撞检测
      const closestPoint = new THREE.Vector3(
        Math.max(furnitureCollider.position.x - furnitureCollider.size.x/2, 
                Math.min(characterCollider.position.x, furnitureCollider.position.x + furnitureCollider.size.x/2)),
        Math.max(furnitureCollider.position.y - furnitureCollider.size.y/2, 
                Math.min(characterCollider.position.y, furnitureCollider.position.y + furnitureCollider.size.y/2)),
        Math.max(furnitureCollider.position.z - furnitureCollider.size.z/2, 
                Math.min(characterCollider.position.z, furnitureCollider.position.z + furnitureCollider.size.z/2))
      );
      
      const distance = characterCollider.position.distanceTo(closestPoint);
      
      if (distance < characterCollider.radius) {
        return true; // 发生碰撞
      }
    }
    
    return false; // 无碰撞
  }, []);

  // 计算避障路径
  const calculateAvoidancePath = useCallback((startPos: THREE.Vector3, targetPos: THREE.Vector3, obstacles: any[]): THREE.Vector3 => {
    const direction = targetPos.clone().sub(startPos).normalize();
    let safePos = targetPos.clone();
    
    // 简单的避障算法
    for (const obstacle of obstacles) {
      const obstaclePos = new THREE.Vector3(...obstacle.position);
      const toObstacle = obstaclePos.clone().sub(startPos);
      const distanceToObstacle = toObstacle.length();
      
      if (distanceToObstacle < 2.0) { // 障碍物在2米内
        // 计算避让方向
        const avoidanceDir = new THREE.Vector3(-toObstacle.z, 0, toObstacle.x).normalize();
        safePos.add(avoidanceDir.multiplyScalar(0.5)); // 避让0.5米
      }
    }
    
    return safePos;
  }, []);

  // 初始化物理系统
  const initializePhysics = useCallback((furnitureItems: any[]) => {
    // 添加地面约束
    physics.addGroundConstraint(-0.5);
    
    // 添加家具作为静态碰撞体
    furnitureItems.forEach((furniture, index) => {
      const furniturePos = new THREE.Vector3(...furniture.position);
      
      physics.addPhysicsObject(`furniture_${index}`, {
        position: furniturePos,
        velocity: new THREE.Vector3(0, 0, 0),
        acceleration: new THREE.Vector3(0, 0, 0),
        mass: Infinity, // 静态物体
        isStatic: true,
        colliderType: 'box',
        size: new THREE.Vector3(1.0, 1.0, 1.0) // 默认尺寸
      });
    });
    
    // 启动物理引擎
    physics.startPhysics();
  }, [physics]);

  return {
    computeSmartInteractionTarget,
    checkInteractionFeasibility,
    getInteractionHint,
    getInteractionAnimation,
    isInteractionWithinBounds,
    checkCollision,
    calculateAvoidancePath,
    initializePhysics
  };
};