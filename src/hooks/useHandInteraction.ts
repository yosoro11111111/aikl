import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { VRM } from '@pixiv/three-vrm';
import * as THREE from 'three';

export const useHandInteraction = (vrm: VRM | null) => {
  const { size, camera } = useThree();
  
  useFrame((state, delta) => {
    if (!vrm) return;

    const leftArm = vrm.humanoid.getNormalizedBoneNode('leftUpperArm');
    const rightArm = vrm.humanoid.getNormalizedBoneNode('rightUpperArm');
    const leftLowerArm = vrm.humanoid.getNormalizedBoneNode('leftLowerArm');
    const rightLowerArm = vrm.humanoid.getNormalizedBoneNode('rightLowerArm');
    const leftHand = vrm.humanoid.getNormalizedBoneNode('leftHand');
    const rightHand = vrm.humanoid.getNormalizedBoneNode('rightHand');

    // 鼠标归一化坐标 (-1 to 1)
    const mouseX = state.pointer.x;
    const mouseY = state.pointer.y;
    
    // 简单的距离检测 (基于屏幕空间)
    const isLeftReach = mouseX > 0.3 && mouseX < 0.8 && mouseY > -0.5 && mouseY < 0.5; // 注意: VRM通常面向-Z, 屏幕右侧对应模型左手(如果没镜像)
    // 修正: 屏幕右侧(x>0)其实是对应模型的"左手" (观众视角)
    
    // 伸手逻辑
    if (leftArm && leftLowerArm && leftHand) {
      if (isLeftReach) {
        // 目标旋转: 抬起手臂指向鼠标
        // 这里简化为根据鼠标Y轴调整手臂抬起角度
        const targetZ = Math.PI / 2.5 - (mouseY * 0.5); // 上下
        const targetY = (mouseX - 0.3) * 1.0; // 前后/左右

        // 平滑插值 - Smoother factors (3 instead of 5)
        leftArm.rotation.z = THREE.MathUtils.lerp(leftArm.rotation.z, 1.2, delta * 3); // 抬起
        leftArm.rotation.y = THREE.MathUtils.lerp(leftArm.rotation.y, 0.5 + targetY, delta * 3); // 指向
        
        // 小臂稍微弯曲
        leftLowerArm.rotation.z = THREE.MathUtils.lerp(leftLowerArm.rotation.z, 0, delta * 3); // 伸直
        
        // 手掌张开
        leftHand.rotation.x = THREE.MathUtils.lerp(leftHand.rotation.x, -0.2, delta * 3);
      } else {
        // 复位 (回到默认姿势 - 可以在 Avatar.tsx 中定义的初始姿势)
        // 这里的复位由 Avatar.tsx 的初始设置决定，或者我们在这里缓慢恢复默认
        // 为了简单，我们只在"激活"时接管控制。不激活时，Avatar.tsx 或 idle 动画可能会控制它?
        // 实际上，如果不持续设置，它会保持最后状态。所以需要复位逻辑。
        
        // 假设默认姿势: z = Math.PI / 2.5, y = 0.1
        leftArm.rotation.z = THREE.MathUtils.lerp(leftArm.rotation.z, Math.PI / 2.5, delta * 2);
        leftArm.rotation.y = THREE.MathUtils.lerp(leftArm.rotation.y, 0.1, delta * 2);
        leftLowerArm.rotation.z = THREE.MathUtils.lerp(leftLowerArm.rotation.z, 0, delta * 2);
      }
    }

    // 简单的右手逻辑 (镜像)
    // 屏幕左侧(x<0) -> 右手
    const isRightReach = mouseX < -0.3 && mouseX > -0.8 && mouseY > -0.5 && mouseY < 0.5;
    
    if (rightArm && rightLowerArm && rightHand) {
        if (isRightReach) {
            const targetY = (mouseX + 0.3) * 1.0; 

            rightArm.rotation.z = THREE.MathUtils.lerp(rightArm.rotation.z, -1.2, delta * 3);
            rightArm.rotation.y = THREE.MathUtils.lerp(rightArm.rotation.y, -0.5 + targetY, delta * 3);
            rightLowerArm.rotation.z = THREE.MathUtils.lerp(rightLowerArm.rotation.z, 0, delta * 3);
             rightHand.rotation.x = THREE.MathUtils.lerp(rightHand.rotation.x, -0.2, delta * 3);
        } else {
             // 复位
             rightArm.rotation.z = THREE.MathUtils.lerp(rightArm.rotation.z, -Math.PI / 2.5, delta * 2);
             rightArm.rotation.y = THREE.MathUtils.lerp(rightArm.rotation.y, -0.1, delta * 2);
             rightLowerArm.rotation.z = THREE.MathUtils.lerp(rightLowerArm.rotation.z, 0, delta * 2);
        }
    }

  });
};
