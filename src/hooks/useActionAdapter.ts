import { useEffect, useState } from 'react';
import { VRM } from '@pixiv/three-vrm';
import { VRMAnalyzer } from '@/utils/vrmAnalyzer';
import { useStore } from '@/store/useStore';

// 动作适配器配置
interface ActionAdapterConfig {
  modelId: string;
  modelName: string;
  fileName: string;
  specialActions: Array<{
    id: string;
    name: string;
    animation: string;
    priority: number;
    duration: number;
    conditions: {
      emotion: string[];
      minAffection: number;
    };
  }>;
  expressions: Array<{
    preset: string;
    intensity: number;
    blendShape: string;
  }>;
}

/**
 * VRM动作适配器
 * 自动分析VRM文件并适配特殊动作
 */
export const useActionAdapter = (vrm: VRM | null, modelId: string, fileName: string) => {
  const { currentEmotion, affection, setAction, addMessage } = useStore();
  const [adapterConfig, setAdapterConfig] = useState<ActionAdapterConfig | null>(null);
  const [isAnalyzed, setIsAnalyzed] = useState(false);

  useEffect(() => {
    if (!vrm || isAnalyzed) return;

    const analyzeVRM = async () => {
      try {
        // 分析VRM文件
        const actionInfo = await VRMAnalyzer.analyzeVRM(vrm, fileName);
        
        // 生成适配配置
        const config = VRMAnalyzer.generateActionConfig(actionInfo);
        
        setAdapterConfig({
          modelId,
          modelName: config.modelName,
          fileName: config.fileName,
          specialActions: config.specialActions,
          expressions: config.expressions
        });

        setIsAnalyzed(true);

        // 通知用户分析结果
        if (actionInfo.specialActions.length > 0) {
          addMessage({
            id: `action-analysis-${Date.now()}`,
            role: 'system',
            content: `检测到 ${actionInfo.modelName} 的特殊动作: ${actionInfo.specialActions.map(a => a.name).join(', ')}`,
            timestamp: Date.now()
          });
        }

        console.log(`VRM分析完成: ${actionInfo.modelName}`, actionInfo);

      } catch (error) {
        console.error('VRM分析失败:', error);
        setIsAnalyzed(true);
      }
    };

    analyzeVRM();
  }, [vrm, modelId, fileName, isAnalyzed, addMessage]);

  /**
   * 触发特殊动作
   */
  const triggerSpecialAction = (actionId: string) => {
    if (!adapterConfig) return false;

    const action = adapterConfig.specialActions.find(a => a.id === actionId);
    if (!action) return false;

    // 检查条件
    const meetsConditions = 
      action.conditions.emotion.includes(currentEmotion) &&
      affection >= action.conditions.minAffection;

    if (meetsConditions) {
      setAction(action.animation as any);
      
      // 自动恢复闲置状态
      setTimeout(() => {
        setAction('idle');
      }, action.duration);

      return true;
    }

    return false;
  };

  /**
   * 获取可用的特殊动作
   */
  const getAvailableActions = () => {
    if (!adapterConfig) return [];

    return adapterConfig.specialActions.filter(action => 
      action.conditions.emotion.includes(currentEmotion) &&
      affection >= action.conditions.minAffection
    );
  };

  /**
   * 随机触发一个合适的特殊动作
   */
  const triggerRandomAction = () => {
    const availableActions = getAvailableActions();
    if (availableActions.length === 0) return false;

    const randomAction = availableActions[Math.floor(Math.random() * availableActions.length)];
    return triggerSpecialAction(randomAction.id);
  };

  /**
   * 根据情感自动触发动作
   */
  const triggerEmotionBasedAction = () => {
    if (!adapterConfig) return false;

    const emotionActions: Record<string, string[]> = {
      'happy': ['dance', 'wave', 'victory', 'laugh'],
      'excited': ['jump', 'dance', 'victory'],
      'sad': ['bow', 'shy'],
      'angry': ['sword', 'lightning'],
      'shy': ['bow', 'shy'],
      'neutral': ['wave', 'bow']
    };

    const availableEmotionActions = emotionActions[currentEmotion] || [];
    const matchingActions = adapterConfig.specialActions.filter(action =>
      availableEmotionActions.includes(action.id) &&
      action.conditions.emotion.includes(currentEmotion) &&
      affection >= action.conditions.minAffection
    );

    if (matchingActions.length > 0) {
      const randomAction = matchingActions[Math.floor(Math.random() * matchingActions.length)];
      return triggerSpecialAction(randomAction.id);
    }

    return false;
  };

  return {
    adapterConfig,
    isAnalyzed,
    triggerSpecialAction,
    getAvailableActions,
    triggerRandomAction,
    triggerEmotionBasedAction
  };
};