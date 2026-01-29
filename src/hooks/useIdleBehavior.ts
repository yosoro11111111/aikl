import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { VRM } from '@pixiv/three-vrm';
import * as THREE from 'three';

export const useIdleBehavior = (vrm: VRM | null) => {
  const time = useRef(0);

  useFrame((_, delta) => {
    if (!vrm) return;

    time.current += delta;

    const chest = vrm.humanoid.getNormalizedBoneNode('chest');
    const hips = vrm.humanoid.getNormalizedBoneNode('hips');
    const head = vrm.humanoid.getNormalizedBoneNode('head');

    // --- Breathing (Chest) ---
    if (chest) {
      const breathCycle = Math.sin(time.current * 2); // ~2 seconds per breath
      const breathAmplitude = 0.03; 
      
      // Rotate slightly on X axis
      chest.rotation.x = breathCycle * breathAmplitude;
    }

    // --- Subtle Sway (Hips) ---
    if (hips) {
      const swayCycle = Math.sin(time.current * 0.5); // Slow sway
      const swayAmplitude = 0.02;
      
      // Rotate slightly on Z and Y axis
      hips.rotation.z = swayCycle * swayAmplitude;
      hips.rotation.y = Math.cos(time.current * 0.3) * (swayAmplitude * 0.5);

      // --- Floating Effect (Position) ---
      // 模拟悬浮/呼吸时的身体起伏
      const floatCycle = Math.sin(time.current * 1.5);
      hips.position.y += floatCycle * 0.0005; 
    }

    // --- Micro Head Movements ---
    if (head) {
      // Add very subtle noise to head to prevent "robot stillness"
      // Perlin noise would be better, but simple sine combination works for now
      const noiseX = Math.sin(time.current * 1.3) * 0.01;
      const noiseY = Math.cos(time.current * 0.8) * 0.01;
      
      head.rotation.x += noiseX * 0.1; // Very subtle
      head.rotation.y += noiseY * 0.1;
    }
  });
};
