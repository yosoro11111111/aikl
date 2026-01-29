
import { useStore, Action } from '@/store/useStore';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';

export const useAvatarMovement = (groupRef: React.RefObject<THREE.Group | null>, modelId?: string) => {
  const { interactionState, setAction: setGlobalAction, currentAction: globalAction, modelStates, setModelAction } = useStore();
  const isMovingRef = useRef(false);

  const myAction = (modelId && modelStates[modelId]?.action) ? modelStates[modelId].action : globalAction;
  const setAction = (action: Action) => {
      if (modelId) setModelAction(modelId, action);
      else setGlobalAction(action);
  };

  useFrame((state, delta) => {
    // Check if this avatar is the target
    if (interactionState.targetAvatarId && modelId && interactionState.targetAvatarId !== modelId) {
        return;
    }

    if (!interactionState.isInteracting || !interactionState.targetPosition || !groupRef.current) {
      return;
    }

    // Convert target from World Space to Local Space relative to parent
    const targetPos = new THREE.Vector3(...interactionState.targetPosition);
    
    // Boundary check for target position
    const BOUNDARY = 4.5;
    targetPos.x = Math.max(-BOUNDARY, Math.min(BOUNDARY, targetPos.x));
    targetPos.z = Math.max(-BOUNDARY, Math.min(BOUNDARY, targetPos.z));

    if (groupRef.current.parent) {
        groupRef.current.parent.worldToLocal(targetPos);
    }

    const currentPos = groupRef.current.position;
    
    // Walk target is on the floor (keep current Y until arrival, assuming flat floor)
    // But if we are walking to a bed, we walk to the XZ coordinate first.
    const targetWalkPos = new THREE.Vector3(targetPos.x, currentPos.y, targetPos.z);
    const distance = currentPos.distanceTo(targetWalkPos);
    // Reduce stop distance for more precise positioning
    const stopDistance = 0.02;
    const startMoveDistance = 0.05;

    if (isMovingRef.current) {
      // 正在移动状态：直到非常接近才停止
      if (distance <= stopDistance) {
        isMovingRef.current = false;
        
        // Snap to exact position (including Y axis from targetPos)
        currentPos.copy(targetPos);
        
        // Snap to exact rotation if provided
        if (interactionState.targetRotation) {
            const targetEuler = new THREE.Euler(...interactionState.targetRotation);
            const targetQuat = new THREE.Quaternion().setFromEuler(targetEuler);
            if (groupRef.current.parent) {
                const parentQuat = new THREE.Quaternion();
                groupRef.current.parent.getWorldQuaternion(parentQuat);
                parentQuat.invert();
                targetQuat.premultiply(parentQuat);
            }
            groupRef.current.setRotationFromQuaternion(targetQuat);
        }

        // Switch to target action IMMEDIATELY
        if (interactionState.targetAction) {
            setAction(interactionState.targetAction as Action);
        }
      } else {
        // 继续移动
        groupRef.current.lookAt(targetWalkPos);
        
        const speed = 2.0;
        // Ensure we don't overshoot
        const moveDist = Math.min(distance, speed * delta);
        const direction = targetWalkPos.clone().sub(currentPos).normalize();
        currentPos.add(direction.multiplyScalar(moveDist));
      }
    } else {
      // 静止状态：只有距离显著变大时才重新开始移动
      if (distance > startMoveDistance) {
        isMovingRef.current = true;
        if (myAction !== 'walk') {
            setAction('walk');
        }
      } else {
        // 保持位置锁定，防止漂移
        // Ensure we stay at the targetPos (including Y), not just targetWalkPos
        if (currentPos.distanceTo(targetPos) > 0.001) {
             currentPos.lerp(targetPos, 0.2); // Smoothly correct drift
        }
      }
    }
  });
};
