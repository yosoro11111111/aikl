import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { VRM, VRMExpressionPresetName } from '@pixiv/three-vrm';
import * as THREE from 'three';
import { useStore } from '@/store/useStore';

export const useShyBehavior = (vrm: VRM | null) => {
  const { isHovering, targetBodyPart, setEmotion, setAction, currentEmotion } = useStore();
  const hoverTimer = useRef(0);
  const isShyRef = useRef(false);
  
  useFrame((state, delta) => {
    if (!vrm) return;

    // Check if user is staring at face (hovering head/face/neck)
    const isStaring = isHovering && targetBodyPart && ['head', 'face', 'neck'].some(part => targetBodyPart.includes(part));

    if (isStaring) {
      hoverTimer.current += delta;
    } else {
      hoverTimer.current = 0;
      if (isShyRef.current) {
         // Recovery from shy state after a while
         if (hoverTimer.current === 0) { // Instant reset for timer, but delay recovery logic could be here
            isShyRef.current = false;
            if (currentEmotion === 'shy') {
                setEmotion('neutral');
            }
         }
      }
    }

    // Trigger Shy Behavior after 2.5 seconds of staring
    if (hoverTimer.current > 2.5 && !isShyRef.current) {
      isShyRef.current = true;
      setEmotion('shy');
      setAction('shy_pose');
      
      // Optional: Sound effect could be triggered here if we had access to playSound
    }

    // While shy, force look away (override LookAt)
    if (isShyRef.current && vrm.lookAt) {
        // Create a target that is down and away from camera
        // Camera is usually at (0, 0.8, 3.5)
        // Look down-left or down-right
        const shyTarget = new THREE.Vector3(0.5, 0, 1); 
        vrm.lookAt.lookAt(shyTarget);
    }
  });
};
