import { useStore, Action } from '@/store/useStore';
import { VRM, VRMExpressionPresetName } from '@pixiv/three-vrm';
import { useFrame } from '@react-three/fiber';
import { useRef, useEffect } from 'react';
import * as THREE from 'three';

// 特殊动作定义
const SPECIAL_ACTIONS: Record<string, {
  name: string;
  bones: string[];
  duration: number;
  animation: (t: number, bones: Record<string, THREE.Object3D | null>) => void;
}> = {
  'dance': {
    name: '舞蹈',
    bones: ['hips', 'spine', 'leftUpperLeg', 'rightUpperLeg', 'leftLowerLeg', 'rightLowerLeg', 'leftUpperArm', 'rightUpperArm'],
    duration: 3000,
    animation: (t, bones) => {
      const hips = bones.hips;
      const spine = bones.spine;
      if (hips) {
        hips.rotation.y = Math.sin(t * 4) * 0.3;
        hips.position.y = Math.sin(t * 8) * 0.1;
      }
      if (spine) {
        spine.rotation.x = Math.sin(t * 6) * 0.2;
      }
    }
  },
  'wave': {
    name: '挥手',
    bones: ['rightUpperArm', 'rightLowerArm', 'rightHand'],
    duration: 2000,
    animation: (t, bones) => {
      const rightUpperArm = bones.rightUpperArm;
      const rightLowerArm = bones.rightLowerArm;
      if (rightUpperArm) {
        rightUpperArm.rotation.x = Math.sin(t * 8) * 0.5 + 0.5;
      }
      if (rightLowerArm) {
        rightLowerArm.rotation.x = Math.sin(t * 8) * 0.3;
      }
    }
  },
  'bow': {
    name: '鞠躬',
    bones: ['spine', 'chest', 'head', 'hips'],
    duration: 2000,
    animation: (t, bones) => {
      const spine = bones.spine;
      const head = bones.head;
      if (spine) {
        spine.rotation.x = Math.sin(t * Math.PI) * 0.4;
      }
      if (head) {
        head.rotation.x = Math.sin(t * Math.PI) * 0.2;
      }
    }
  },
  'victory': {
    name: '胜利姿势',
    bones: ['leftUpperArm', 'leftLowerArm', 'leftHand', 'rightUpperArm', 'rightLowerArm', 'rightHand'],
    duration: 2000,
    animation: (t, bones) => {
      const leftUpperArm = bones.leftUpperArm;
      const rightUpperArm = bones.rightUpperArm;
      if (leftUpperArm) {
        leftUpperArm.rotation.x = -Math.PI / 2;
        leftUpperArm.rotation.z = Math.PI / 4;
      }
      if (rightUpperArm) {
        rightUpperArm.rotation.x = -Math.PI / 2;
        rightUpperArm.rotation.z = -Math.PI / 4;
      }
    }
  },
  'jump': {
    name: '跳跃',
    bones: ['hips', 'leftUpperLeg', 'rightUpperLeg', 'leftLowerLeg', 'rightLowerLeg'],
    duration: 1500,
    animation: (t, bones) => {
      const hips = bones.hips;
      if (hips) {
        const jumpHeight = Math.sin(t * Math.PI) * 0.5;
        hips.position.y = jumpHeight;
      }
    }
  }
};

const IDLE_ANIMATIONS: Action[] = ['idle_look_around', 'idle_sway', 'idle_stretch', 'idle_subtle_shift'];
const IDLE_TIME_RANGE = [5, 12]; 

