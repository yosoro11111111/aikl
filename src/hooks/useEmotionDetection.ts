'use client';

import { useCallback } from 'react';

// 情感类型定义
export type EmotionType = 'happy' | 'sad' | 'angry' | 'surprised' | 'neutral' | 'love' | 'shy' | 'excited';

// 情感关键词映射
const EMOTION_KEYWORDS: Record<EmotionType, string[]> = {
  happy: ['开心', '高兴', '快乐', '哈哈', '嘻嘻', '😊', '😄', '太好了', '真棒'],
  sad: ['伤心', '难过', '悲伤', '哭', '😢', '😭', '不开心', '失望'],
  angry: ['生气', '愤怒', '气死', '😠', '😡', '讨厌', '烦人'],
  surprised: ['惊讶', '惊奇', '哇', '😲', '天啊', '没想到'],
  love: ['爱', '喜欢', '爱你', '💕', '❤️', '心动', '可爱'],
  shy: ['害羞', '不好意思', '脸红', '😳', '腼腆'],
  excited: ['兴奋', '激动', '太棒了', '🎉', '激动人心', '期待'],
  neutral: []
};

// 情感强度检测
const EMOTION_INTENSITY: Record<string, number> = {
  '非常': 2,
  '特别': 2,
  '超级': 2,
  '极其': 2,
  '很': 1.5,
  '挺': 1.2,
  '有点': 0.8,
  '稍微': 0.8,
  '不太': 0.5,
  '不': -1
};

interface EmotionResult {
  emotion: EmotionType;
  intensity: number; // 0-2 的情感强度
  confidence: number; // 0-1 的置信度
}

export const useEmotionDetection = () => {
  // 检测文本中的情感
  const detectEmotion = useCallback((text: string): EmotionResult => {
    const lowerText = text.toLowerCase();
    let detectedEmotion: EmotionType = 'neutral';
    let maxConfidence = 0;
    let intensity = 1;

    // 检测情感关键词
    for (const [emotion, keywords] of Object.entries(EMOTION_KEYWORDS)) {
      let confidence = 0;
      
      for (const keyword of keywords) {
        if (lowerText.includes(keyword)) {
          confidence += 0.3; // 每个关键词增加置信度
          
          // 检测情感强度修饰词
          for (const [intensityWord, intensityValue] of Object.entries(EMOTION_INTENSITY)) {
            if (lowerText.includes(intensityWord + keyword) || 
                lowerText.includes(keyword + intensityWord)) {
              intensity = intensityValue;
              break;
            }
          }
        }
      }
      
      if (confidence > maxConfidence) {
        maxConfidence = confidence;
        detectedEmotion = emotion as EmotionType;
      }
    }

    // 检测表情符号
    const emojiPatterns = {
      '😊😄😂🤣': 'happy',
      '😢😭😔': 'sad',
      '😠😡👿': 'angry',
      '😲😮🤯': 'surprised',
      '❤️💕😍': 'love',
      '😳🙈': 'shy',
      '🎉🥳✨': 'excited'
    };

    for (const [emojis, emotion] of Object.entries(emojiPatterns)) {
      for (const emoji of emojis) {
        if (text.includes(emoji)) {
          if (0.4 > maxConfidence) { // 表情符号的置信度
            maxConfidence = 0.4;
            detectedEmotion = emotion as EmotionType;
          }
          break;
        }
      }
    }

    // 限制置信度在 0-1 之间
    const finalConfidence = Math.min(Math.max(maxConfidence, 0), 1);
    
    return {
      emotion: detectedEmotion,
      intensity: Math.max(0, intensity), // 确保强度非负
      confidence: finalConfidence
    };
  }, []);

  // 根据情感生成AI回应风格
  const getResponseStyle = useCallback((emotion: EmotionType, intensity: number): string => {
    const styles: Record<EmotionType, string> = {
      happy: `用${intensity > 1 ? '非常开心' : '开心'}的语气回应`,
      sad: `用${intensity > 1 ? '非常温柔安慰' : '温柔'}的语气回应`,
      angry: `用${intensity > 1 ? '非常冷静安抚' : '冷静'}的语气回应`,
      surprised: `用${intensity > 1 ? '非常惊讶好奇' : '惊讶'}的语气回应`,
      love: `用${intensity > 1 ? '非常甜蜜温柔' : '甜蜜'}的语气回应`,
      shy: `用${intensity > 1 ? '非常害羞腼腆' : '害羞'}的语气回应`,
      excited: `用${intensity > 1 ? '非常兴奋激动' : '兴奋'}的语气回应`,
      neutral: '用自然友好的语气回应'
    };

    return styles[emotion];
  }, []);

  // 获取情感对应的表情动作
  const getEmotionAction = useCallback((emotion: EmotionType): string => {
    const actions: Record<EmotionType, string> = {
      happy: 'nod',
      sad: 'cry',
      angry: 'angry_pose',
      surprised: 'surprised_pose',
      love: 'shy_pose',
      shy: 'shy_pose',
      excited: 'jump',
      neutral: 'idle'
    };

    return actions[emotion];
  }, []);

  return {
    detectEmotion,
    getResponseStyle,
    getEmotionAction
  };
};