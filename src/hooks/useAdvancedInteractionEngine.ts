'use client';

import { useCallback, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useStore, Action } from '@/store/useStore';
import { useAdvancedPhysics } from '@/hooks/useAdvancedPhysics';
import { useEmotionDetection } from '@/hooks/useEmotionDetection';

// 交互引擎配置
const INTERACTION_CONFIG = {
  // 智能行为配置
  autoInteractionInterval: 30000, // 自动交互间隔（毫秒）
  emotionResponseDelay: 2000, // 情感响应延迟
  proximityThreshold: 2.0, // 接近阈值（米）
  
  // 物理交互配置
  touchForce: 5.0, // 触摸力大小
  petForce: 3.0, // 抚摸力大小
  bounceForce: 8.0, // 弹跳力大小
  
  // AI行为配置
  aiBehaviorProbability: 0.3, // AI自主行为概率
  interactionCooldown: 5000, // 交互冷却时间
};

// 交互类型
interface Interaction {
  type: 'touch' | 'pet' | 'drag' | 'bounce' | 'talk' | 'auto';
  position: THREE.Vector3;
  intensity: number; // 0-1 的强度
  emotion?: string; // 关联情感
  timestamp: number;
}

// 智能行为
interface SmartBehavior {
  id: string;
  type: 'idle' | 'explore' | 'follow' | 'play' | 'rest';
  priority: number; // 1-10 优先级
  duration: number; // 持续时间（毫秒）
  conditions: {
    timeOfDay?: string; // 时间段
    emotion?: string; // 情感条件
    proximity?: number; // 接近条件
  };
}