export const useAnimationManager = (vrm: VRM | null, modelId?: string) => {
  const { currentEmotion: globalEmotion, currentAction: globalAction, setAction: setGlobalAction, modelStates, setModelAction } = useStore();
  
  const currentAction = (modelId && modelStates[modelId]?.action) ? modelStates[modelId].action : globalAction;
  const currentEmotion = (modelId && modelStates[modelId]?.emotion) ? modelStates[modelId].emotion : globalEmotion;
  
  const setAction = (action: any) => {
      if (modelId) {
          setModelAction(modelId, action);
      } else {
          setGlobalAction(action);
      }
  };

  const actionTimeRef = useRef(0);
  const idleTimerRef = useRef(0);
  const nextIdleTimeRef = useRef(Math.random() * (IDLE_TIME_RANGE[1] - IDLE_TIME_RANGE[0]) + IDLE_TIME_RANGE[0]);

  // 监听动作变化，立即重置时间计数器
  useEffect(() => {
    // 当动作变化时，立即重置时间计数器
    actionTimeRef.current = 0;
  }, [currentAction]);

  // 表情控制
  useEffect(() => {
    if (!vrm || !vrm.expressionManager) return;
    
    const m = vrm.expressionManager;

    // 重置所有表情
    const resetKeys = Object.values(VRMExpressionPresetName);
    resetKeys.forEach(key => m.setValue(key, 0));

    // 特殊动作覆盖表情
    if (currentAction === 'sleep') {
        m.setValue(VRMExpressionPresetName.Blink, 1.0);
        m.setValue(VRMExpressionPresetName.Relaxed, 1.0);
        m.update();
        return;
    }

    // 根据当前情绪设置表情
    switch (currentEmotion) {
        case 'happy': m.setValue(VRMExpressionPresetName.Happy, 1.0); break;
        case 'angry': m.setValue(VRMExpressionPresetName.Angry, 1.0); break;
        case 'sad': m.setValue(VRMExpressionPresetName.Sad, 1.0); break;
        case 'surprised': m.setValue(VRMExpressionPresetName.Surprised, 1.0); break;
        case 'relaxed': m.setValue(VRMExpressionPresetName.Relaxed, 1.0); break;
        case 'shy': 
            m.setValue(VRMExpressionPresetName.Neutral, 1.0);
            // 可以在这里混合一点 happy 或其他
            break;
        // 可以根据需要添加更多复合表情
        default: m.setValue(VRMExpressionPresetName.Neutral, 1.0); break;
    }
    
    m.update();
  }, [currentEmotion, currentAction, vrm]);

  // 动画循环
  useFrame((state, delta) => {
    if (!vrm) return;

    // 闲置动画计时器
    if (currentAction === 'idle') {
        idleTimerRef.current += delta;
        if (idleTimerRef.current > nextIdleTimeRef.current) {
            const randomIdleAction = IDLE_ANIMATIONS[Math.floor(Math.random() * IDLE_ANIMATIONS.length)];
            setAction(randomIdleAction as any);
            idleTimerRef.current = 0;
            nextIdleTimeRef.current = Math.random() * (IDLE_TIME_RANGE[1] - IDLE_TIME_RANGE[0]) + IDLE_TIME_RANGE[0];
        }
    } else {
        idleTimerRef.current = 0; // 如果有其他动作，重置闲置计时器
    }

    // 动作处理逻辑
    if (currentAction && currentAction !== 'idle') {
        actionTimeRef.current += delta;
        const t = actionTimeRef.current;
        
        // 检查是否为特殊动作
        const specialAction = SPECIAL_ACTIONS[currentAction];
        
        if (specialAction) {
            // 特殊动作处理
            const normalizedTime = t / specialAction.duration;
            
            // 获取所有需要的骨骼
            const bones: Record<string, THREE.Object3D | null> = {};
            specialAction.bones.forEach(boneName => {
                bones[boneName] = vrm.humanoid?.getNormalizedBoneNode(boneName as any);
            });
            
            // 执行特殊动作动画
            specialAction.animation(normalizedTime, bones);
            
            // 检查动作是否完成
            if (t >= specialAction.duration) {
                setAction('idle');
                actionTimeRef.current = 0;
            }
        } else {
            // 原有动作处理逻辑
            // Define bones at top level of the block
            const head = vrm.humanoid?.getNormalizedBoneNode('head');
            const spine = vrm.humanoid?.getNormalizedBoneNode('spine');
            const hips = vrm.humanoid?.getNormalizedBoneNode('hips');
            const leftUpperLeg = vrm.humanoid?.getNormalizedBoneNode('leftUpperLeg');
            const rightUpperLeg = vrm.humanoid?.getNormalizedBoneNode('rightUpperLeg');
            const leftLowerLeg = vrm.humanoid?.getNormalizedBoneNode('leftLowerLeg');
            const rightLowerLeg = vrm.humanoid?.getNormalizedBoneNode('rightLowerLeg');
            const leftUpperArm = vrm.humanoid?.getNormalizedBoneNode('leftUpperArm');
            const rightUpperArm = vrm.humanoid?.getNormalizedBoneNode('rightUpperArm');
            const leftLowerArm = vrm.humanoid?.getNormalizedBoneNode('leftLowerArm');
            const rightLowerArm = vrm.humanoid?.getNormalizedBoneNode('rightLowerArm');
            const leftHand = vrm.humanoid?.getNormalizedBoneNode('leftHand');
            const rightHand = vrm.humanoid?.getNormalizedBoneNode('rightHand');

            // Helper for resetting
            const resetAction = () => {
                setAction('idle');
                actionTimeRef.current = 0;
            };

        switch (currentAction) {
            case 'nod':
                // Exaggerated Nod: 1.5s duration, double nod
                if (head && t < 1.5) {
                    const angle = Math.sin(t * 10) * 0.3 * Math.max(0, 1 - t/1.5); // Decay
                    head.rotation.x = THREE.MathUtils.lerp(head.rotation.x, angle, 0.2);
                } else {
                    resetAction();
                }
                break;
                
            case 'shake':
                // Exaggerated Shake: 1.5s
                if (head && t < 1.5) {
                    const angle = Math.sin(t * 12) * 0.4 * Math.max(0, 1 - t/1.5);
                    head.rotation.y = THREE.MathUtils.lerp(head.rotation.y, angle, 0.2);
                } else {
                    resetAction();
                }
                break;
                
            case 'jump':
                // Exaggerated Jump: 1.2s, higher, more squat
                if (t < 1.2) {
                    let y = 0;
                    if (t < 0.3) {
                        // Squat down
                         y = -Math.sin(t/0.3 * Math.PI/2) * 0.1;
                    } else if (t < 0.9) {
                        // Jump up (parabola)
                        const airT = (t - 0.3) / 0.6; // 0 to 1
                        y = Math.sin(airT * Math.PI) * 0.6; // Higher jump 0.6
                    } else {
                        // Land impact
                        const landT = (t - 0.9) / 0.3;
                         y = -Math.sin((1-landT) * Math.PI/2) * 0.1;
                    }
                    
                    vrm.scene.position.y = THREE.MathUtils.lerp(vrm.scene.position.y, Math.max(-0.1, y), 0.2);
                    
                    if (leftUpperLeg && rightUpperLeg && leftLowerLeg && rightLowerLeg) {
                         let legBend = 0;
                         if (t < 0.3) legBend = 0.5; // Deep squat
                         else if (t < 0.9) legBend = 0.2; // Slight bend in air
                         else legBend = 0.4; // Landing

                         const targetX = -legBend;
                         leftUpperLeg.rotation.x = THREE.MathUtils.lerp(leftUpperLeg.rotation.x, targetX, 0.2);
                         rightUpperLeg.rotation.x = THREE.MathUtils.lerp(rightUpperLeg.rotation.x, targetX, 0.2);
                         leftLowerLeg.rotation.x = THREE.MathUtils.lerp(leftLowerLeg.rotation.x, -targetX * 2, 0.2);
                         rightLowerLeg.rotation.x = THREE.MathUtils.lerp(rightLowerLeg.rotation.x, -targetX * 2, 0.2);
                    }
                } else {
                    resetAction();
                }
                break;
            
            case 'wave':
                // New Wave Action: 2.0s
                if (t < 2.0) {
                    if (rightUpperArm) {
                        // Raise arm
                        rightUpperArm.rotation.z = THREE.MathUtils.lerp(rightUpperArm.rotation.z, -Math.PI / 1.3, 0.1);
                        rightUpperArm.rotation.x = THREE.MathUtils.lerp(rightUpperArm.rotation.x, 0, 0.1);
                    }
                    if (rightLowerArm) {
                         // Bend elbow slightly
                        rightLowerArm.rotation.z = THREE.MathUtils.lerp(rightLowerArm.rotation.z, -0.5, 0.1);
                    }
                    if (rightHand) {
                        // Wave hand
                        const waveAngle = Math.sin(t * 10) * 0.5;
                        rightHand.rotation.z = THREE.MathUtils.lerp(rightHand.rotation.z, waveAngle, 0.2);
                    }
                } else {
                    resetAction();
                }
                break;

            case 'laugh':
                // Laugh: 2.0s
                if (t < 2.0) {
                     if (spine) {
                         spine.rotation.x = THREE.MathUtils.lerp(spine.rotation.x, Math.sin(t * 20) * 0.05 - 0.1, 0.1); // Shake + lean back
                     }
                     if (head) {
                         head.rotation.x = THREE.MathUtils.lerp(head.rotation.x, -0.2, 0.1); // Look up slightly
                     }
                } else {
                    resetAction();
                }
                break;

             case 'shy_pose':
                // Shy: 3.0s (hold pose)
                if (t < 3.0) {
                    if (head) {
                         head.rotation.y = THREE.MathUtils.lerp(head.rotation.y, 0.3, 0.05); // Look away
                         head.rotation.x = THREE.MathUtils.lerp(head.rotation.x, 0.2, 0.05); // Look down
                    }
                    if (spine) {
                         spine.rotation.z = THREE.MathUtils.lerp(spine.rotation.z, 0.1, 0.05); // Lean
                    }
                    if (leftUpperArm) leftUpperArm.rotation.z = THREE.MathUtils.lerp(leftUpperArm.rotation.z, 0.2, 0.1);
                    if (rightUpperArm) rightUpperArm.rotation.z = THREE.MathUtils.lerp(rightUpperArm.rotation.z, -0.2, 0.1);
                } else {
                    resetAction();
                }
                break;

            case 'dance':
                 // Simple dance: 4.0s
                 if (t < 4.0) {
                     const bounce = Math.abs(Math.sin(t * 8)) * 0.1;
                     vrm.scene.position.y = THREE.MathUtils.lerp(vrm.scene.position.y, bounce, 0.2);
                     
                     if (spine) {
                         spine.rotation.y = Math.sin(t * 4) * 0.3;
                         spine.rotation.z = Math.cos(t * 4) * 0.1;
                     }
                     
                     if (leftUpperArm) leftUpperArm.rotation.z = Math.sin(t * 4) * 0.5 + 2.5; // Hands up
                     if (rightUpperArm) rightUpperArm.rotation.z = Math.cos(t * 4) * 0.5 - 2.5;
                 } else {
                     resetAction();
                 }
                 break;

            case 'walk':
                // Ensure upright position (reset from sleep/lie)
                vrm.scene.rotation.x = THREE.MathUtils.lerp(vrm.scene.rotation.x, 0, 0.1);
                vrm.scene.position.y = THREE.MathUtils.lerp(vrm.scene.position.y, 0, 0.1);

                // Continuous walk cycle
                const walkSpeed = 10;
                
                if (leftUpperLeg && rightUpperLeg) {
                    leftUpperLeg.rotation.x = Math.sin(t * walkSpeed) * 0.5;
                    rightUpperLeg.rotation.x = Math.sin(t * walkSpeed + Math.PI) * 0.5;
                }
                if (leftLowerLeg && rightLowerLeg) {
                    // Knees bend when leg moves back
                    leftLowerLeg.rotation.x = -Math.max(0, Math.sin(t * walkSpeed + Math.PI)) * 1.0; 
                    rightLowerLeg.rotation.x = -Math.max(0, Math.sin(t * walkSpeed)) * 1.0;
                }
                if (leftUpperArm && rightUpperArm) {
                    // Arms swing opposite to legs
                    leftUpperArm.rotation.x = Math.sin(t * walkSpeed + Math.PI) * 0.3;
                    leftUpperArm.rotation.z = Math.PI / 3.5;
                    rightUpperArm.rotation.x = Math.sin(t * walkSpeed) * 0.3;
                    rightUpperArm.rotation.z = -Math.PI / 3.5;
                }
                // Bobbing
                vrm.scene.position.y = Math.abs(Math.sin(t * walkSpeed)) * 0.05;
                break;

            case 'sleep':
               vrm.scene.rotation.x = THREE.MathUtils.lerp(vrm.scene.rotation.x, -Math.PI / 2, 0.1);
               vrm.scene.rotation.y = THREE.MathUtils.lerp(vrm.scene.rotation.y, 0, 0.1);
               vrm.scene.rotation.z = THREE.MathUtils.lerp(vrm.scene.rotation.z, 0, 0.1);
               // vrm.scene.position.y should be 0 relative to groupRef (which is at bed height)
               vrm.scene.position.y = THREE.MathUtils.lerp(vrm.scene.position.y, 0, 0.1); 
               
               // Arms relaxed
                if (leftUpperArm) leftUpperArm.rotation.z = THREE.MathUtils.lerp(leftUpperArm.rotation.z, 0.2, 0.1);
                if (rightUpperArm) rightUpperArm.rotation.z = THREE.MathUtils.lerp(rightUpperArm.rotation.z, -0.2, 0.1);
                break;

            case 'cry':
                // Cry: 3.0s - shaking shoulders and head down
                if (t < 3.0) {
                    if (spine) {
                        spine.rotation.x = Math.sin(t * 8) * 0.1; // Sobbing motion
                    }
                    if (head) {
                        head.rotation.x = -0.3; // Head down
                        head.rotation.y = Math.sin(t * 6) * 0.1; // Shaking
                    }
                    if (leftUpperArm && rightUpperArm) {
                        leftUpperArm.rotation.z = Math.PI / 2.5 + Math.sin(t * 7) * 0.1;
                        rightUpperArm.rotation.z = -Math.PI / 2.5 + Math.sin(t * 7) * 0.1;
                    }
                } else {
                    resetAction();
                }
                break;

            case 'think':
                // Think: 3.0s - hand on chin
                if (t < 3.0) {
                    if (rightUpperArm) {
                        rightUpperArm.rotation.x = -0.8; // Arm up
                        rightUpperArm.rotation.z = -0.5; // Arm forward
                    }
                    if (rightLowerArm) {
                        rightLowerArm.rotation.x = -1.2; // Hand to chin
                    }
                    if (head) {
                        head.rotation.x = 0.2; // Head tilted
                        head.rotation.y = 0.1; // Slight turn
                    }
                } else {
                    resetAction();
                }
                break;

            case 'clap':
                // Clap: 2.0s - hands together
                if (t < 2.0) {
                    const clapSpeed = 6;
                    if (leftUpperArm && rightUpperArm) {
                        leftUpperArm.rotation.x = -0.5;
                        leftUpperArm.rotation.z = 0.3;
                        rightUpperArm.rotation.x = -0.5;
                        rightUpperArm.rotation.z = -0.3;
                        
                        // Clapping motion
                        const clapOffset = Math.sin(t * clapSpeed) * 0.2;
                        leftUpperArm.rotation.z += clapOffset;
                        rightUpperArm.rotation.z -= clapOffset;
                    }
                } else {
                    resetAction();
                }
                break;

            case 'bow':
                // Bow: 2.0s - forward bend
                if (t < 2.0) {
                    if (spine) {
                        spine.rotation.x = 0.5; // Forward bend
                    }
                    if (head) {
                        head.rotation.x = 0.3; // Head down
                    }
                } else {
                    resetAction();
                }
                break;

            case 'run':
                // Run: faster version of walk
                vrm.scene.rotation.x = THREE.MathUtils.lerp(vrm.scene.rotation.x, 0, 0.1);
                vrm.scene.position.y = THREE.MathUtils.lerp(vrm.scene.position.y, 0, 0.1);

                const runSpeed = 15;
                
                if (leftUpperLeg && rightUpperLeg) {
                    leftUpperLeg.rotation.x = Math.sin(t * runSpeed) * 0.8;
                    rightUpperLeg.rotation.x = Math.sin(t * runSpeed + Math.PI) * 0.8;
                }
                if (leftLowerLeg && rightLowerLeg) {
                    leftLowerLeg.rotation.x = -Math.max(0, Math.sin(t * runSpeed + Math.PI)) * 1.5;
                    rightLowerLeg.rotation.x = -Math.max(0, Math.sin(t * runSpeed)) * 1.5;
                }
                if (leftUpperArm && rightUpperArm) {
                    leftUpperArm.rotation.x = Math.sin(t * runSpeed + Math.PI) * 0.5;
                    leftUpperArm.rotation.z = Math.PI / 3.5;
                    rightUpperArm.rotation.x = Math.sin(t * runSpeed) * 0.5;
                    rightUpperArm.rotation.z = -Math.PI / 3.5;
                }
                // More pronounced bobbing
                vrm.scene.position.y = Math.abs(Math.sin(t * runSpeed)) * 0.1;
                break;

            case 'angry_pose':
                // Angry: 2.0s - aggressive stance
                if (t < 2.0) {
                    if (spine) {
                        spine.rotation.x = -0.2; // Chest out
                    }
                    if (head) {
                        head.rotation.x = -0.2; // Head up
                    }
                    if (leftUpperArm && rightUpperArm) {
                        leftUpperArm.rotation.z = Math.PI / 2.0; // Arms out
                        rightUpperArm.rotation.z = -Math.PI / 2.0;
                    }
                } else {
                    resetAction();
                }
                break;

            case 'surprised_pose':
                // Surprised: 2.0s - arms up
                if (t < 2.0) {
                    if (leftUpperArm && rightUpperArm) {
                        leftUpperArm.rotation.x = -1.0; // Arms up
                        leftUpperArm.rotation.z = 0.2;
                        rightUpperArm.rotation.x = -1.0;
                        rightUpperArm.rotation.z = -0.2;
                    }
                    if (head) {
                        head.rotation.x = 0.1; // Head back
                    }
                } else {
                    resetAction();
                }
                break;

            case 'victory':
                // Victory: 2.0s - arms up in V shape
                if (t < 2.0) {
                    if (leftUpperArm && rightUpperArm) {
                        leftUpperArm.rotation.x = -1.2; // Arms up
                        leftUpperArm.rotation.z = 0.8; // V shape
                        rightUpperArm.rotation.x = -1.2;
                        rightUpperArm.rotation.z = -0.8;
                    }
                } else {
                    resetAction();
                }
                break;

            case 'defeat':
                // Defeat: 2.0s - slumped posture
                if (t < 2.0) {
                    if (spine) {
                        spine.rotation.x = 0.3; // Slumped
                    }
                    if (head) {
                        head.rotation.x = 0.4; // Head down
                    }
                    if (leftUpperArm && rightUpperArm) {
                        leftUpperArm.rotation.z = Math.PI / 3.0; // Arms relaxed
                        rightUpperArm.rotation.z = -Math.PI / 3.0;
                    }
                } else {
                    resetAction();
                }
                break;

            case 'idle_look_around':
                // Idle look around: continuous
                if (head) {
                    const lookSpeed = 0.5;
                    head.rotation.y = Math.sin(t * lookSpeed) * 0.3; // Looking around
                    head.rotation.x = Math.cos(t * lookSpeed * 0.7) * 0.1; // Up and down
                }
                break;

            case 'idle_stretch':
                // Idle stretch: 3.0s cycle
                const stretchCycle = t % 3.0;
                if (stretchCycle < 2.5) {
                    if (leftUpperArm && rightUpperArm) {
                        const stretchAmount = Math.sin(stretchCycle * Math.PI) * 0.3;
                        leftUpperArm.rotation.x = -0.5 - stretchAmount;
                        rightUpperArm.rotation.x = -0.5 - stretchAmount;
                    }
                    if (spine) {
                        spine.rotation.x = Math.sin(stretchCycle * Math.PI) * 0.1;
                    }
                }
                break;

            case 'sit_bed':
            case 'sit_sofa':
            case 'sit_chair':
                // Sitting pose
                // Hips down - Normalize to approx chair height (0.5m)
                // Default hips are around 0.8-0.9m. We need to lower them.
                // Note: hips.position is local to root. 
                // If we set it to 0.5, it puts hips at 0.5m from root.
                if (hips) hips.position.y = THREE.MathUtils.lerp(hips.position.y, 0.5, 0.1);
                // Thighs forward
                if (leftUpperLeg) leftUpperLeg.rotation.x = THREE.MathUtils.lerp(leftUpperLeg.rotation.x, -Math.PI / 2, 0.1);
                if (rightUpperLeg) rightUpperLeg.rotation.x = THREE.MathUtils.lerp(rightUpperLeg.rotation.x, -Math.PI / 2, 0.1);
                // Calves down
                if (leftLowerLeg) leftLowerLeg.rotation.x = THREE.MathUtils.lerp(leftLowerLeg.rotation.x, Math.PI / 2, 0.1);
                if (rightLowerLeg) rightLowerLeg.rotation.x = THREE.MathUtils.lerp(rightLowerLeg.rotation.x, Math.PI / 2, 0.1);
                break;

            case 'play_piano':
            case 'type_keyboard':
                // Sitting + Hands moving
                // Sit pose
                if (hips) hips.position.y = THREE.MathUtils.lerp(hips.position.y, 0.5, 0.1);
                if (leftUpperLeg) leftUpperLeg.rotation.x = THREE.MathUtils.lerp(leftUpperLeg.rotation.x, -Math.PI / 2, 0.1);
                if (rightUpperLeg) rightUpperLeg.rotation.x = THREE.MathUtils.lerp(rightUpperLeg.rotation.x, -Math.PI / 2, 0.1);
                if (leftLowerLeg) leftLowerLeg.rotation.x = THREE.MathUtils.lerp(leftLowerLeg.rotation.x, Math.PI / 2, 0.1);
                if (rightLowerLeg) rightLowerLeg.rotation.x = THREE.MathUtils.lerp(rightLowerLeg.rotation.x, Math.PI / 2, 0.1);

                // Arms forward
                if (leftUpperArm) {
                    leftUpperArm.rotation.x = THREE.MathUtils.lerp(leftUpperArm.rotation.x, -0.5, 0.1);
                    leftUpperArm.rotation.z = THREE.MathUtils.lerp(leftUpperArm.rotation.z, 0.3, 0.1);
                }
                if (rightUpperArm) {
                    rightUpperArm.rotation.x = THREE.MathUtils.lerp(rightUpperArm.rotation.x, -0.5, 0.1);
                    rightUpperArm.rotation.z = THREE.MathUtils.lerp(rightUpperArm.rotation.z, -0.3, 0.1);
                }
                
                // Hands moving
                const handSpeed = currentAction === 'play_piano' ? 15 : 20;
                const handAmp = currentAction === 'play_piano' ? 0.2 : 0.1;
                
                if (leftLowerArm) {
                    leftLowerArm.rotation.x = THREE.MathUtils.lerp(leftLowerArm.rotation.x, -1.0 + Math.sin(t * handSpeed) * handAmp, 0.2);
                }
                if (rightLowerArm) {
                    rightLowerArm.rotation.x = THREE.MathUtils.lerp(rightLowerArm.rotation.x, -1.0 + Math.cos(t * handSpeed) * handAmp, 0.2);
                }
                break;

            case 'lie_sofa':
                 vrm.scene.rotation.x = THREE.MathUtils.lerp(vrm.scene.rotation.x, -Math.PI / 2, 0.1);
                 // vrm.scene.position.y should be 0 relative to groupRef (which is at sofa height)
                 vrm.scene.position.y = THREE.MathUtils.lerp(vrm.scene.position.y, 0, 0.1);
                 if (leftUpperArm) leftUpperArm.rotation.z = THREE.MathUtils.lerp(leftUpperArm.rotation.z, 0.5, 0.1);
                 if (rightUpperArm) rightUpperArm.rotation.z = THREE.MathUtils.lerp(rightUpperArm.rotation.z, -0.5, 0.1);
                 break;

            case 'brew_coffee':
                // Brew coffee: 4.0s
                if (t < 4.0) {
                     if (t < 1.0) {
                        // Press button
                        if (rightUpperArm) {
                            rightUpperArm.rotation.x = THREE.MathUtils.lerp(rightUpperArm.rotation.x, -0.5, 0.1);
                            rightUpperArm.rotation.z = THREE.MathUtils.lerp(rightUpperArm.rotation.z, -0.2, 0.1);
                        }
                        if (rightLowerArm) rightLowerArm.rotation.x = THREE.MathUtils.lerp(rightLowerArm.rotation.x, -0.5, 0.1);
                     } else if (t < 3.0) {
                        // Wait - arm down slightly
                        if (rightUpperArm) rightUpperArm.rotation.x = THREE.MathUtils.lerp(rightUpperArm.rotation.x, 0, 0.1);
                        if (rightLowerArm) rightLowerArm.rotation.x = THREE.MathUtils.lerp(rightLowerArm.rotation.x, -0.2, 0.1);
                        
                        // Look intently
                        if (head) head.rotation.x = THREE.MathUtils.lerp(head.rotation.x, 0.1, 0.1);
                     } else {
                        // Smell coffee
                        if (head) head.rotation.x = THREE.MathUtils.lerp(head.rotation.x, -0.1, 0.1); 
                     }
                } else {
                    resetAction();
                }
                break;

            case 'crouch':
                // Crouch: 2.0s or hold
                // Squat down
                if (t < 2.0) {
                    if (hips) hips.position.y = THREE.MathUtils.lerp(hips.position.y, 0.5, 0.1);
                    if (leftUpperLeg) leftUpperLeg.rotation.x = THREE.MathUtils.lerp(leftUpperLeg.rotation.x, -1.0, 0.1);
                    if (rightUpperLeg) rightUpperLeg.rotation.x = THREE.MathUtils.lerp(rightUpperLeg.rotation.x, -1.0, 0.1);
                    if (leftLowerLeg) leftLowerLeg.rotation.x = THREE.MathUtils.lerp(leftLowerLeg.rotation.x, 2.0, 0.1);
                    if (rightLowerLeg) rightLowerLeg.rotation.x = THREE.MathUtils.lerp(rightLowerLeg.rotation.x, 2.0, 0.1);
                } else {
                    resetAction();
                }
                break;

            case 'reach_out':
                // Reach out: 2.0s
                if (t < 2.0) {
                    if (rightUpperArm) {
                        rightUpperArm.rotation.x = THREE.MathUtils.lerp(rightUpperArm.rotation.x, -Math.PI / 2, 0.1);
                        rightUpperArm.rotation.z = THREE.MathUtils.lerp(rightUpperArm.rotation.z, 0, 0.1);
                    }
                    if (rightLowerArm) {
                        rightLowerArm.rotation.x = THREE.MathUtils.lerp(rightLowerArm.rotation.x, 0, 0.1); // Straighten
                    }
                    if (spine) {
                        spine.rotation.x = THREE.MathUtils.lerp(spine.rotation.x, 0.2, 0.1); // Lean forward
                    }
                } else {
                    resetAction();
                }
                break;

            // ... Handle other cases or default to idle transition
            default:
                // For unhandled actions, just wait a bit then reset
                if (t > 1.0) resetAction();
                break;
        }
        }
    } else {
      // Scene Reset (Smooth Reset)
      vrm.scene.rotation.x = THREE.MathUtils.lerp(vrm.scene.rotation.x, 0, 0.1);
      vrm.scene.rotation.z = THREE.MathUtils.lerp(vrm.scene.rotation.z, 0, 0.1);
      vrm.scene.position.y = THREE.MathUtils.lerp(vrm.scene.position.y, 0, 0.1);

      // Bone Reset (Smooth Reset)
      // Reset Head
      const head = vrm.humanoid?.getNormalizedBoneNode('head');
      if (head) {
        head.rotation.x = THREE.MathUtils.lerp(head.rotation.x, 0, 0.1);
        head.rotation.y = THREE.MathUtils.lerp(head.rotation.y, 0, 0.1);
        head.rotation.z = THREE.MathUtils.lerp(head.rotation.z, 0, 0.1);
      }
      const spine = vrm.humanoid?.getNormalizedBoneNode('spine');
      if (spine) {
        spine.rotation.x = THREE.MathUtils.lerp(spine.rotation.x, 0, 0.1);
        spine.rotation.z = THREE.MathUtils.lerp(spine.rotation.z, 0, 0.1);
        spine.rotation.y = THREE.MathUtils.lerp(spine.rotation.y, 0, 0.1);
      }
       const hips = vrm.humanoid?.getNormalizedBoneNode('hips');
      if (hips) {
        hips.position.x = THREE.MathUtils.lerp(hips.position.x, 0, 0.05);
      }
      const leftUpperArm = vrm.humanoid?.getNormalizedBoneNode('leftUpperArm');
      if (leftUpperArm) {
        leftUpperArm.rotation.z = THREE.MathUtils.lerp(leftUpperArm.rotation.z, Math.PI / 2.5, 0.1);
        leftUpperArm.rotation.x = THREE.MathUtils.lerp(leftUpperArm.rotation.x, 0, 0.1);
        leftUpperArm.rotation.y = THREE.MathUtils.lerp(leftUpperArm.rotation.y, 0, 0.1);
      }
      const rightUpperArm = vrm.humanoid?.getNormalizedBoneNode('rightUpperArm');
      if (rightUpperArm) {
        rightUpperArm.rotation.z = THREE.MathUtils.lerp(rightUpperArm.rotation.z, -Math.PI / 2.5, 0.1);
        rightUpperArm.rotation.x = THREE.MathUtils.lerp(rightUpperArm.rotation.x, 0, 0.1);
        rightUpperArm.rotation.y = THREE.MathUtils.lerp(rightUpperArm.rotation.y, 0, 0.1);
      }
      // Reset lower arms (elbows) too, just in case
      const leftLowerArm = vrm.humanoid?.getNormalizedBoneNode('leftLowerArm');
      if (leftLowerArm) {
        leftLowerArm.rotation.z = THREE.MathUtils.lerp(leftLowerArm.rotation.z, 0, 0.1);
        leftLowerArm.rotation.x = THREE.MathUtils.lerp(leftLowerArm.rotation.x, 0, 0.1);
        leftLowerArm.rotation.y = THREE.MathUtils.lerp(leftLowerArm.rotation.y, 0, 0.1);
      }
      const rightLowerArm = vrm.humanoid?.getNormalizedBoneNode('rightLowerArm');
      if (rightLowerArm) {
        rightLowerArm.rotation.z = THREE.MathUtils.lerp(rightLowerArm.rotation.z, 0, 0.1);
        rightLowerArm.rotation.x = THREE.MathUtils.lerp(rightLowerArm.rotation.x, 0, 0.1);
        rightLowerArm.rotation.y = THREE.MathUtils.lerp(rightLowerArm.rotation.y, 0, 0.1);
      }
      
      // Reset Legs
      const leftUpperLeg = vrm.humanoid?.getNormalizedBoneNode('leftUpperLeg');
      if (leftUpperLeg) {
          leftUpperLeg.rotation.x = THREE.MathUtils.lerp(leftUpperLeg.rotation.x, 0, 0.1);
          leftUpperLeg.rotation.z = THREE.MathUtils.lerp(leftUpperLeg.rotation.z, 0, 0.1);
          leftUpperLeg.rotation.y = THREE.MathUtils.lerp(leftUpperLeg.rotation.y, 0, 0.1);
      }
      const rightUpperLeg = vrm.humanoid?.getNormalizedBoneNode('rightUpperLeg');
      if (rightUpperLeg) {
          rightUpperLeg.rotation.x = THREE.MathUtils.lerp(rightUpperLeg.rotation.x, 0, 0.1);
          rightUpperLeg.rotation.z = THREE.MathUtils.lerp(rightUpperLeg.rotation.z, 0, 0.1);
          rightUpperLeg.rotation.y = THREE.MathUtils.lerp(rightUpperLeg.rotation.y, 0, 0.1);
      }
      const leftLowerLeg = vrm.humanoid?.getNormalizedBoneNode('leftLowerLeg');
      if (leftLowerLeg) leftLowerLeg.rotation.x = THREE.MathUtils.lerp(leftLowerLeg.rotation.x, 0, 0.1);
      const rightLowerLeg = vrm.humanoid?.getNormalizedBoneNode('rightLowerLeg');
      if (rightLowerLeg) rightLowerLeg.rotation.x = THREE.MathUtils.lerp(rightLowerLeg.rotation.x, 0, 0.1);

      // Reset Hands
      const leftHand = vrm.humanoid?.getNormalizedBoneNode('leftHand');
      if (leftHand) {
          leftHand.rotation.x = THREE.MathUtils.lerp(leftHand.rotation.x, 0, 0.1);
          leftHand.rotation.y = THREE.MathUtils.lerp(leftHand.rotation.y, 0, 0.1);
          leftHand.rotation.z = THREE.MathUtils.lerp(leftHand.rotation.z, 0, 0.1);
      }
      const rightHand = vrm.humanoid?.getNormalizedBoneNode('rightHand');
      if (rightHand) {
          rightHand.rotation.x = THREE.MathUtils.lerp(rightHand.rotation.x, 0, 0.1);
          rightHand.rotation.y = THREE.MathUtils.lerp(rightHand.rotation.y, 0, 0.1);
          rightHand.rotation.z = THREE.MathUtils.lerp(rightHand.rotation.z, 0, 0.1);
      }

    }
  });

  return {};
};
