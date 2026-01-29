'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { INTERACTION_CONFIG } from '@/config';
import * as THREE from 'three';
import { VRM } from '@pixiv/three-vrm';
import { useSoundManager, SoundType } from '@/hooks/useSoundManager';
import { useThree } from '@react-three/fiber';
import { useViewportBoundary } from '@/hooks/useViewportBoundary';
import { useAdvancedInteractionEngine } from '@/hooks/useAdvancedInteractionEngine';

type HitFeedback = { part: string; time: number } | null;
type SpringState = { position: THREE.Vector3; velocity: THREE.Vector3 };

export const useInteractionManagerEnhanced = (vrm: VRM | null) => {
  const particleTimeRef = useRef(0);
  const rubTimeRef = useRef(0);
  
  const { 
    setTargetBodyPart, 
    addAffection, 
    setAction, 
    setFocusTarget, 
    triggerParticles, 
    setEmotion, 
    addMessage, 
    affection,
    updateInteractionHistory,
    interactionHistory,
    setPersonality,
    personality,
    incrementTaskProgress,
    setAvatarBounce,
    avatarBounce
  } = useStore();
  
  const { size, camera } = useThree();
  
  // 高级交互引擎
  const { handleInteraction, getInteractionSuggestions } = useAdvancedInteractionEngine();
  
  // 添加边界约束系统
  const { constrainPosition, checkBoundary } = useViewportBoundary(
    { size, camera: null as any },
    {
      margin: 0.4,
      enableX: true,
      enableZ: true,
      bounceEffect: false // 交互管理器自己处理反弹
    }
  );
  const [hitFeedback, setHitFeedback] = useState<HitFeedback>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggered = useRef(false);
  const downPartTarget = useRef<string | null>(null);
  const downHitPoint = useRef<THREE.Vector3 | null>(null);
  const downScreen = useRef<{ x: number; y: number } | null>(null);
  
  // 桌宠化物理系统
  const springState = useRef<SpringState>({
    position: new THREE.Vector3(0, 0, 0),
    velocity: new THREE.Vector3(0, 0, 0)
  });
  
  const bounceState = useRef({
    isBouncing: false,
    bounceForce: 0,
    bounceDirection: new THREE.Vector3(0, 1, 0),
    bounceTime: 0
  });
  
  const rubTrail = useRef<Array<{position: THREE.Vector3, time: number}>>([]);
  const doubleClickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clickCount = useRef(0);
  
  // 桌宠化音效库
  const PET_SOUNDS: Record<string, SoundType[]> = {
    happy: ['pop', 'cute', 'greeting'],
    shy: ['click', 'notification'],
    angry: ['error', 'click'],
    surprise: ['pop', 'notification'],
    bounce: ['pop', 'click'],
    rub: ['click', 'pop']
  };

  // 桌宠化行为配置
  const PET_BEHAVIORS = {
    // 弹跳配置
    bounce: {
      force: 0.3,
      damping: 0.8,
      gravity: -0.05
    },
    // 摇晃配置
    shake: {
      intensity: 0.1,
      frequency: 10
    },
    // 抚摸配置
    rub: {
      trailLength: 10,
      particleInterval: 0.1
    }
  };

  // 部位特定桌宠反应
  const PET_REACTIONS = {
    head: {
      bounce: 0.8,
      sound: 'happy',
      emotion: 'happy',
      action: 'nod',
      particles: 'heart'
    },
    cheek: {
      bounce: 0.3,
      sound: 'shy',
      emotion: 'shy',
      action: 'shy_pose',
      particles: 'sparkle'
    },
    chest: {
      bounce: 0.5,
      sound: 'surprise',
      emotion: 'surprised',
      action: 'surprised_pose',
      particles: 'star'
    },
    hand: {
      bounce: 0.2,
      sound: 'happy',
      emotion: 'happy',
      action: 'wave',
      particles: 'circle'
    },
    belly: {
      bounce: 0.6,
      sound: 'bounce',
      emotion: 'laugh',
      action: 'laugh',
      particles: 'heart'
    }
  };

  const { playSound } = useSoundManager();

  // 弹簧物理系统
  const updateSpringPhysics = useCallback((delta: number) => {
    if (!vrm || !bounceState.current.isBouncing) return;
    
    const { force, damping, gravity } = PET_BEHAVIORS.bounce;
    const state = bounceState.current;
    
    // 应用重力
    state.bounceForce += gravity * delta;
    
    // 更新位置
    springState.current.velocity.add(state.bounceDirection.clone().multiplyScalar(state.bounceForce));
    springState.current.position.add(springState.current.velocity.clone().multiplyScalar(delta));
    
    // 应用阻尼
    springState.current.velocity.multiplyScalar(damping);
    state.bounceForce *= damping;
    
    // 边界碰撞检测
    const boundaryState = checkBoundary(springState.current.position);
    if (boundaryState.isOutOfBounds) {
      // 边界反弹效果
      springState.current.velocity.add(boundaryState.boundaryForce.multiplyScalar(0.5));
      springState.current.position.add(boundaryState.boundaryForce.multiplyScalar(0.1));
      
      // 确保位置在边界内
      const constrainedPosition = constrainPosition(springState.current.position);
      springState.current.position.copy(constrainedPosition);
    }
    
    // 地面碰撞检测
    if (springState.current.position.y < 0) {
      springState.current.position.y = 0;
      springState.current.velocity.y *= -0.7; // 反弹
      state.bounceForce *= 0.5;
      
      // 停止弹跳
      if (Math.abs(springState.current.velocity.y) < 0.01) {
        state.isBouncing = false;
        state.bounceForce = 0;
        springState.current.position.set(0, 0, 0);
        springState.current.velocity.set(0, 0, 0);
      }
    }
    
    // 更新全局弹跳状态
    setAvatarBounce({
      position: [springState.current.position.x, springState.current.position.y, springState.current.position.z],
      rotation: [0, 0, 0],
      scale: 1 + Math.abs(springState.current.position.y) * 0.1
    });
    
    state.bounceTime += delta;
  }, [vrm, setAvatarBounce, checkBoundary, constrainPosition]);

  // 触发弹跳效果
  const triggerBounce = useCallback((force: number, direction: THREE.Vector3 = new THREE.Vector3(0, 1, 0)) => {
    bounceState.current.isBouncing = true;
    bounceState.current.bounceForce = force;
    bounceState.current.bounceDirection.copy(direction.normalize());
    bounceState.current.bounceTime = 0;
    
    // 播放弹跳音效
    const sounds = PET_SOUNDS.bounce;
    playSound(sounds[Math.floor(Math.random() * sounds.length)]);
  }, [playSound]);

  // 桌宠化点击处理
  const handlePetClick = useCallback((e: any) => {
    e.stopPropagation();
    
    // 双击检测
    clickCount.current++;
    if (clickCount.current === 1) {
      doubleClickTimer.current = setTimeout(() => {
        clickCount.current = 0;
      }, 300);
    } else if (clickCount.current === 2) {
      if (doubleClickTimer.current) {
        clearTimeout(doubleClickTimer.current);
      }
      handleDoubleClick(e);
      clickCount.current = 0;
      return;
    }

    const hitPoint = e.point;
    const hitName = e.object.name.toLowerCase();
    
    // 使用高级交互引擎处理触摸交互
    const interaction = {
      type: 'touch' as const,
      position: hitPoint,
      intensity: 0.8, // 中等强度
      timestamp: Date.now()
    };
    handleInteraction(interaction);
    
    // 视觉反馈
    triggerParticles({ 
        x: (e.pointer.x + 1) / 2 * size.width, 
        y: -(e.pointer.y - 1) / 2 * size.height, 
        type: 'heart' 
    });

    playSound('pop');
    setHitFeedback({ part: hitName, time: 0 });

    const partConfig = INTERACTION_CONFIG.BODY_PARTS.find(part => hitName.includes(part.name));
    
    if (partConfig) {
      // 桌宠化反应
      const reaction = PET_REACTIONS[partConfig.name as keyof typeof PET_REACTIONS] || PET_REACTIONS.head;
      
      // 触发弹跳
      const bounceForce = reaction.bounce * (1 + affection / 100); // 好感度影响弹跳力度
      const bounceDirection = new THREE.Vector3(
        (Math.random() - 0.5) * 0.2, // 随机水平方向
        1, // 主要向上
        (Math.random() - 0.5) * 0.1
      );
      
      triggerBounce(bounceForce, bounceDirection);
      
      // 播放部位特定音效
      const sounds = PET_SOUNDS[reaction.sound as keyof typeof PET_SOUNDS];
      if (sounds) {
        playSound(sounds[Math.floor(Math.random() * sounds.length)]);
      }
      
      // 设置表情和动作
      setEmotion(reaction.emotion as any);
      setAction(reaction.action as any);
      
      // 触发粒子效果
      triggerParticles({ 
        x: (e.pointer.x + 1) / 2 * size.width, 
        y: -(e.pointer.y - 1) / 2 * size.height, 
        type: reaction.particles as any
      });
      
      // 好感度系统
      let affectionValue = INTERACTION_CONFIG.AFFECTION_VALUES[partConfig.target as keyof typeof INTERACTION_CONFIG.AFFECTION_VALUES] || 0;
      addAffection(affectionValue);
      
      setTargetBodyPart(partConfig.target);
      
      // 聚焦逻辑
      if (['head', 'face', 'chest', 'neck'].some(k => partConfig.name.includes(k))) {
        setFocusTarget([hitPoint.x, hitPoint.y, hitPoint.z]);
      }
      
      incrementTaskProgress('pat', 1);
    }
  }, [affection, playSound, setEmotion, setAction, triggerParticles, addAffection, setTargetBodyPart, setFocusTarget, incrementTaskProgress, triggerBounce, handleInteraction]);

  // 双击特殊交互
  const handleDoubleClick = useCallback((e: any) => {
    const hitName = e.object.name.toLowerCase();
    const partConfig = INTERACTION_CONFIG.BODY_PARTS.find(part => hitName.includes(part.name));
    
    if (partConfig) {
      // 双击触发特殊动作
      const specialActions = ['dance', 'jump', 'wave', 'victory'];
      const randomAction = specialActions[Math.floor(Math.random() * specialActions.length)];
      
      setAction(randomAction as any);
      setEmotion('excited');
      
      // 强力弹跳
      triggerBounce(0.8, new THREE.Vector3(0, 1, 0));
      
      // 大量粒子效果
      triggerParticles({ 
        x: (e.pointer.x + 1) / 2 * size.width, 
        y: -(e.pointer.y - 1) / 2 * size.height, 
        type: 'star' as any
      });
      
      playSound('cute');
      addAffection(5); // 双击额外好感度
    }
  }, [setAction, setEmotion, triggerBounce, triggerParticles, playSound, addAffection, size]);

  // 高级抚摸系统
  const handlePetRub = useCallback((e: any, delta: number) => {
    if (!e.object.name) return;
    
    const hitPoint = e.point;
    const currentTime = Date.now();
    
    // 添加抚摸轨迹点
    rubTrail.current.push({
      position: hitPoint.clone(),
      time: currentTime
    });
    
    // 限制轨迹长度
    if (rubTrail.current.length > PET_BEHAVIORS.rub.trailLength) {
      rubTrail.current.shift();
    }
    
    // 移除过期轨迹点
    rubTrail.current = rubTrail.current.filter(point => 
      currentTime - point.time < 2000
    );
    
    // 粒子效果
    particleTimeRef.current += delta;
    if (particleTimeRef.current >= PET_BEHAVIORS.rub.particleInterval) {
      triggerParticles({ 
        x: (e.pointer.x + 1) / 2 * size.width, 
        y: -(e.pointer.y - 1) / 2 * size.height, 
        type: 'sparkle' as any
      });
      particleTimeRef.current = 0;
    }
    
    // 抚摸音效
    if (Math.random() < 0.1) {
      const sounds = PET_SOUNDS.rub;
      playSound(sounds[Math.floor(Math.random() * sounds.length)]);
    }
    
    // 连续抚摸奖励
    rubTimeRef.current += delta;
    if (rubTimeRef.current > 2) {
      addAffection(1);
      rubTimeRef.current = 0;
      
      // 长时间抚摸特殊反应
      if (Math.random() < 0.3) {
        setEmotion('happy');
        setAction('nod');
        triggerParticles({ 
          x: (e.pointer.x + 1) / 2 * size.width, 
          y: -(e.pointer.y - 1) / 2 * size.height, 
          type: 'heart' as any
        });
      }
    }
  }, [triggerParticles, playSound, addAffection, setEmotion, setAction, size]);

  // 长按交互
  const handleLongPress = useCallback((e: any) => {
    const hitName = e.object.name.toLowerCase();
    const partConfig = INTERACTION_CONFIG.BODY_PARTS.find(part => hitName.includes(part.name));
    
    if (partConfig) {
      // 长按特殊交互
      setEmotion('love');
      setAction('shy_pose');
      
      // 爱心爆炸效果
      triggerParticles({ 
        x: (e.pointer.x + 1) / 2 * size.width, 
        y: -(e.pointer.y - 1) / 2 * size.height, 
        type: 'heart' as any
      });
      
      playSound('cute');
      addAffection(10); // 长按大幅增加好感度
    }
  }, [setEmotion, setAction, triggerParticles, playSound, addAffection, size]);

  // 更新函数
  const updateHitFeedback = useCallback((delta: number) => {
    if (hitFeedback) {
      setHitFeedback(prev => prev ? { ...prev, time: prev.time + delta } : null);
      if (hitFeedback.time > 0.5) {
        setHitFeedback(null);
      }
    }
  }, [hitFeedback]);

  const updateRubbing = useCallback((delta: number) => {
    // 清理过期抚摸轨迹
    const currentTime = Date.now();
    rubTrail.current = rubTrail.current.filter(point => 
      currentTime - point.time < 1000
    );
  }, []);

  // 帧更新
  useCallback((delta: number) => {
    updateSpringPhysics(delta);
    updateHitFeedback(delta);
    updateRubbing(delta);
  }, [updateSpringPhysics, updateHitFeedback, updateRubbing]);

  return {
    handleClick: handlePetClick,
    handlePointerDown: (e: any) => {
      downPartTarget.current = e.object.name;
      downHitPoint.current = e.point.clone();
      downScreen.current = { x: e.pointer.x, y: e.pointer.y };
      
      // 开始长按计时
      longPressTimer.current = setTimeout(() => {
        longPressTriggered.current = true;
        handleLongPress(e);
      }, 800);
    },
    handlePointerUp: () => {
      downPartTarget.current = null;
      downHitPoint.current = null;
      downScreen.current = null;
      longPressTriggered.current = false;
      clearLongPress();
    },
    handlePointerMove: (e: any) => {
      if (downPartTarget.current && downHitPoint.current) {
        handlePetRub(e, 0.016); // 假设 60fps
      }
    },
    updateHitFeedback,
    updateRubbing,
    bounceState: avatarBounce
  };

  function clearLongPress() {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }
};

export default useInteractionManagerEnhanced;