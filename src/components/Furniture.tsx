'use client';

import { useMemo, useRef, useState } from 'react';
import { useStore, FurnitureItem } from '@/store/useStore';
import { Box, Cylinder, Cone, Sphere, Torus, TorusKnot, TransformControls } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useSoundManager } from '@/hooks/useSoundManager';

interface FurnitureProps {
  item: FurnitureItem;
}

// 简单的几何体家具模型 - 20种类型
export function Furniture({ item }: FurnitureProps) {
  const { type, position, rotation, scale, id } = item;
  const { 
    isEditMode, 
    updateFurniture, 
    selectedFurnitureId, 
    transformMode, 
    setSelectedFurnitureId,
    setActivePanel 
  } = useStore();
  const groupRef = useRef<THREE.Group>(null);
  const isSelected = selectedFurnitureId === id;
  const { camera, size } = useThree();
  const { playSound } = useSoundManager();
  
  // 家具点击事件处理
  const handleFurnitureClick = (e: any) => {
    e.stopPropagation();
    
    // 播放点击音效
    playSound('click');
    
    // 设置当前选中的家具
    setSelectedFurnitureId(id);
    
    // 弹出家具设置界面
    setActivePanel('furniture');
    
    console.log(`家具 ${type} 被点击，弹出设置界面`);
  };
  
  const furnitureElement = useMemo(() => {
    switch (type) {
      case 'bed':
        return (
          <group>
            {/* Frame */}
            <Box position={[0, 0.15, 0]} scale={[2, 0.3, 1.5]}>
              <meshStandardMaterial color="#8D6E63" />
            </Box>
            {/* Mattress */}
            <Box position={[0, 0.35, 0]} scale={[1.9, 0.2, 1.4]}>
              <meshStandardMaterial color="#FFFFFF" />
            </Box>
            {/* Pillow */}
            <Box position={[-0.7, 0.5, 0]} scale={[0.4, 0.15, 1]} rotation={[0, 0, 0.1]}>
              <meshStandardMaterial color="#E0F2F1" />
            </Box>
            {/* Blanket */}
            <Box position={[0.4, 0.46, 0]} scale={[1.1, 0.05, 1.45]}>
              <meshStandardMaterial color="#FFCCBC" />
            </Box>
          </group>
        );
      case 'sofa':
        return (
          <group>
            {/* Base */}
            <Box position={[0, 0.2, 0]} scale={[2, 0.4, 0.8]}>
              <meshStandardMaterial color="#5D4037" />
            </Box>
            {/* Cushions */}
            <Box position={[0, 0.45, 0]} scale={[1.8, 0.15, 0.7]}>
              <meshStandardMaterial color="#A1887F" />
            </Box>
            {/* Backrest */}
            <Box position={[0, 0.7, -0.3]} scale={[2, 0.6, 0.2]}>
              <meshStandardMaterial color="#5D4037" />
            </Box>
            {/* Armrests */}
            <Box position={[-0.9, 0.5, 0]} scale={[0.2, 0.4, 0.8]}>
              <meshStandardMaterial color="#4E342E" />
            </Box>
            <Box position={[0.9, 0.5, 0]} scale={[0.2, 0.4, 0.8]}>
              <meshStandardMaterial color="#4E342E" />
            </Box>
          </group>
        );
      case 'table':
        return (
          <group>
            {/* 桌面 */}
            <Box position={[0, 0.5, 0]} scale={[1.5, 0.1, 1]}>
              <meshStandardMaterial color="#8B4513" />
            </Box>
            {/* 桌腿 */}
            <Box position={[-0.6, 0.25, -0.4]} scale={[0.1, 0.5, 0.1]}>
              <meshStandardMaterial color="#8B4513" />
            </Box>
            <Box position={[0.6, 0.25, -0.4]} scale={[0.1, 0.5, 0.1]}>
              <meshStandardMaterial color="#8B4513" />
            </Box>
            <Box position={[-0.6, 0.25, 0.4]} scale={[0.1, 0.5, 0.1]}>
              <meshStandardMaterial color="#8B4513" />
            </Box>
            <Box position={[0.6, 0.25, 0.4]} scale={[0.1, 0.5, 0.1]}>
              <meshStandardMaterial color="#8B4513" />
            </Box>
          </group>
        );
      case 'chair':
        return (
          <group>
            {/* 座位 */}
            <Box position={[0, 0.45, 0]} scale={[0.5, 0.1, 0.5]}>
              <meshStandardMaterial color="#8B4513" />
            </Box>
            {/* 靠背 */}
            <Box position={[0, 0.8, -0.2]} scale={[0.5, 0.6, 0.1]}>
              <meshStandardMaterial color="#8B4513" />
            </Box>
            {/* 椅腿 */}
            <Box position={[-0.2, 0.25, -0.2]} scale={[0.05, 0.5, 0.05]}>
              <meshStandardMaterial color="#8B4513" />
            </Box>
            <Box position={[0.2, 0.25, -0.2]} scale={[0.05, 0.5, 0.05]}>
              <meshStandardMaterial color="#8B4513" />
            </Box>
            <Box position={[-0.2, 0.25, 0.2]} scale={[0.05, 0.5, 0.05]}>
              <meshStandardMaterial color="#8B4513" />
            </Box>
            <Box position={[0.2, 0.25, 0.2]} scale={[0.05, 0.5, 0.05]}>
              <meshStandardMaterial color="#8B4513" />
            </Box>
          </group>
        );
      case 'lamp':
        return (
          <group>
            <Cylinder position={[0, 0.2, 0]} args={[0.1, 0.15, 0.2, 16]}>
              <meshStandardMaterial color="#CCCCCC" />
            </Cylinder>
            <Cylinder position={[0, 0.75, 0]} args={[0.02, 0.02, 1, 8]}>
              <meshStandardMaterial color="#AAAAAA" />
            </Cylinder>
            <Cone position={[0, 1.3, 0]} args={[0.3, 0.4, 16]}>
              <meshStandardMaterial color="#FFFFCC" emissive="#FFFF66" emissiveIntensity={0.5} />
            </Cone>
          </group>
        );
      case 'tree':
        return (
          <group>
             <Cylinder position={[0, 0.5, 0]} args={[0.2, 0.3, 1, 8]}>
               <meshStandardMaterial color="#8B4513" />
             </Cylinder>
             <Cone position={[0, 1.5, 0]} args={[1, 2, 8]}>
               <meshStandardMaterial color="#228B22" />
             </Cone>
             <Cone position={[0, 2.5, 0]} args={[0.8, 1.5, 8]}>
               <meshStandardMaterial color="#228B22" />
             </Cone>
          </group>
        );
      case 'bookshelf':
        return (
          <group>
            <Box position={[0, 1, 0]} args={[1.2, 2, 0.4]}>
              <meshStandardMaterial color="#5D4037" />
            </Box>
            {[-0.5, 0, 0.5].map((y, i) => (
              <Box key={i} position={[0, 1 + y, 0.05]} args={[1.1, 0.05, 0.35]}>
                <meshStandardMaterial color="#8D6E63" />
              </Box>
            ))}
          </group>
        );
      case 'rug':
        return (
          <Cylinder position={[0, 0.01, 0]} args={[1, 1, 0.02, 32]}>
             <meshStandardMaterial color="#E0F2F1" />
          </Cylinder>
        );
      case 'tv':
        return (
          <group>
             <Box position={[0, 0.6, 0]} args={[1.2, 0.7, 0.1]}>
               <meshStandardMaterial color="#000000" metalness={0.8} roughness={0.2} />
             </Box>
             <Box position={[0, 0.1, 0]} args={[0.4, 0.2, 0.3]}>
               <meshStandardMaterial color="#212121" />
             </Box>
          </group>
        );
      case 'plant':
         return (
           <group>
             <Cylinder position={[0, 0.2, 0]} args={[0.2, 0.15, 0.4]}>
               <meshStandardMaterial color="#795548" />
             </Cylinder>
             <Sphere position={[0, 0.6, 0]} args={[0.3]}>
               <meshStandardMaterial color="#4CAF50" />
             </Sphere>
           </group>
         );
      case 'clock':
        return (
          <group rotation={[Math.PI/2, 0, 0]}>
             <Cylinder args={[0.3, 0.3, 0.05, 32]}>
               <meshStandardMaterial color="#FFFFFF" />
             </Cylinder>
             <Box position={[0, 0.1, 0.03]} args={[0.02, 0.15, 0.01]}>
               <meshStandardMaterial color="#000000" />
             </Box>
          </group>
        );
      case 'painting':
        return (
          <Box args={[1, 0.8, 0.05]}>
            <meshStandardMaterial color="#FFEB3B" />
          </Box>
        );
      case 'desk':
        return (
          <group>
             <Box position={[0, 0.5, 0]} args={[1.6, 0.05, 0.8]}>
               <meshStandardMaterial color="#5D4037" />
             </Box>
             <Box position={[-0.7, 0.25, 0]} args={[0.1, 0.5, 0.7]}>
               <meshStandardMaterial color="#3E2723" />
             </Box>
             <Box position={[0.7, 0.25, 0]} args={[0.1, 0.5, 0.7]}>
               <meshStandardMaterial color="#3E2723" />
             </Box>
          </group>
        );
      case 'stool':
        return (
          <group>
            <Cylinder position={[0, 0.4, 0]} args={[0.2, 0.2, 0.05]}>
               <meshStandardMaterial color="#8D6E63" />
            </Cylinder>
            <Cylinder position={[0, 0.2, 0]} args={[0.03, 0.03, 0.4]}>
               <meshStandardMaterial color="#5D4037" />
            </Cylinder>
          </group>
        );
      case 'cabinet':
        return (
          <Box position={[0, 0.5, 0]} args={[0.8, 1, 0.5]}>
             <meshStandardMaterial color="#607D8B" />
          </Box>
        );
      case 'mirror':
        return (
           <Box args={[0.6, 1.2, 0.05]}>
             <meshStandardMaterial color="#E3F2FD" metalness={0.9} roughness={0.1} />
           </Box>
        );
      case 'fireplace':
        return (
           <group>
             <Box position={[0, 0.5, 0]} args={[1.5, 1, 0.5]}>
                <meshStandardMaterial color="#3E2723" />
             </Box>
             <Box position={[0, 0.3, 0.26]} args={[0.8, 0.6, 0.01]}>
                <meshStandardMaterial color="#000000" />
             </Box>
           </group>
        );
      case 'piano':
        return (
           <group>
             <Box position={[0, 0.6, 0]} args={[1.8, 0.8, 0.6]}>
                <meshStandardMaterial color="#000000" metalness={0.6} roughness={0.2} />
             </Box>
           </group>
        );
      case 'computer':
        return (
          <group>
             <Box position={[0, 0.3, 0]} args={[0.5, 0.4, 0.05]}>
                <meshStandardMaterial color="#212121" />
             </Box>
             <Box position={[0, 0.05, 0]} args={[0.1, 0.1, 0.1]}>
                <meshStandardMaterial color="#424242" />
             </Box>
          </group>
        );
      case 'cat_bed':
         return (
            <group>
              <Torus position={[0, 0.1, 0]} args={[0.3, 0.1, 16, 32]} rotation={[Math.PI/2, 0, 0]}>
                 <meshStandardMaterial color="#FFAB91" />
              </Torus>
              <Cylinder position={[0, 0.05, 0]} args={[0.28, 0.28, 0.05]}>
                 <meshStandardMaterial color="#FFCCBC" />
              </Cylinder>
            </group>
         );
      case 'bean_bag':
          return (
             <Sphere position={[0, 0.25, 0]} args={[0.4]}>
                <meshStandardMaterial color="#9C27B0" />
             </Sphere>
          );
      default:
        return (
          <Box scale={[0.5, 0.5, 0.5]}>
            <meshStandardMaterial color="gray" />
          </Box>
        );
    }
  }, [type]);

  const content = (
    <group 
      ref={groupRef} 
      position={position} 
      rotation={rotation} 
      scale={scale}
      onClick={handleFurnitureClick}
      onPointerOver={() => {
        // 鼠标悬停效果
        if (groupRef.current) {
          groupRef.current.scale.setScalar(1.05);
        }
      }}
      onPointerOut={() => {
        // 鼠标离开恢复
        if (groupRef.current) {
          groupRef.current.scale.setScalar(1.0);
        }
      }}
    >
      {furnitureElement}
      {isSelected && (
         <group>
           <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} renderOrder={999}>
             <ringGeometry args={[0.8, 0.9, 32]} />
             <meshBasicMaterial color="#00BFFF" toneMapped={false} transparent opacity={0.8} depthTest={false} depthWrite={false} side={THREE.DoubleSide} />
           </mesh>
           <pointLight color="#00BFFF" intensity={2} distance={3} position={[0, 1, 0]} />
           {/* Floating Marker */}
           <mesh position={[0, 1.2, 0]} renderOrder={999}>
             <octahedronGeometry args={[0.1, 0]} />
             <meshBasicMaterial color="#00BFFF" wireframe toneMapped={false} depthTest={false} />
           </mesh>
         </group>
      )}
    </group>
  );

  if (isEditMode && isSelected) {
    return (
      <group>
        <TransformControls
            object={groupRef as React.RefObject<THREE.Object3D>}
            mode={transformMode}
            onObjectChange={(e) => {
                if (groupRef.current) {
                    const p = groupRef.current.position;
                    
                    // Dynamic Boundary Check based on Camera View
                    // Calculate visible width/height at the object's depth
                    const cam = camera as THREE.PerspectiveCamera;
                    if (cam.isPerspectiveCamera) {
                         const dist = Math.abs(cam.position.z - p.z);
                         const vFOV = THREE.MathUtils.degToRad(cam.fov);
                         const visibleHeight = 2 * Math.tan(vFOV / 2) * dist;
                         const visibleWidth = visibleHeight * (size.width / size.height);
                         
                         // Margin to ensure object doesn't go "half outside"
                         // Assuming avg furniture radius ~0.6 + UI padding
                         const MARGIN = 0.6; 
                         
                         const xLimit = Math.max(0, visibleWidth / 2 - MARGIN);
                         // Z limit is harder as it affects dist. clamp Z to reasonable room depth first.
                         const zLimit = 3.5; // Fixed depth limit
                         
                         p.x = Math.max(-xLimit, Math.min(xLimit, p.x));
                         p.z = Math.max(-zLimit, Math.min(zLimit, p.z));
                    } else {
                         // Fallback for non-perspective (unlikely)
                         const BOUNDARY = 2.5;
                         p.x = Math.max(-BOUNDARY, Math.min(BOUNDARY, p.x));
                         p.z = Math.max(-BOUNDARY, Math.min(BOUNDARY, p.z));
                    }

                    const r = groupRef.current.rotation;
                    const s = groupRef.current.scale;
                    updateFurniture(id, {
                        position: [p.x, p.y, p.z],
                        rotation: [r.x, r.y, r.z],
                        scale: [s.x, s.y, s.z]
                    });
                }
            }}
        />
        {content}
      </group>
    );
  }

  return content;
}

export function FurnitureRenderer() {
  const { furniture, scene } = useStore();
  // Show all furniture regardless of scene for now, or just current scene if user wants separation.
  // The store defaults to 'bedroom', and user asked for 20 furniture types.
  // I'll keep the scene filtering logic.
  const currentSceneFurniture = furniture.filter(f => f.scene === scene);
  
  return (
    <group>
      {currentSceneFurniture.map(item => (
        <Furniture key={item.id} item={item} />
      ))}
    </group>
  );
}
