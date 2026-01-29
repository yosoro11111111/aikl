'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three-stdlib';
import { VRMLoaderPlugin, VRMUtils, VRM, VRMHumanBoneName } from '@pixiv/three-vrm';
import * as THREE from 'three';
import { useStore } from '@/store/useStore';
import { Sphere, PivotControls } from '@react-three/drei';
import { useInteractionManagerEnhanced } from '@/hooks/useInteractionManagerEnhanced';
import { useAnimationManager } from '@/hooks/useAnimationManager';
import { useFaceExpression } from '@/hooks/useFaceExpression';
import { useIdleBehavior } from '@/hooks/useIdleBehavior';
import { useShyBehavior } from '@/hooks/useShyBehavior';
import { useHandInteraction } from '@/hooks/useHandInteraction';
import { useAudioLipSync } from '@/hooks/useAudioLipSync';
import { useAvatarMovement } from '@/hooks/useAvatarMovement';
import { VRMSpringBoneCollider, VRMSpringBoneColliderShapeSphere } from '@pixiv/three-vrm';
import { useThree } from '@react-three/fiber';
import { useViewportBoundary } from '@/hooks/useViewportBoundary';
import { useActionAdapter } from '@/hooks/useActionAdapter';

import { ModelConfig } from '@/store/useStore';

interface AvatarProps {
  model: ModelConfig;
  positionOffset: [number, number, number];
}

