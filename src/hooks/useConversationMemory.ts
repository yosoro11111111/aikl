'use client';

import { useCallback, useRef } from 'react';
import { useStore, Message } from '@/store/useStore';

// 对话记忆结构
interface ConversationMemory {
  summary: string; // 对话摘要
  keyPoints: string[]; // 关键信息点
  userPreferences: string[]; // 用户偏好
  emotionalTrend: string; // 情感趋势
  lastInteractionTime: number; // 最后交互时间
}

// 记忆管理配置
const MEMORY_CONFIG = {
  maxSummaryLength: 200, // 摘要最大长度
  maxKeyPoints: 10, // 最大关键点数
  memoryDecayHours: 24, // 记忆衰减时间（小时）
  contextWindow: 10 // 上下文窗口大小（消息数）
};

export const useConversationMemory = () => {
  const { messages, personality, interactionHistory } = useStore();
  const memoryRef = useRef<ConversationMemory>({
    summary: '',
    keyPoints: [],
    userPreferences: [],
    emotionalTrend: 'neutral',
    lastInteractionTime: Date.now()
  });

  // 提取对话摘要
  const extractSummary = useCallback((recentMessages: Message[]): string => {
    if (recentMessages.length === 0) return '';
    
    const userMessages = recentMessages
      .filter(msg => msg.role === 'user')
      .slice(-5) // 最近5条用户消息
      .map(msg => msg.content)
      .join('。');

    // 简单的关键词提取（实际应用中可以使用更复杂的NLP）
    const keywords = ['喜欢', '讨厌', '想要', '觉得', '认为', '希望'];
    let summary = '';

    for (const keyword of keywords) {
      if (userMessages.includes(keyword)) {
        const sentences = userMessages.split('。');
        const relevantSentence = sentences.find(s => s.includes(keyword));
        if (relevantSentence) {
          summary += relevantSentence.trim() + '。';
        }
      }
    }

    return summary.slice(0, MEMORY_CONFIG.maxSummaryLength);
  }, []);

  // 提取关键信息点
  const extractKeyPoints = useCallback((recentMessages: Message[]): string[] => {
    const points: string[] = [];
    
    // 提取用户提到的具体信息
    recentMessages.forEach(msg => {
      if (msg.role === 'user') {
        const content = msg.content;
        
        // 检测具体信息（如时间、地点、人物等）
        const patterns = [
          /(我|我的)(\S+)(喜欢|讨厌|想要)/g,
          /(明天|今天|昨天|周末)/g,
          /(电影|音乐|游戏|食物)/g,
          /(朋友|家人|同事)/g
        ];

        patterns.forEach(pattern => {
          const matches = content.match(pattern);
          if (matches) {
            points.push(...matches);
          }
        });
      }
    });

    return [...new Set(points)].slice(0, MEMORY_CONFIG.maxKeyPoints);
  }, []);

  // 分析情感趋势
  const analyzeEmotionalTrend = useCallback((recentMessages: Message[]): string => {
    const positiveWords = ['开心', '高兴', '喜欢', '爱', '棒', '好'];
    const negativeWords = ['伤心', '难过', '生气', '讨厌', '不好', '糟糕'];
    
    let positiveCount = 0;
    let negativeCount = 0;

    recentMessages.forEach(msg => {
      if (msg.role === 'user') {
        const content = msg.content;
        positiveWords.forEach(word => {
          if (content.includes(word)) positiveCount++;
        });
        negativeWords.forEach(word => {
          if (content.includes(word)) negativeCount++;
        });
      }
    });

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }, []);

  // 更新记忆
  const updateMemory = useCallback(() => {
    const recentMessages = messages.slice(-MEMORY_CONFIG.contextWindow);
    
    memoryRef.current = {
      summary: extractSummary(recentMessages),
      keyPoints: extractKeyPoints(recentMessages),
      userPreferences: [...new Set([
        ...memoryRef.current.userPreferences,
        ...extractKeyPoints(recentMessages)
      ])].slice(0, MEMORY_CONFIG.maxKeyPoints),
      emotionalTrend: analyzeEmotionalTrend(recentMessages),
      lastInteractionTime: Date.now()
    };
  }, [messages, extractSummary, extractKeyPoints, analyzeEmotionalTrend]);

  // 获取上下文提示
  const getContextPrompt = useCallback((): string => {
    const memory = memoryRef.current;
    
    let prompt = '当前对话上下文：\n';
    
    if (memory.summary) {
      prompt += `对话摘要：${memory.summary}\n`;
    }
    
    if (memory.keyPoints.length > 0) {
      prompt += `关键信息：${memory.keyPoints.join('，')}\n`;
    }
    
    if (memory.userPreferences.length > 0) {
      prompt += `用户偏好：${memory.userPreferences.join('，')}\n`;
    }
    
    prompt += `情感趋势：${memory.emotionalTrend === 'positive' ? '积极' : memory.emotionalTrend === 'negative' ? '消极' : '中性'}\n`;
    prompt += `人格设定：${personality === 'tsundere' ? '傲娇' : personality === 'sweet' ? '温柔' : '普通'}\n`;
    
    return prompt;
  }, [personality]);

  // 检查记忆是否需要更新（基于时间衰减）
  const shouldUpdateMemory = useCallback((): boolean => {
    const hoursSinceLastUpdate = (Date.now() - memoryRef.current.lastInteractionTime) / (1000 * 60 * 60);
    return hoursSinceLastUpdate >= MEMORY_CONFIG.memoryDecayHours;
  }, []);

  // 清除过期记忆
  const clearExpiredMemory = useCallback(() => {
    if (shouldUpdateMemory()) {
      memoryRef.current = {
        summary: '',
        keyPoints: [],
        userPreferences: [],
        emotionalTrend: 'neutral',
        lastInteractionTime: Date.now()
      };
    }
  }, [shouldUpdateMemory]);

  return {
    updateMemory,
    getContextPrompt,
    clearExpiredMemory,
    getMemory: () => memoryRef.current
  };
};