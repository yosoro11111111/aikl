'use client';

import { useRef, useCallback, useEffect } from 'react';
import * as THREE from 'three';
import { useStore } from '@/store/useStore';
import { useAdvancedPhysics } from '@/hooks/useAdvancedPhysics';

// 智能行为配置
const BEHAVIOR_CONFIG = {
  // 行为触发概率
  idleProbability: 0.3,
  exploreProbability: 0.2,
  followProbability: 0.15,
  playProbability: 0.1,
  restProbability: 0.1,
  
  // 时间相关配置
  behaviorInterval: 30000, // 行为检查间隔（毫秒）
  minBehaviorDuration: 5000, // 最小行为持续时间
  maxBehaviorDuration: 20000, // 最大行为持续时间
  
  // 环境响应
  timeOfDayInfluence: 0.3, // 时间段影响权重
  emotionInfluence: 0.4, // 情感影响权重
  proximityInfluence: 0.3, // 接近度影响权重
};

// 行为类型
interface Behavior {
  id: string;
  type: 'idle' | 'explore' | 'follow' | 'play' | 'rest' | 'react';
  priority: number; // 1-10 优先级
  duration: number; // 持续时间（毫秒）
  conditions: {
    timeOfDay?: 'morning' | 'day' | 'evening' | 'night' | 'any';
    emotion?: string[]; // 允许的情感
    minAffection?: number; // 最小亲密度
    maxAffection?: number; // 最大亲密度
    proximity?: number; // 接近度阈值
  };
  actions: {
    animation: string; // 动画名称
    movement?: THREE.Vector3; // 移动方向
    emotion?: string; // 情感表达
    sound?: string; // 音效
  };
}

// 时间段定义
const TIME_OF_DAY = {
  morning: { start: 6, end: 12, mood: 'energetic' },
  day: { start: 12, end: 18, mood: 'active' },
  evening: { start: 18, end: 22, mood: 'relaxed' },
  night: { start: 22, end: 6, mood: 'sleepy' }
};