export function Avatar({ model, positionOffset }: AvatarProps) {
  const { isMaximized, setIsHovering, isEditMode, modelPositions, updateModelPosition, interactionState } = useStore();
  const [vrm, setVrm] = useState<VRM | null>(null);
  const fallbackSceneRef = useRef<THREE.Group>(new THREE.Group());
  const mouseColliderRef = useRef<THREE.Object3D>(new THREE.Object3D());
  const pointerDownPos = useRef<THREE.Vector2 | null>(null);
  const dragPlane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
  const dragPoint = useRef(new THREE.Vector3());
  const dragTarget = useRef(new THREE.Vector3());
  
  // Use saved position if available, otherwise use calculated offset
  const savedPos = modelPositions[model.id];
  const initialPosition = savedPos ? new THREE.Vector3(...savedPos) : new THREE.Vector3(...positionOffset);
  
  // Apply Y offset for default positioning (if not saved)
  if (!savedPos) {
      initialPosition.y += isMaximized ? -2.8 : -2.0;
  }

  // 预加载逻辑：使用 useLoader 自动处理缓存和加载状态
  const gltf = useLoader(GLTFLoader, model.url || '', (loader) => {
    loader.register((parser) => new VRMLoaderPlugin(parser as any) as any);
  });

  const scene = gltf.scene;

  useEffect(() => {
    if (!gltf || !gltf.userData.vrm) return;

    const vrmInstance = gltf.userData.vrm as VRM;
    const mouseColliderNode = mouseColliderRef.current;
    let collider: VRMSpringBoneCollider | null = null;

    VRMUtils.removeUnnecessaryVertices(gltf.scene);
    VRMUtils.combineSkeletons(gltf.scene);
    
    vrmInstance.scene.traverse((obj) => {
      obj.frustumCulled = false;
      obj.castShadow = true;
    });
    vrmInstance.scene.rotation.y = Math.PI;

    if (vrmInstance.humanoid) {
        // 设置手臂初始姿势
        const leftArm = vrmInstance.humanoid.getNormalizedBoneNode('leftUpperArm');
        const rightArm = vrmInstance.humanoid.getNormalizedBoneNode('rightUpperArm');
        if (leftArm) {
            leftArm.rotation.z = Math.PI / 2.5;
            leftArm.rotation.y = 0.1;
        }
        if (rightArm) {
            rightArm.rotation.z = -Math.PI / 2.5;
            rightArm.rotation.y = -0.1;
        }

        // --- 鼠标交互物理碰撞球 ---
        // 确保 colliderNode 在场景中 (添加一次即可)
        gltf.scene.add(mouseColliderNode);

        const colliderShape = new VRMSpringBoneColliderShapeSphere();
        colliderShape.radius = 0.1; 
        collider = new VRMSpringBoneCollider(colliderShape);
        mouseColliderNode.add(collider);

        // 将碰撞球添加到所有 SpringBone 组中
        if (vrmInstance.springBoneManager) {
            vrmInstance.springBoneManager.colliderGroups.forEach(group => {
                 group.colliders.push(collider!);
            });
        }
        
        // Add pointer events to all meshes
        // vrmInstance.scene.traverse((obj) => {
        //    if (obj.type === 'Mesh' || obj.type === 'SkinnedMesh') {
        //        // Handled by parent primitive
        //    }
        // });

        // 全身碰撞箱配置
        const HITBOX_CONFIG = [
          { bone: 'head', size: [0.25, 0.3, 0.25], name: 'head', offset: [0, 0.05, 0] },
          { bone: 'neck', size: [0.1, 0.1, 0.1], name: 'neck', offset: [0, 0.05, 0] },
          { bone: 'chest', size: [0.25, 0.2, 0.2], name: 'chest', offset: [0, 0, 0] },
          { bone: 'spine', size: [0.25, 0.25, 0.2], name: 'belly', offset: [0, 0.05, 0] }, 
          { bone: 'hips', size: [0.3, 0.25, 0.25], name: 'hips', offset: [0, 0, 0] },
          { bone: 'leftUpperArm', size: [0.1, 0.3, 0.1], name: 'arm', offset: [0, 0.15, 0] },
          { bone: 'rightUpperArm', size: [0.1, 0.3, 0.1], name: 'arm', offset: [0, 0.15, 0] },
          { bone: 'leftLowerArm', size: [0.08, 0.25, 0.08], name: 'arm', offset: [0, 0.12, 0] },
          { bone: 'rightLowerArm', size: [0.08, 0.25, 0.08], name: 'arm', offset: [0, 0.12, 0] },
          { bone: 'leftHand', size: [0.1, 0.15, 0.05], name: 'hand', offset: [0, 0.05, 0] },
          { bone: 'rightHand', size: [0.1, 0.15, 0.05], name: 'hand', offset: [0, 0.05, 0] },
          { bone: 'leftUpperLeg', size: [0.15, 0.4, 0.15], name: 'leg', offset: [0, 0.2, 0] },
          { bone: 'rightUpperLeg', size: [0.15, 0.4, 0.15], name: 'leg', offset: [0, 0.2, 0] },
          { bone: 'leftLowerLeg', size: [0.12, 0.4, 0.12], name: 'leg', offset: [0, 0.2, 0] },
          { bone: 'rightLowerLeg', size: [0.12, 0.4, 0.12], name: 'leg', offset: [0, 0.2, 0] },
          { bone: 'leftFoot', size: [0.1, 0.1, 0.2], name: 'foot', offset: [0, 0.05, 0.05] },
          { bone: 'rightFoot', size: [0.1, 0.1, 0.2], name: 'foot', offset: [0, 0.05, 0.05] },
        ];

        // 批量创建并附加碰撞箱
        HITBOX_CONFIG.forEach(config => {
            const bone = vrmInstance.humanoid.getNormalizedBoneNode(config.bone as VRMHumanBoneName);
            if (bone) {
                // 检查是否已经存在碰撞箱，避免重复添加
                if (!bone.getObjectByName(config.name)) {
                    const geometry = new THREE.BoxGeometry(...config.size);
                    const material = new THREE.MeshBasicMaterial({ visible: false }); // 隐形碰撞箱
                    const hitbox = new THREE.Mesh(geometry, material);
                    hitbox.name = config.name; // 映射到 config.ts 中的 BODY_PARTS
                    if (config.offset) {
                        hitbox.position.set(...config.offset as [number, number, number]);
                    }
                    bone.add(hitbox);
                }
            }
        });
    }

    setVrm(vrmInstance);

    // 清理函数
    return () => {
        // 移除鼠标碰撞球
        gltf.scene.remove(mouseColliderNode);
        
        // 从 SpringBone 组中移除碰撞器
        if (vrmInstance.springBoneManager && collider) {
            vrmInstance.springBoneManager.colliderGroups.forEach(group => {
                const index = group.colliders.indexOf(collider!);
                if (index !== -1) {
                    group.colliders.splice(index, 1);
                }
            });
        }
    };
  }, [gltf]);

  const { 
    handleClick, 
    handlePointerDown,
    handlePointerUp,
    handlePointerMove, 
    updateHitFeedback,
    updateRubbing,
    bounceState
  } = useInteractionManagerEnhanced(vrm);
  
  useAnimationManager(vrm, model.id);
  useFaceExpression(vrm);
  useIdleBehavior(vrm);
  useShyBehavior(vrm);
  useHandInteraction(vrm);
  const { startAudio, stopAudio, isListening } = useAudioLipSync(vrm);
  
  // 动作适配器 - 自动分析VRM文件并适配特殊动作
  const { adapterConfig, triggerRandomAction, triggerEmotionBasedAction } = useActionAdapter(
    vrm, 
    model.id, 
    model.url?.split('/').pop() || model.name + '.vrm'
  );
  
  // --- 拖拽逻辑 ---
  const groupRef = useRef<THREE.Group>(null);
  
  // Apply initial position only when not interacting
  useEffect(() => {
    if (groupRef.current && !interactionState.isInteracting) {
        groupRef.current.position.copy(initialPosition);
    }
  }, [initialPosition.x, initialPosition.y, initialPosition.z, interactionState.isInteracting]);

  // Avatar movement for interactions
  useAvatarMovement(groupRef, model.id);

  const { size, viewport, camera } = useThree();
  
  // 添加边界约束系统
  const { constrainPosition, checkBoundary, applyBoundaryForce } = useViewportBoundary(
    { size, camera },
    {
      margin: 0.3,
      enableX: true,
      enableZ: true,
      bounceEffect: true
    }
  );
  
  const handleModelPointerDown = (e: any) => {
    e.stopPropagation();
    pointerDownPos.current = e.pointer?.clone?.() ?? new THREE.Vector2(e.pointer.x, e.pointer.y);

    // 直接进入“抚摸/按压”逻辑
    handlePointerDown(e);
  };

  const handleGlobalPointerUp = () => {
    pointerDownPos.current = null;
    handlePointerUp();
  };

  const handleGlobalPointerMove = (e: any) => {
      // 只处理抚摸逻辑
      handlePointerMove(e);
  };
  
  // 眼神/头部跟随逻辑
  useFrame((state, delta) => {
    if (vrm) {
      updateRubbing(delta);
      updateHitFeedback(delta);
      
      // --- 触摸交互更新 ---
      if (!isEditMode && !interactionState.isInteracting && groupRef.current) {
           // Return to resting position (saved or default)
           const targetPos = savedPos ? new THREE.Vector3(...savedPos) : new THREE.Vector3(...positionOffset);
           if (!savedPos) {
               targetPos.y += isMaximized ? -2.8 : -2.0;
           }
           
           // 确保目标位置在边界内
           const constrainedTargetPos = constrainPosition(targetPos);
           
           // 只在非编辑模式下应用位置平滑 (防止跳动)
           // 如果已经在位置上，就不需要 lerp 了，节省性能
           if (groupRef.current.position.distanceTo(constrainedTargetPos) > 0.01) {
                groupRef.current.position.lerp(constrainedTargetPos, delta * 5);
           }
           
           // 确保旋转归零
           groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, 0, delta * 5);
           groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, 0, delta * 5);
      }
      
      // 应用边界约束和反弹效果
      if (groupRef.current && !isEditMode) {
        const boundaryState = checkBoundary(groupRef.current.position);
        if (boundaryState.isOutOfBounds) {
          // 应用边界反弹力
          const velocity = new THREE.Vector3(0, 0, 0);
          const adjustedVelocity = applyBoundaryForce(velocity, delta);
          groupRef.current.position.add(adjustedVelocity);
          
          // 确保最终位置在边界内
          const finalPosition = constrainPosition(groupRef.current.position);
          groupRef.current.position.copy(finalPosition);
        }
      }

      // 更新物理碰撞球位置 (鼠标位置 -> 世界空间)
      // 需要考虑模型自身的 scale 和 position
      const mouseX = state.pointer.x * 2; // 稍微扩大范围
      const mouseY = state.pointer.y * 2;
      
      // 这里需要根据相机和模型位置计算出正确的 3D 坐标
      // 简单起见，我们根据鼠标在屏幕上的相对位置映射
      mouseColliderRef.current.position.set(
        state.pointer.x * 1.5, 
        (state.pointer.y * 1.5) + 1.2, // 对应角色高度
        0.5 // 稍微靠前
      );

      // 更新 VRM 内部组件（物理、表情等）
      vrm.update(delta);

      // 简单的头部跟随相机 (用户视角)
      if (vrm.lookAt) {
          vrm.lookAt.lookAt(state.camera.position);
      }
    }
  });

  // 如果没有 URL，显示 fallback
  if (!model.url) {
     return (
        <primitive 
          object={fallbackSceneRef.current} 
        />
     );
  }

  const scale = isMaximized ? 2.8 : 2.0;

  return (
    <PivotControls
        enabled={isEditMode}
        visible={isEditMode}
        scale={1.5}
        anchor={[0, 0, 0]}
        onDragEnd={() => {
            if (groupRef.current) {
                const { x, y, z } = groupRef.current.position;
                
                // Dynamic Boundary Check based on Camera View
                const cam = camera as THREE.PerspectiveCamera;
                let cx = x;
                let cz = z;

                if (cam.isPerspectiveCamera) {
                    const dist = Math.abs(cam.position.z - z);
                    const vFOV = THREE.MathUtils.degToRad(cam.fov);
                    const visibleHeight = 2 * Math.tan(vFOV / 2) * dist;
                    const visibleWidth = visibleHeight * (size.width / size.height);
                    
                    const MARGIN = 0.4; // Avatar is smaller
                    const xLimit = Math.max(0, visibleWidth / 2 - MARGIN);
                    const zLimit = 3.5;
                    
                    cx = Math.max(-xLimit, Math.min(xLimit, x));
                    cz = Math.max(-zLimit, Math.min(zLimit, z));
                } else {
                    const BOUNDARY = 2.5;
                    cx = Math.max(-BOUNDARY, Math.min(BOUNDARY, x));
                    cz = Math.max(-BOUNDARY, Math.min(BOUNDARY, z));
                }

                updateModelPosition(model.id, [cx, y, cz]);
            }
        }}
    >
        <group ref={groupRef} scale={scale}>
        <primitive 
            object={scene} 
            onPointerDown={(e: any) => { if (!isEditMode) handleModelPointerDown(e); }}
            onPointerUp={handleGlobalPointerUp}
            onPointerMove={handleGlobalPointerMove}
            onClick={handleClick}
            onDoubleClick={startAudio}
            onPointerOver={() => setIsHovering(true)}
            onPointerOut={() => { setIsHovering(false); handleGlobalPointerUp(); }}
            onPointerCancel={handleGlobalPointerUp}
        />
        </group>
    </PivotControls>
  );
}
