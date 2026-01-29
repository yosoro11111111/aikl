import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { VRM } from '@pixiv/three-vrm';
import * as THREE from 'three';
import { useStore, Emotion } from '@/store/useStore';

// Define recipes for complex emotions
const EXPRESSION_RECIPES: Record<string, Record<string, number>> = {
  // Standard mapped to VRM presets (names might vary by model version, using standard ones)
  neutral: {},
  happy: { joy: 1.0 },
  angry: { angry: 1.0 },
  sad: { sorrow: 1.0 },
  surprised: { fun: 0.5, surprised: 1.0 }, // Fallback fun if surprised missing
  relaxed: { joy: 0.3, blink: 0.1 },
  
  // Complex Emotions
  shy: { sorrow: 0.2, blink: 0.2, lookDown: 0.2 },
  disgust: { angry: 0.4, blink: 0.2, fun: 0.1 },
  fear: { sorrow: 0.5, surprised: 0.5, a: 0.3 },
  excited: { joy: 0.8, surprised: 0.3 },
  serious: { angry: 0.2, lookDown: 0.1 },
  confused: { angry: 0.1, sorrow: 0.1, lookLeft: 0.2 },
  smug: { joy: 0.3, lookDown: 0.1, blinkLeft: 0.4 },
  tired: { sorrow: 0.2, blink: 0.6 },
  wink: { blinkLeft: 1.0, joy: 0.3 },
  pain: { angry: 0.3, sorrow: 0.5, blink: 0.8 },
  love: { joy: 0.8, blink: 0.1 },
  sleepy: { blink: 0.8 },
  pout: { angry: 0.3, sorrow: 0.2, u: 0.3 },
  focus: { angry: 0.1, blink: 0.1 },
};

export const useFaceExpression = (vrm: VRM | null) => {
  const { isTalking, currentEmotion, expressionExaggeration } = useStore();
  const blinkTimer = useRef(0);
  const nextBlinkTime = useRef(2 + Math.random() * 3);
  const isBlinking = useRef(false);
  const lipSyncTimer = useRef(0);

  // Apply emotion when it changes
  useEffect(() => {
    if (!vrm || !vrm.expressionManager) return;

    const manager = vrm.expressionManager;

    // 1. Reset ALL blendshapes that we might have touched
    // Get all registered expressions from the manager
    // @ts-ignore - Accessing internal or standard property
    const availableExpressions = manager.expressions?.map(e => e.expressionName) || [
      'neutral', 'happy', 'angry', 'sad', 'relaxed', 'surprised', 'joy', 'sorrow', 'fun',
      'blink', 'blinkLeft', 'blinkRight', 'a', 'i', 'u', 'e', 'o', 
      'lookUp', 'lookDown', 'lookLeft', 'lookRight'
    ];

    availableExpressions.forEach((name: string) => {
        manager.setValue(name, 0);
    });

    // 2. Apply the recipe for the current emotion
    const recipe = EXPRESSION_RECIPES[currentEmotion] || EXPRESSION_RECIPES['neutral'];
    
    // Calculate multiplier based on exaggeration setting
    const multiplier = 1.5 + (expressionExaggeration * 1.25);

    // Helper to find valid expression name
    const findExpression = (candidates: string[]) => {
        return candidates.find(name => manager.getExpression(name) !== null);
    };

    // Mappings for standard expressions to handle VRM 0.0 / 1.0 and variations
    const EXPRESSION_MAP: Record<string, string[]> = {
        joy: ['joy', 'happy', 'Joy', '喜', 'fun'],
        angry: ['angry', 'Angry', '怒'],
        sorrow: ['sorrow', 'sad', 'Sorrow', '哀'],
        fun: ['fun', 'relaxed', 'Fun', '乐'],
        surprised: ['surprised', 'Surprised', '惊'],
        blink: ['blink', 'Blink', '眨眼'],
        blinkLeft: ['blinkLeft', 'blink_L', 'Blink_L'],
        blinkRight: ['blinkRight', 'blink_R', 'Blink_R'],
        a: ['a', 'aa', 'A', 'あ'],
        i: ['i', 'ih', 'I', 'い'],
        u: ['u', 'ou', 'U', 'う'],
        e: ['e', 'ee', 'E', 'え'],
        o: ['o', 'oh', 'O', 'お'],
        lookUp: ['lookUp', 'LookUp'],
        lookDown: ['lookDown', 'LookDown'],
        lookLeft: ['lookLeft', 'LookLeft'],
        lookRight: ['lookRight', 'LookRight']
    };

    Object.entries(recipe).forEach(([shape, weight]) => {
        // Find best matching expression name
        const candidates = EXPRESSION_MAP[shape] || [shape];
        const targetShape = findExpression(candidates);

        if (targetShape) {
            // Apply multiplier, allow going slightly over 1.0 for exaggeration effects
            // but cap at 1.5 to prevent total mesh explosion
            const finalWeight = Math.min(1.5, weight * multiplier);
            manager.setValue(targetShape, finalWeight);
        }
    });

  }, [currentEmotion, vrm, expressionExaggeration]);

  useFrame((_, delta) => {
    if (!vrm || !vrm.expressionManager) return;
    
    // Skip auto-blink if the current emotion involves heavy blinking (like sleep, wink, pain)
    const isEyesClosedEmotion = ['sleepy', 'wink', 'pain', 'tired'].includes(currentEmotion);

    // --- Auto Blinking ---
    if (!isEyesClosedEmotion) {
        blinkTimer.current += delta;

        if (!isBlinking.current && blinkTimer.current >= nextBlinkTime.current) {
          isBlinking.current = true;
          blinkTimer.current = 0;
        }

        if (isBlinking.current) {
          const blinkDuration = 0.1; 
          const openDuration = 0.1;  
          
          let blinkValue = 0;
          if (blinkTimer.current < blinkDuration) {
            blinkValue = blinkTimer.current / blinkDuration;
          } else if (blinkTimer.current < blinkDuration + openDuration) {
            blinkValue = 1 - (blinkTimer.current - blinkDuration) / openDuration;
          } else {
            isBlinking.current = false;
            blinkTimer.current = 0;
            nextBlinkTime.current = 2 + Math.random() * 4; 
            blinkValue = 0;
          }

          // Add to existing blink value (if any) from emotion, clamped to 1
          const currentBlink = vrm.expressionManager.getValue('blink') || 0;
          vrm.expressionManager.setValue('blink', Math.min(1, currentBlink + blinkValue));
        }
    }

    // --- Lip Sync (Simulated) ---
    if (isTalking) {
      lipSyncTimer.current += delta * 15; // Speed of mouth movement
      const openAmount = (Math.sin(lipSyncTimer.current) + 1) * 0.3 + 0.1; // Oscillate between 0.1 and 0.7
      
      // Randomly switch between vowels for more natural look
      vrm.expressionManager.setValue('aa', openAmount);
      vrm.expressionManager.setValue('ih', Math.max(0, openAmount - 0.2));
      vrm.expressionManager.setValue('ou', Math.max(0, 0.5 - openAmount));
    } else {
      // Close mouth smoothly
      const currentAa = vrm.expressionManager.getValue('aa') || 0;
      if (currentAa > 0) {
        vrm.expressionManager.setValue('aa', THREE.MathUtils.lerp(currentAa, 0, delta * 10));
        vrm.expressionManager.setValue('ih', 0);
        vrm.expressionManager.setValue('ou', 0);
      }
    }
  });
};