export const useAdvancedInteractionEngine = () => {
  const {
    activeModels,
    setAction,
    setEmotion,
    setFocusTarget,
    addAffection,
    triggerParticles,
    interactionHistory,
    updateInteractionHistory,
    personality
  } = useStore();

  const physics = useAdvancedPhysics();
  const { detectEmotion, getEmotionAction } = useEmotionDetection();
  
  const interactionQueue = useRef<Interaction[]>([]);
  const lastInteractionTime = useRef<number>(0);
  const behaviorTimer = useRef<NodeJS.Timeout | null>(null);
  const currentBehavior = useRef<SmartBehavior | null>(null);

  // 智能行为库
  const smartBehaviors: SmartBehavior[] = [
    {
      id: 'idle_look_around',
      type: 'idle',
      priority: 1,
      duration: 8000,
      conditions: { timeOfDay: 'any' }
    },
    {
      id: 'explore_room',
      type: 'explore',
      priority: 3,
      duration: 15000,
      conditions: { timeOfDay: 'day' }
    },
    {
      id: 'follow_cursor',
      type: 'follow',
      priority: 5,
      duration: 10000,
      conditions: { proximity: 0.5 }
    },
    {
      id: 'play_jump',
      type: 'play',
      priority: 4,
      duration: 5000,
      conditions: { emotion: 'happy' }
    },
    {
      id: 'rest_sit',
      type: 'rest',
      priority: 2,
      duration: 12000,
      conditions: { timeOfDay: 'evening' }
    }
  ];

  // 处理交互
  const handleInteraction = useCallback((interaction: Interaction) => {
    // 添加到交互队列
    interactionQueue.current.push(interaction);
    lastInteractionTime.current = Date.now();

    // 根据交互类型处理
    switch (interaction.type) {
      case 'touch':
        handleTouchInteraction(interaction);
        break;
      case 'pet':
        handlePetInteraction(interaction);
        break;
      case 'drag':
        handleDragInteraction(interaction);
        break;
      case 'bounce':
        handleBounceInteraction(interaction);
        break;
      case 'talk':
        handleTalkInteraction(interaction);
        break;
      case 'auto':
        handleAutoInteraction(interaction);
        break;
    }

    // 更新交互历史
    const interactionType = interaction.type === 'pet' || interaction.type === 'touch' ? 'touchy' : 
                           interaction.type === 'talk' ? 'nice' : 'mean';
    updateInteractionHistory(interactionType);
  }, [updateInteractionHistory]);

  // 触摸交互处理
  const handleTouchInteraction = useCallback((interaction: Interaction) => {
    const force = new THREE.Vector3(
      (Math.random() - 0.5) * INTERACTION_CONFIG.touchForce,
      INTERACTION_CONFIG.touchForce * 0.5,
      (Math.random() - 0.5) * INTERACTION_CONFIG.touchForce
    );

    // 应用物理力
    activeModels.forEach(model => {
      physics.applyForce(model.id, force);
    });

    // 情感响应
    setEmotion('surprised');
    setAction('surprised_pose');
    triggerParticles({ type: 'sparkle', x: interaction.position.x, y: interaction.position.y });
    
    // 增加亲密度
    addAffection(5 * interaction.intensity);
  }, [activeModels, physics, setEmotion, setAction, triggerParticles, addAffection]);

  // 抚摸交互处理
  const handlePetInteraction = useCallback((interaction: Interaction) => {
    const force = new THREE.Vector3(
      0,
      INTERACTION_CONFIG.petForce * interaction.intensity,
      0
    );

    // 应用轻柔的力
    activeModels.forEach(model => {
      physics.applyForce(model.id, force);
    });

    // 情感响应
    setEmotion('happy');
    setAction('nod');
    triggerParticles({ type: 'heart', x: interaction.position.x, y: interaction.position.y });
    
    // 增加更多亲密度
    addAffection(10 * interaction.intensity);
  }, [activeModels, physics, setEmotion, setAction, triggerParticles, addAffection]);

  // 拖拽交互处理
  const handleDragInteraction = useCallback((interaction: Interaction) => {
    // 计算拖拽方向
    const dragDirection = interaction.position.clone().normalize();
    const force = dragDirection.multiplyScalar(INTERACTION_CONFIG.touchForce * interaction.intensity);

    // 应用拖拽力
    activeModels.forEach(model => {
      physics.applyForce(model.id, force);
    });

    // 设置焦点目标
    setFocusTarget([interaction.position.x, interaction.position.y, interaction.position.z]);
  }, [activeModels, physics, setFocusTarget]);

  // 弹跳交互处理
  const handleBounceInteraction = useCallback((interaction: Interaction) => {
    const force = new THREE.Vector3(
      0,
      INTERACTION_CONFIG.bounceForce * interaction.intensity,
      0
    );

    // 应用弹跳力
    activeModels.forEach(model => {
      physics.applyImpulse(model.id, force);
    });

    // 情感响应
    setEmotion('excited');
    setAction('jump');
    triggerParticles({ type: 'sparkle', x: interaction.position.x, y: interaction.position.y });
  }, [activeModels, physics, setEmotion, setAction, triggerParticles]);

  // 对话交互处理
  const handleTalkInteraction = useCallback((interaction: Interaction) => {
    // 分析对话情感
    if (interaction.emotion) {
      const emotionResult = detectEmotion(interaction.emotion);
      const emotionAction = getEmotionAction(emotionResult.emotion);
      
      if (emotionAction) {
        setEmotion(emotionResult.emotion as any);
        setAction(emotionAction as Action);
      }
    }

    // 根据人格设定响应
    const responseDelay = INTERACTION_CONFIG.emotionResponseDelay;
    setTimeout(() => {
      switch (personality) {
        case 'tsundere':
          setAction('shy_pose');
          break;
        case 'sweet':
          setAction('nod');
          break;
        default:
          setAction('wave');
      }
    }, responseDelay);
  }, [detectEmotion, getEmotionAction, setEmotion, setAction, personality]);

  // 自动交互处理
  const handleAutoInteraction = useCallback((_interaction: Interaction) => {
    // AI自主行为
    const behavior = selectSmartBehavior();
    if (behavior) {
      executeSmartBehavior(behavior);
    }
  }, []);

  // 选择智能行为
  const selectSmartBehavior = useCallback((): SmartBehavior | null => {
    const currentTime = new Date().getHours();
    const timeOfDay = currentTime < 12 ? 'morning' : currentTime < 18 ? 'day' : 'evening';
    
    // 过滤符合条件的行
    const availableBehaviors = smartBehaviors.filter(behavior => {
      const conditions = behavior.conditions;
      
      if (conditions.timeOfDay && conditions.timeOfDay !== 'any' && conditions.timeOfDay !== timeOfDay) {
        return false;
      }
      
      // 可以根据更多条件进行过滤
      return true;
    });

    if (availableBehaviors.length === 0) return null;

    // 根据优先级选择行为
    availableBehaviors.sort((a, b) => b.priority - a.priority);
    return availableBehaviors[0];
  }, []);

  // 执行智能行为
  const executeSmartBehavior = useCallback((behavior: SmartBehavior) => {
    currentBehavior.current = behavior;

    switch (behavior.type) {
      case 'idle':
        setAction('idle_look_around');
        break;
      case 'explore':
        setAction('walk');
        // 随机探索移动
        const exploreForce = new THREE.Vector3(
          (Math.random() - 0.5) * 2,
          0,
          (Math.random() - 0.5) * 2
        );
        activeModels.forEach(model => {
          physics.applyForce(model.id, exploreForce);
        });
        break;
      case 'follow':
        setAction('walk');
        // 跟随逻辑（可以跟随鼠标或特定目标）
        break;
      case 'play':
        setAction('jump');
        triggerParticles({ type: 'sparkle', x: 0, y: 1 });
        break;
      case 'rest':
        setAction('idle');
        break;
    }

    // 设置行为持续时间
    setTimeout(() => {
      currentBehavior.current = null;
      setAction('idle');
    }, behavior.duration);
  }, [activeModels, physics, setAction, triggerParticles]);

  // 自动交互循环
  const startAutoInteraction = useCallback(() => {
    behaviorTimer.current = setInterval(() => {
      // 检查是否可以触发自动交互
      const timeSinceLastInteraction = Date.now() - lastInteractionTime.current;
      const shouldInteract = Math.random() < INTERACTION_CONFIG.aiBehaviorProbability &&
                           timeSinceLastInteraction > INTERACTION_CONFIG.interactionCooldown;

      if (shouldInteract && currentBehavior.current === null) {
        const autoInteraction: Interaction = {
          type: 'auto',
          position: new THREE.Vector3(
            (Math.random() - 0.5) * 3,
            0,
            (Math.random() - 0.5) * 3
          ),
          intensity: Math.random(),
          timestamp: Date.now()
        };
        handleInteraction(autoInteraction);
      }
    }, INTERACTION_CONFIG.autoInteractionInterval);
  }, [handleInteraction]);

  // 停止自动交互
  const stopAutoInteraction = useCallback(() => {
    if (behaviorTimer.current) {
      clearInterval(behaviorTimer.current);
      behaviorTimer.current = null;
    }
  }, []);

  // 获取交互建议
  const getInteractionSuggestions = useCallback((): string[] => {
    const suggestions: string[] = [];
    
    // 基于交互历史提供建议

    // 建议尝试不同的交互类型
    if (interactionHistory.touchy === 0) {
      suggestions.push('试试抚摸角色，增加亲密度');
    }
    if (interactionHistory.nice === 0) {
      suggestions.push('和角色聊天，看看它们的反应');
    }
    if (interactionHistory.mean === 0) {
      suggestions.push('尝试不同的交互方式');
    }

    return suggestions;
  }, [interactionHistory]);

  // 初始化
  useEffect(() => {
    startAutoInteraction();
    return () => {
      stopAutoInteraction();
    };
  }, [startAutoInteraction, stopAutoInteraction]);

  return {
    handleInteraction,
    getInteractionSuggestions,
    startAutoInteraction,
    stopAutoInteraction,
    getCurrentBehavior: () => currentBehavior.current
  };
};