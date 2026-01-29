'use client';

import { Canvas, useThree, useFrame } from '@react-three/fiber';
import {
  ContactShadows,
  Environment,
  OrbitControls,
  PerspectiveCamera,
  Detailed,
  Sky,
  CameraShake,
} from '@react-three/drei';
import { Suspense, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useStore } from '@/store/useStore';
import { Avatar } from './Avatar';
import { FurnitureRenderer } from './Furniture';
import { ErrorBoundary } from './ErrorBoundary';
import Particles from './Particles';
import { ActionButtons } from './ActionButtons';
import ScreenshotManager from './ScreenshotManager';
import apartment from '@pmndrs/assets/hdri/apartment.exr';
import city from '@pmndrs/assets/hdri/city.exr';
import dawn from '@pmndrs/assets/hdri/dawn.exr';
import park from '@pmndrs/assets/hdri/park.exr';
import sunset from '@pmndrs/assets/hdri/sunset.exr';

function CameraController() {
  const { resetCamera, triggerResetCamera, focusTarget, activeModels } = useStore();
  const { camera, controls } = useThree();
  
  // 检测是否为移动端
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);
  
  // 根据人物数量和设备类型计算相机距离
  const getOptimalCameraDistance = () => {
    if (!isMobile) {
      return 3.5; // 桌面端默认距离
    }
    
    // 移动端根据人物数量调整距离
    const modelCount = activeModels.length;
    switch (modelCount) {
      case 0:
        return 3.5;
      case 1:
        return 3.0;
      case 2:
        return 3.8;
      case 3:
        return 4.5;
      default:
        return 3.5;
    }
  };

  useFrame((state, delta) => {
    if (controls) {
      const ctrl = controls as any;
      
      if (resetCamera) {
         // Reset logic (Smooth transition)
         const optimalDistance = getOptimalCameraDistance();
         const targetPos = new THREE.Vector3(0, 0.8, optimalDistance);
         const targetLookAt = new THREE.Vector3(0, 0.8, 0);
         
         camera.position.lerp(targetPos, delta * 2);
         ctrl.target.lerp(targetLookAt, delta * 2);

         // Check if close enough to stop resetting
         if (camera.position.distanceTo(targetPos) < 0.1) {
             useStore.setState({ resetCamera: false });
         }
      } else if (focusTarget) {
         // Focus logic
         const targetLookAt = new THREE.Vector3(...focusTarget);
         // Calculate camera position: move towards target but keep some distance
         // Simple approach: zoom in to z-axis distance 1.0 relative to target
         const targetPos = targetLookAt.clone().add(new THREE.Vector3(0, 0, 1.2)); 
         
         camera.position.lerp(targetPos, delta * 2);
         ctrl.target.lerp(targetLookAt, delta * 2);
      }
    }
  });

  return null;
}

export default function Scene() {
  const { theme, scene, isHovering, isMaximized, activeModels, availableScenes, quality } = useStore();
  const currentScene = availableScenes.find(s => s.id === scene) || availableScenes[0];

  const getDpr = () => {
    switch(quality) {
      case 'low': return 0.5;
      case 'medium': return 0.8;
      case 'high': return 1;
      case 'ultra': return 1.25;
      case 'extreme': return 1.5;
      case 'master': return 1.75;
      case 'god': return 2;
      case 'absolute': return window.devicePixelRatio || 2.5; // Native resolution
      default: return 1;
    }
  };
  const getLightingSetup = () => {
    return (
      <>
        <ambientLight intensity={0.5} />
        <directionalLight 
          position={[10, 10, 5]} 
          intensity={1} 
          castShadow 
          shadow-mapSize={1024}
        />
        {/* Temporarily remove Environment due to network fetch error for HDR */}
        {/* <Environment preset="city" background={false} /> */}
      </>
    );
  };

  return (
    <div 
      className="h-screen w-full relative transition-all duration-700 ease-in-out bg-cover bg-center bg-no-repeat"
      style={{ 
        backgroundColor: currentScene.type === 'color' ? currentScene.value : '#f8fafc',
        backgroundImage: currentScene.type === 'image' ? `url(${currentScene.value})` : 'none',
        cursor: isHovering ? 'pointer' : 'auto' 
      }}
    >
      
      <ErrorBoundary>
        <Canvas 
          dpr={getDpr() as any}
          shadows 
          gl={{ 
            alpha: true,
            preserveDrawingBuffer: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.0,
            outputColorSpace: THREE.SRGBColorSpace
          }}
          camera={{ position: [0, 0.8, 3.5], fov: 40 }}
          className="relative z-10" // Ensure Canvas is above background
          onPointerMissed={() => useStore.getState().setFocusTarget(null)}
          onCreated={({ gl }) => {
            gl.autoClear = true;
          }}
        >
          {getLightingSetup()}

          <Suspense fallback={null}>
            <Detailed distances={[0, 8]}>
              <group>
                {useStore.getState().showCharacters && activeModels.map((model, index) => {
                  let positionOffset: [number, number, number] = [0, 0, 0];
                  
                  if (activeModels.length === 2) {
                    positionOffset = [index === 0 ? -0.6 : 0.6, 0, 0];
                  } else if (activeModels.length === 3) {
                    if (index === 0) positionOffset = [-1.0, 0, 0];
                    if (index === 1) positionOffset = [0, 0, -0.2]; // Middle one slightly back? Or same line
                    if (index === 2) positionOffset = [1.0, 0, 0];
                  }

                  return (
                    <Avatar 
                      key={model.id} 
                      model={model} 
                      positionOffset={positionOffset} 
                    />
                  );
                })}
              </group>
              <group />
            </Detailed>
            <FurnitureRenderer />
            <ScreenshotManager />
          </Suspense>

          <CameraController />

          <OrbitControls
            target={[0, 0.8, 0]}
            enableRotate={false}
            enablePan={false}
            enableZoom={true}
            minDistance={isMaximized ? 0.8 : 1.5}
            maxDistance={isMaximized ? 3 : 5}
          />
          <CameraShake 
             maxYaw={0.02} // Max amount camera can yaw in either direction
             maxPitch={0.02} // Max amount camera can pitch in either direction
             maxRoll={0.02} // Max amount camera can roll in either direction
             yawFrequency={0.2} // Frequency of the yaw rotation
             pitchFrequency={0.2} // Frequency of the pitch rotation
             rollFrequency={0.2} // Frequency of the roll rotation
             intensity={0.5} // initial intensity of the shake
             decay={false} // should the shake decay goes to 0 when no input is given
             decayRate={0.65} // if decay = true this is the rate at which intensity will reduce at
           />
        </Canvas>
        <Particles />
      </ErrorBoundary>
    </div>
  );
}
