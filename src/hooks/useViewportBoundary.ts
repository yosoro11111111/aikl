'use client';

import { useRef, useCallback } from 'react';
import * as THREE from 'three';

interface BoundaryConfig {
  margin?: number;
  enableX?: boolean;
  enableZ?: boolean;
  enableY?: boolean;
  bounceEffect?: boolean;
}

interface BoundaryState {
  isOutOfBounds: boolean;
  boundaryForce: THREE.Vector3;
}

interface ViewportData {
  size: { width: number; height: number };
  camera: THREE.Camera;
}

export const useViewportBoundary = (viewportData: ViewportData, config: BoundaryConfig = {}) => {
  const stateRef = useRef<BoundaryState>({
    isOutOfBounds: false,
    boundaryForce: new THREE.Vector3(0, 0, 0)
  });

  const {
    margin = 0.5,
    enableX = true,
    enableZ = true,
    enableY = false,
    bounceEffect = true
  } = config;

  const { size, camera } = viewportData;

  // 计算当前相机视角下的可见边界
  const calculateViewportBounds = useCallback(() => {
    if (!camera) return { minX: -2, maxX: 2, minZ: -2, maxZ: 2 };

    const cam = camera as THREE.PerspectiveCamera;
    
    if (cam.isPerspectiveCamera) {
      // 计算相机视锥体在z=0平面上的可见范围
      const distance = Math.abs(cam.position.z);
      const vFOV = THREE.MathUtils.degToRad(cam.fov);
      const visibleHeight = 2 * Math.tan(vFOV / 2) * distance;
      const visibleWidth = visibleHeight * (size.width / size.height);
      
      return {
        minX: -visibleWidth / 2 + margin,
        maxX: visibleWidth / 2 - margin,
        minZ: -2 + margin, // 固定深度范围
        maxZ: 3.5 - margin
      };
    } else {
      // 正交相机
      return {
        minX: -2.5 + margin,
        maxX: 2.5 - margin,
        minZ: -2 + margin,
        maxZ: 3.5 - margin
      };
    }
  }, [camera, size, margin]);

  // 检查位置是否在边界内
  const checkBoundary = useCallback((position: THREE.Vector3): BoundaryState => {
    const bounds = calculateViewportBounds();
    const state = stateRef.current;
    const force = new THREE.Vector3(0, 0, 0);
    let isOutOfBounds = false;

    // X轴边界检查
    if (enableX) {
      if (position.x < bounds.minX) {
        force.x = (bounds.minX - position.x) * 0.1;
        isOutOfBounds = true;
      } else if (position.x > bounds.maxX) {
        force.x = (bounds.maxX - position.x) * 0.1;
        isOutOfBounds = true;
      }
    }

    // Z轴边界检查
    if (enableZ) {
      if (position.z < bounds.minZ) {
        force.z = (bounds.minZ - position.z) * 0.1;
        isOutOfBounds = true;
      } else if (position.z > bounds.maxZ) {
        force.z = (bounds.maxZ - position.z) * 0.1;
        isOutOfBounds = true;
      }
    }

    // Y轴边界检查（可选）
    if (enableY) {
      const minY = -0.5;
      const maxY = 2.0;
      if (position.y < minY) {
        force.y = (minY - position.y) * 0.1;
        isOutOfBounds = true;
      } else if (position.y > maxY) {
        force.y = (maxY - position.y) * 0.1;
        isOutOfBounds = true;
      }
    }

    state.isOutOfBounds = isOutOfBounds;
    state.boundaryForce.copy(force);
    
    return state;
  }, [calculateViewportBounds, enableX, enableZ, enableY]);

  // 约束位置到边界内
  const constrainPosition = useCallback((position: THREE.Vector3): THREE.Vector3 => {
    const bounds = calculateViewportBounds();
    const constrained = position.clone();

    if (enableX) {
      constrained.x = Math.max(bounds.minX, Math.min(bounds.maxX, position.x));
    }
    
    if (enableZ) {
      constrained.z = Math.max(bounds.minZ, Math.min(bounds.maxZ, position.z));
    }

    if (enableY) {
      constrained.y = Math.max(-0.5, Math.min(2.0, position.y));
    }

    return constrained;
  }, [calculateViewportBounds, enableX, enableZ, enableY]);

  // 应用边界力（用于物理效果）
  const applyBoundaryForce = useCallback((velocity: THREE.Vector3, delta: number): THREE.Vector3 => {
    if (!bounceEffect) return velocity;
    
    const state = stateRef.current;
    if (state.isOutOfBounds) {
      const force = state.boundaryForce.clone().multiplyScalar(delta * 10);
      velocity.add(force);
      
      // 添加阻尼效果
      velocity.multiplyScalar(0.95);
    }
    
    return velocity;
  }, [bounceEffect]);

  // 获取边界可视化数据（用于调试）
  const getBoundaryVisualization = useCallback(() => {
    const bounds = calculateViewportBounds();
    return {
      bounds,
      center: new THREE.Vector3(
        (bounds.minX + bounds.maxX) / 2,
        0,
        (bounds.minZ + bounds.maxZ) / 2
      ),
      size: new THREE.Vector3(
        bounds.maxX - bounds.minX,
        0.1,
        bounds.maxZ - bounds.minZ
      )
    };
  }, [calculateViewportBounds]);

  return {
    checkBoundary,
    constrainPosition,
    applyBoundaryForce,
    getBoundaryVisualization,
    getBoundaryState: () => stateRef.current
  };
};