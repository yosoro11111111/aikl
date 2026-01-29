import { useRef, useState, useCallback, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { INTERACTION_CONFIG } from '@/config';
import * as THREE from 'three';
import { VRM } from '@pixiv/three-vrm';
import { useSoundManager } from '@/hooks/useSoundManager';
import { useThree } from '@react-three/fiber';

type HitFeedback = { part: string; time: number } | null;

export const useInteractionManager = (vrm: VRM | null) => {
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
    incrementTaskProgress
  } = useStore();
  const { size } = useThree();
  const [hitFeedback, setHitFeedback] = useState<HitFeedback>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggered = useRef(false);
  const downPartTarget = useRef<string | null>(null);
  const downHitPoint = useRef<THREE.Vector3 | null>(null);
  const downScreen = useRef<{ x: number; y: number } | null>(null);
  
  // Personality Shift Check
  useEffect(() => {
    const total = interactionHistory.nice + interactionHistory.mean;
    if (total > 10) { // Only check after some interactions
        if (interactionHistory.mean > total * 0.3) {
            if (personality !== 'tsundere') {
                setPersonality('tsundere');
                addMessage({
                    role: 'assistant',
                    content: '[emotion:angry] [action:angry_pose] 哼，你这个人真是越来越过分了！',
                    id: Date.now().toString()
                });
            }
        } else if (interactionHistory.nice > total * 0.7) {
            if (personality !== 'sweet') {
                setPersonality('sweet');
                addMessage({
                    role: 'assistant',
                    content: '[emotion:happy] [action:shy_pose] 你对我真好...最喜欢你了。',
                    id: Date.now().toString()
                });
            }
        }
    }
  }, [interactionHistory, personality, setPersonality, addMessage]);

  // Logic for consecutive sensitive touches
  const sensitiveTouchCount = useRef(0);
  const lastSensitiveTouchTime = useRef(0);
  const RESTRICTED_PARTS = ['chest_poke', 'hips_poke', 'neck_poke', 'leg_poke'];

  // Affection Stages Helper
  const getAffectionStage = (value: number) => {
    if (value < 30) return 'cold';      // 陌生/冷淡
    if (value < 60) return 'neutral';   // 普通/熟悉
    if (value < 90) return 'friendly';  // 友好/亲密
    return 'love';                      // 恋人/羁绊
  };

  const rubTimeRef = useRef(0);
  const particleTimeRef = useRef(0);
  const isRubbingRef = useRef(false);
  const lastPointerPos = useRef(new THREE.Vector2());
  const currentRubTarget = useRef<any>(null);
  const { playSound } = useSoundManager();

  const clearLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  useEffect(() => {
    return () => clearLongPress();
  }, []);

  const handleClick = useCallback((e: any) => {
    e.stopPropagation();
    if (rubTimeRef.current > 0.1) { // 如果刚抚摸完，不触发点击
        rubTimeRef.current = 0;
        return;
    }

    const hitPoint = e.point; // World coordinates
    // Immediate visual feedback for click
    triggerParticles({ 
        x: (e.pointer.x + 1) / 2 * size.width, 
        y: -(e.pointer.y - 1) / 2 * size.height, 
        type: 'heart' 
    });

    playSound('pop');

    const hitName = e.object.name.toLowerCase();
    setHitFeedback({ part: hitName, time: 0 });

    const partConfig = INTERACTION_CONFIG.BODY_PARTS.find(part => hitName.includes(part.name));
    
    if (partConfig) {
      let affectionValue = INTERACTION_CONFIG.AFFECTION_VALUES[partConfig.target as keyof typeof INTERACTION_CONFIG.AFFECTION_VALUES] || 0;
      const stage = getAffectionStage(affection);
      
      // --- Special Interaction Logic ---
      
      // 1. Consecutive Sensitive Touches (Dynamic based on Affection)
      if (RESTRICTED_PARTS.includes(partConfig.target)) {
          const now = Date.now();
          if (now - lastSensitiveTouchTime.current > 5000) {
              sensitiveTouchCount.current = 0;
          }
          sensitiveTouchCount.current++;
          lastSensitiveTouchTime.current = now;

          // Thresholds based on stage
          let limit = 3;
          if (stage === 'cold') limit = 1;      // Cold: Don't touch me at all!
          if (stage === 'love') limit = 5;      // Love: Very tolerant

          if (sensitiveTouchCount.current >= limit) {
              if (stage === 'love') {
                  // Love: Playful rejection
                  setEmotion('shy');
                  setAction('shy_pose');
                  updateInteractionHistory('touchy'); 
                  addMessage({
                      role: 'assistant',
                      content: '[emotion:shy] [action:shy_pose] 真是的...这么多人看着呢...',
                      id: Date.now().toString()
                  });
              } else if (stage === 'friendly') {
                  // Friendly: Warning
                  setEmotion('pout');
                  setAction('shake');
                  affectionValue = -5; // Small penalty
                  updateInteractionHistory('mean'); 
                  addMessage({
                      role: 'assistant',
                      content: '[emotion:pout] [action:shake] 别闹啦，有点痒...',
                      id: Date.now().toString()
                  });
              } else {
                  // Cold/Neutral: Punishment!
                  affectionValue = -20;
                  setAction('angry_pose');
                  setEmotion('angry');
                  playSound('error');
                  updateInteractionHistory('mean'); 
                  addMessage({
                      role: 'assistant',
                      content: '[emotion:angry] [action:angry_pose] 喂！你在干什么呀！太过分了！(好感度大幅下降)',
                      id: Date.now().toString()
                  });
              }
              sensitiveTouchCount.current = 0; // Reset after reaction
          } else {
              // Warning / Minor drop
              setEmotion('shy');
              // affectionValue is already negative from config
          }
      }

      setTargetBodyPart(partConfig.target);
      addAffection(affectionValue);

      // 聚焦逻辑：点击头部或胸部时聚焦
      if (['head', 'face', 'chest', 'neck'].some(k => partConfig.name.includes(k))) {
        setFocusTarget([hitPoint.x, hitPoint.y, hitPoint.z]);
      }
      
      // --- 部位特有反应 (Part-Specific Reactions) ---
      if (partConfig.name.includes('hand')) {
          setAction('wave');
          if (Math.random() > 0.5) playSound('greeting');
      } else if (partConfig.name.includes('head')) {
          if (affection > 50) {
              setEmotion('happy');
              setAction('nod');
          } else {
              setEmotion('surprised');
              // Blink?
          }
      } else if (partConfig.name.includes('chest')) {
          setEmotion('shy');
          setAction('shy_pose');
      } else if (partConfig.name.includes('leg') || partConfig.name.includes('foot')) {
          setEmotion('surprised');
          setAction('surprised_pose');
      } else if (partConfig.name.includes('belly') || partConfig.name.includes('abdomen')) {
          setEmotion('happy');
          setAction('laugh'); // Laugh action? Or happy_dance?
          playSound('cute');
      } else if (partConfig.name.includes('shoulder')) {
          setEmotion('relaxed');
          // Lean?
      }

      incrementTaskProgress('interaction', 1);
    } else {
      // 默认交互
      addAffection(0);
    }
  }, [vrm, addAffection, setTargetBodyPart, playSound, setFocusTarget, setAction, setEmotion, addMessage, size, affection, incrementTaskProgress, triggerParticles, updateInteractionHistory]);

  const handlePointerDown = useCallback((e: any) => {
    e.stopPropagation();
    isRubbingRef.current = true;
    rubTimeRef.current = 0;
    particleTimeRef.current = 0;
    longPressTriggered.current = false;
    downHitPoint.current = e.point?.clone?.() ?? null;
    downScreen.current = {
      x: (e.pointer?.x ?? 0),
      y: (e.pointer?.y ?? 0),
    };
    
    // Immediate touch feedback
    triggerParticles({ 
        x: (e.pointer.x + 1) / 2 * size.width, 
        y: -(e.pointer.y - 1) / 2 * size.height, 
        type: 'star' 
    });

    const hitName = e.object.name.toLowerCase();
    const partConfig = INTERACTION_CONFIG.BODY_PARTS.find(part => hitName.includes(part.name));
    
    if (partConfig) {
      // For rubbing, we want to find the corresponding RUB_AREAS config
      // matching the part name
      const rubConfig = INTERACTION_CONFIG.RUB_AREAS.find(area => area.name === partConfig.name);
      currentRubTarget.current = rubConfig || partConfig; // Fallback to partConfig if no specific rub config
      downPartTarget.current = (rubConfig?.target || partConfig.target) ?? null;
      // 触摸就先轻微聚焦（桌宠感：你摸哪我看哪）
      if (downHitPoint.current) {
        setFocusTarget([downHitPoint.current.x, downHitPoint.current.y, downHitPoint.current.z]);
      }
    } else {
      currentRubTarget.current = null;
      downPartTarget.current = null;
    }

    // Long-press: enter "petting" mode feedback (stronger desk-pet feeling)
    clearLongPress();
    longPressTimer.current = setTimeout(() => {
      longPressTriggered.current = true;
      // Gentle reaction on long press start
      setEmotion('happy');
      if (downPartTarget.current?.includes('head')) {
        setAction('nod');
      } else if (downPartTarget.current?.includes('hand') || downPartTarget.current?.includes('arm')) {
        setAction('wave');
      } else {
        setAction('idle_sway');
      }
      playSound('cute');
    }, 260);
  }, [size, triggerParticles]);

  const handlePointerUp = useCallback(() => {
    isRubbingRef.current = false;
    rubTimeRef.current = 0;
    particleTimeRef.current = 0;
    currentRubTarget.current = null;
    downPartTarget.current = null;
    downHitPoint.current = null;
    downScreen.current = null;
    clearLongPress();
  }, []);

  const handlePointerMove = useCallback((e: any) => {
    e.stopPropagation();
    // Always track pointer for dragging if needed, but for rubbing:
    if (!isRubbingRef.current) return;

    const deltaMove = e.pointer.distanceTo(lastPointerPos.current);
    if (deltaMove > 0.001) { // 只有在实际移动时才更新位置
        lastPointerPos.current.copy(e.pointer);
    }

    // If user moved a lot before long-press triggers, cancel long press (so drag/move won't trigger pet start)
    if (!longPressTriggered.current && downScreen.current) {
      const dx = (e.pointer.x ?? 0) - downScreen.current.x;
      const dy = (e.pointer.y ?? 0) - downScreen.current.y;
      if ((dx * dx + dy * dy) > 0.02) {
        clearLongPress();
      }
    }
  }, []);

  const updateRubbing = useCallback((delta: number) => {
    if (!isRubbingRef.current || !currentRubTarget.current) {
      return;
    }

    rubTimeRef.current += delta;
    particleTimeRef.current += delta;

    // 1. Visual Feedback (Frequent)
    if (particleTimeRef.current > 0.08) { // Emit particles every 0.08s
         const x = (lastPointerPos.current.x + 1) / 2 * size.width;
         const y = -(lastPointerPos.current.y - 1) / 2 * size.height;
         
         let particleType: 'heart' | 'star' | 'note' | 'flower' | 'sparkle' = 'sparkle';
         const target = currentRubTarget.current.target || currentRubTarget.current.name || '';
         
         if (target.includes('head')) particleType = 'note';
         else if (target.includes('chest') || target.includes('body')) particleType = 'heart';
         else if (target.includes('arm') || target.includes('hand')) particleType = 'flower';
         else if (target.includes('leg')) particleType = 'sparkle';
         
         triggerParticles({ x, y, type: particleType });
         particleTimeRef.current = 0;
    }

    // 2. Affection & Logic Update (Slower)
    if (rubTimeRef.current > 0.5) { // 持续抚摸超过0.5秒
      const rubConfig = currentRubTarget.current;
      const stage = getAffectionStage(affection);
      
      // Check if rubbing is allowed based on stage
      let isAllowed = true;
      if (stage === 'cold') {
          isAllowed = false; // Reject all
      } else if (stage === 'neutral') {
          // Allow head/arm, reject others
          if (!rubConfig.target.includes('head') && !rubConfig.target.includes('arm')) {
              isAllowed = false;
          }
      }

      if (!isAllowed) {
          // Rejection feedback
          setEmotion('pout');
          setAction('shake'); // Shake head
          rubTimeRef.current = 0; // Reset
          return;
      }

      setTargetBodyPart(rubConfig.target);
      addAffection(rubConfig.affection);
      updateInteractionHistory('nice');
      // 桌宠感：抚摸时持续把视线拉到交互点（短时即可）
      if (downHitPoint.current) {
        setFocusTarget([downHitPoint.current.x, downHitPoint.current.y, downHitPoint.current.z]);
      }
      
      // 触发一个短暂的积极表情
      if (rubConfig.target === 'head_rub') {
          // setAction('nod'); // Don't interrupt constantly with nod, just emotion
          setEmotion('happy');
          if (Math.random() > 0.8) {
              playSound('cute');
              addMessage({ role: 'assistant', content: '好舒服~ (Feels good~)', id: Date.now().toString() });
          }
          incrementTaskProgress('pat', 1);
      } else if (rubConfig.target.includes('belly')) {
          setEmotion('happy');
          if (Math.random() > 0.8) {
              playSound('laugh');
              addMessage({ role: 'assistant', content: '肚子圆滚滚~ (Round belly~)', id: Date.now().toString() });
          }
      } else {
          if (Math.random() > 0.9) playSound('success');
      }
      incrementTaskProgress('interaction', 1);

      rubTimeRef.current = 0; // 重置计时，以实现连续触发
    }
  }, [addAffection, setTargetBodyPart, setAction, playSound, affection, incrementTaskProgress, setEmotion, size, triggerParticles, updateInteractionHistory]);


  const resetRubbing = useCallback(() => {
    rubTimeRef.current = 0;
    particleTimeRef.current = 0;
    isRubbingRef.current = false;
    currentRubTarget.current = null;
  }, []);

  const cancelRubbing = useCallback(() => {
    resetRubbing();
    clearLongPress();
  }, [resetRubbing]);

  const updateHitFeedback = useCallback((delta: number) => {
    // Disabled bone scaling to prevent twitching/jittering
    if (!hitFeedback) return;
    const { part, time } = hitFeedback;
    const { duration } = INTERACTION_CONFIG.HIT_FEEDBACK;
    
    if (time < duration) {
        setHitFeedback({ part, time: time + delta });
    } else {
        setHitFeedback(null);
    }
  }, [hitFeedback]);

  return {
    handleClick,
    handlePointerDown,
    handlePointerUp,
    handlePointerMove,
    resetRubbing,
    cancelRubbing,
    updateHitFeedback,
    updateRubbing,
  };
};