export const useSmartBehaviorSystem = () => {
  const {
    activeModels,
    setAction,
    setEmotion,
    setFocusTarget,
    triggerParticles,
    affection,
    personality,
    interactionHistory
  } = useStore();

  const physics = useAdvancedPhysics();
  
  const behaviorTimer = useRef<NodeJS.Timeout | null>(null);
  const currentBehavior = useRef<Behavior | null>(null);
  const behaviorStartTime = useRef<number>(0);

  // 智能行为库
  const behaviors: Behavior[] = [
    // 空闲行为
    {
      id: 'idle_look_around',
      type: 'idle',
      priority: 1,
      duration: 8000,
      conditions: { timeOfDay: 'any', minAffection: 0 },
      actions: { animation: 'idle_look_around', emotion: 'neutral' }
    },
    {
      id: 'idle_stretch',
      type: 'idle',
      priority: 2,
      duration: 5000,
      conditions: { timeOfDay: 'morning', minAffection: 20 },
      actions: { animation: 'idle_stretch', emotion: 'happy' }
    },
    
    // 探索行为
    {
      id: 'explore_room',
      type: 'explore',
      priority: 3,
      duration: 15000,
      conditions: { timeOfDay: 'day', minAffection: 10 },
      actions: { 
        animation: 'walk', 
        movement: new THREE.Vector3(1, 0, 0.5),
        emotion: 'curious' 
      }
    },
    {
      id: 'explore_window',
      type: 'explore',
      priority: 4,
      duration: 10000,
      conditions: { timeOfDay: 'day', minAffection: 30 },
      actions: { 
        animation: 'walk', 
        movement: new THREE.Vector3(-1, 0, -1),
        emotion: 'excited' 
      }
    },
    
    // 跟随行为
    {
      id: 'follow_cursor',
      type: 'follow',
      priority: 5,
      duration: 10000,
      conditions: { timeOfDay: 'any', minAffection: 40, proximity: 2 },
      actions: { animation: 'walk', emotion: 'happy' }
    },
    {
      id: 'follow_user',
      type: 'follow',
      priority: 6,
      duration: 12000,
      conditions: { timeOfDay: 'any', minAffection: 60, proximity: 1 },
      actions: { animation: 'run', emotion: 'excited' }
    },
    
    // 玩耍行为
    {
      id: 'play_jump',
      type: 'play',
      priority: 4,
      duration: 5000,
      conditions: { timeOfDay: 'day', minAffection: 50 },
      actions: { animation: 'jump', emotion: 'excited', sound: 'jump' }
    },
    {
      id: 'play_dance',
      type: 'play',
      priority: 5,
      duration: 8000,
      conditions: { timeOfDay: 'evening', minAffection: 70 },
      actions: { animation: 'dance', emotion: 'happy', sound: 'music' }
    },
    
    // 休息行为
    {
      id: 'rest_sit',
      type: 'rest',
      priority: 2,
      duration: 12000,
      conditions: { timeOfDay: 'evening', minAffection: 20 },
      actions: { animation: 'sit', emotion: 'relaxed' }
    },
    {
      id: 'rest_sleep',
      type: 'rest',
      priority: 1,
      duration: 20000,
      conditions: { timeOfDay: 'night', minAffection: 10 },
      actions: { animation: 'lie_down', emotion: 'sleepy' }
    },
    
    // 反应行为
    {
      id: 'react_happy',
      type: 'react',
      priority: 6,
      duration: 6000,
      conditions: { emotion: ['happy', 'excited'], minAffection: 30 },
      actions: { animation: 'wave', emotion: 'happy', sound: 'happy' }
    },
    {
      id: 'react_sad',
      type: 'react',
      priority: 7,
      duration: 7000,
      conditions: { emotion: ['sad', 'angry'], minAffection: 20 },
      actions: { animation: 'cry', emotion: 'sad', sound: 'sad' }
    }
  ];

  // 获取当前时间段
  const getCurrentTimeOfDay = useCallback((): string => {
    const hour = new Date().getHours();
    
    for (const [time, config] of Object.entries(TIME_OF_DAY)) {
      if (hour >= config.start && hour < config.end) {
        return time;
      }
    }
    
    return 'night'; // 默认夜间
  }, []);

  // 计算行为权重
  const calculateBehaviorWeight = useCallback((behavior: Behavior): number => {
    let weight = behavior.priority;
    const currentTime = getCurrentTimeOfDay();
    
    // 时间段匹配度
    if (behavior.conditions.timeOfDay && behavior.conditions.timeOfDay !== 'any') {
      if (behavior.conditions.timeOfDay === currentTime) {
        weight += BEHAVIOR_CONFIG.timeOfDayInfluence * 10;
      } else {
        weight -= BEHAVIOR_CONFIG.timeOfDayInfluence * 5;
      }
    }
    
    // 亲密度匹配度
    if (behavior.conditions.minAffection && affection < behavior.conditions.minAffection) {
      weight -= 5;
    }
    if (behavior.conditions.maxAffection && affection > behavior.conditions.maxAffection) {
      weight -= 3;
    }
    
    // 情感匹配度（基于交互历史）
    if (behavior.conditions.emotion) {
      // 基于interactionHistory对象计算情感匹配度
      const totalInteractions = interactionHistory.nice + interactionHistory.mean + interactionHistory.touchy;
      if (totalInteractions > 0) {
        // 简单的情感匹配逻辑：如果有任何交互，就认为有匹配的情感
        weight += BEHAVIOR_CONFIG.emotionInfluence * 8;
      }
    }
    
    return Math.max(weight, 0); // 确保权重非负
  }, [getCurrentTimeOfDay, affection, interactionHistory]);

  // 选择最佳行为
  const selectBestBehavior = useCallback((): Behavior | null => {
    const availableBehaviors = behaviors.filter(behavior => {
      // 基础条件检查
      const currentTime = getCurrentTimeOfDay();
      
      if (behavior.conditions.timeOfDay && behavior.conditions.timeOfDay !== 'any' && 
          behavior.conditions.timeOfDay !== currentTime) {
        return false;
      }
      
      if (behavior.conditions.minAffection && affection < behavior.conditions.minAffection) {
        return false;
      }
      
      if (behavior.conditions.maxAffection && affection > behavior.conditions.maxAffection) {
        return false;
      }
      
      return true;
    });

    if (availableBehaviors.length === 0) return null;

    // 计算权重并选择
    const weightedBehaviors = availableBehaviors.map(behavior => ({
      behavior,
      weight: calculateBehaviorWeight(behavior)
    }));

    weightedBehaviors.sort((a, b) => b.weight - a.weight);
    
    // 根据权重概率选择（避免总是选择最高权重）
    const totalWeight = weightedBehaviors.reduce((sum, item) => sum + item.weight, 0);
    const random = Math.random() * totalWeight;
    
    let currentWeight = 0;
    for (const item of weightedBehaviors) {
      currentWeight += item.weight;
      if (random <= currentWeight) {
        return item.behavior;
      }
    }
    
    return weightedBehaviors[0].behavior; // 默认返回最高权重
  }, [getCurrentTimeOfDay, affection, calculateBehaviorWeight]);

  // 执行行为
  const executeBehavior = useCallback((behavior: Behavior) => {
    currentBehavior.current = behavior;
    behaviorStartTime.current = Date.now();

    // 设置动画和情感
    setAction(behavior.actions.animation as any);
    if (behavior.actions.emotion) {
      setEmotion(behavior.actions.emotion as any);
    }

    // 处理移动
    if (behavior.actions.movement) {
      activeModels.forEach(model => {
        physics.applyForce(model.id, behavior.actions.movement!);
      });
    }

    // 触发粒子效果
    if (behavior.type === 'play') {
      triggerParticles({ type: 'sparkle', x: 0, y: 1 });
    }

    // 设置行为超时
    const duration = Math.random() * 
                    (BEHAVIOR_CONFIG.maxBehaviorDuration - BEHAVIOR_CONFIG.minBehaviorDuration) + 
                    BEHAVIOR_CONFIG.minBehaviorDuration;

    setTimeout(() => {
      if (currentBehavior.current?.id === behavior.id) {
        endBehavior();
      }
    }, duration);
  }, [activeModels, physics, setAction, setEmotion, triggerParticles]);

  // 结束行为
  const endBehavior = useCallback(() => {
    currentBehavior.current = null;
    setAction('idle');
    setEmotion('neutral');
  }, [setAction, setEmotion]);

  // 检查行为是否应该结束
  const shouldEndBehavior = useCallback((): boolean => {
    if (!currentBehavior.current) return false;
    
    const elapsedTime = Date.now() - behaviorStartTime.current;
    return elapsedTime >= currentBehavior.current.duration;
  }, []);

  // 行为检查循环
  const behaviorCheckLoop = useCallback(() => {
    if (currentBehavior.current) {
      // 检查当前行为是否应该结束
      if (shouldEndBehavior()) {
        endBehavior();
      }
    } else {
      // 没有当前行为，尝试选择新行为
      const shouldStartNewBehavior = Math.random() < getBehaviorProbability();
      
      if (shouldStartNewBehavior) {
        const newBehavior = selectBestBehavior();
        if (newBehavior) {
          executeBehavior(newBehavior);
        }
      }
    }

    // 继续循环
    behaviorTimer.current = setTimeout(behaviorCheckLoop, BEHAVIOR_CONFIG.behaviorInterval);
  }, [shouldEndBehavior, endBehavior, selectBestBehavior, executeBehavior]);

  // 根据时间段获取行为概率
  const getBehaviorProbability = useCallback((): number => {
    const timeOfDay = getCurrentTimeOfDay();
    
    switch (timeOfDay) {
      case 'morning':
        return BEHAVIOR_CONFIG.idleProbability * 1.2; // 早晨更活跃
      case 'day':
        return BEHAVIOR_CONFIG.exploreProbability * 1.5; // 白天更爱探索
      case 'evening':
        return BEHAVIOR_CONFIG.restProbability * 1.3; // 晚上更爱休息
      case 'night':
        return BEHAVIOR_CONFIG.idleProbability * 0.5; // 夜间较少活动
      default:
        return BEHAVIOR_CONFIG.idleProbability;
    }
  }, [getCurrentTimeOfDay]);

  // 强制触发特定行为
  const triggerBehavior = useCallback((behaviorType: string, emotion?: string) => {
    // 结束当前行为
    if (currentBehavior.current) {
      endBehavior();
    }

    // 查找匹配的行为
    const matchingBehaviors = behaviors.filter(behavior => 
      behavior.type === behaviorType && 
      (!emotion || behavior.actions.emotion === emotion)
    );

    if (matchingBehaviors.length > 0) {
      const randomBehavior = matchingBehaviors[Math.floor(Math.random() * matchingBehaviors.length)];
      executeBehavior(randomBehavior);
      return true;
    }

    return false;
  }, [endBehavior, executeBehavior]);

  // 获取当前行为信息
  const getCurrentBehaviorInfo = useCallback(() => {
    if (!currentBehavior.current) return null;
    
    return {
      type: currentBehavior.current.type,
      animation: currentBehavior.current.actions.animation,
      emotion: currentBehavior.current.actions.emotion,
      elapsedTime: Date.now() - behaviorStartTime.current,
      totalDuration: currentBehavior.current.duration
    };
  }, []);

  // 启动行为系统
  const startBehaviorSystem = useCallback(() => {
    if (!behaviorTimer.current) {
      behaviorCheckLoop();
    }
  }, [behaviorCheckLoop]);

  // 停止行为系统
  const stopBehaviorSystem = useCallback(() => {
    if (behaviorTimer.current) {
      clearTimeout(behaviorTimer.current);
      behaviorTimer.current = null;
    }
    
    if (currentBehavior.current) {
      endBehavior();
    }
  }, [endBehavior]);

  // 初始化
  useEffect(() => {
    startBehaviorSystem();
    return () => {
      stopBehaviorSystem();
    };
  }, [startBehaviorSystem, stopBehaviorSystem]);

  return {
    startBehaviorSystem,
    stopBehaviorSystem,
    triggerBehavior,
    getCurrentBehaviorInfo,
    getCurrentTimeOfDay
  };
};