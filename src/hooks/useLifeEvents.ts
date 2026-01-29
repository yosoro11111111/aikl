import { useEffect, useRef } from 'react';
import { useStore } from '@/store/useStore';
import { useSoundManager } from '@/hooks/useSoundManager';

const IDLE_THRESHOLDS = {
  SHORT: 30 * 1000, // 30s for testing (usually 5 min)
  LONG: 60 * 1000, // 60s for testing (usually 1 hour)
};

export const useLifeEvents = () => {
  const { 
    lastLoginDate, 
    updateLoginDate, 
    lastInteractionTime, 
    addMessage, 
    isTalking, 
    personality,
    affection,
    setAction,
    setEmotion
  } = useStore();
  
  const { playSound } = useSoundManager();
  const hasGreetedRef = useRef(false);

  // Daily Greeting
  useEffect(() => {
    if (hasGreetedRef.current) return;

    const today = new Date().toDateString();
    if (lastLoginDate !== today) {
      const hour = new Date().getHours();
      let greeting = '';
      let action = 'wave';
      let emotion = 'happy';

      if (hour >= 5 && hour < 12) {
        greeting = '早安！昨晚睡得好吗？新的一天也要加油哦！';
        action = 'stretch';
      } else if (hour >= 12 && hour < 18) {
        greeting = '下午好！工作辛苦了，要不要休息一下？';
        action = 'wave';
      } else if (hour >= 18 && hour < 23) {
        greeting = '晚上好！终于可以放松一下了呢。';
        action = 'relax';
      } else {
        greeting = '这么晚了还不睡吗？要注意身体哦...';
        action = 'sleepy';
        emotion = 'worry';
      }

      // Personality adjustments
      if (personality === 'tsundere') {
        if (hour < 12) greeting = '哼，起得真晚... 早、早安。';
        else greeting = '你怎么才来？我才没有在等你呢！';
        emotion = 'pout';
      }

      addMessage({
        role: 'assistant',
        content: `[emotion:${emotion}] [action:${action}] ${greeting}`,
        id: Date.now().toString()
      });
      playSound('greeting');
      updateLoginDate();
      hasGreetedRef.current = true;
    }
  }, [lastLoginDate, updateLoginDate, addMessage, personality, playSound]);

  // Idle Chatter
  useEffect(() => {
    const checkIdle = () => {
      if (isTalking) return;

      const now = Date.now();
      const idleTime = now - lastInteractionTime;

      // Only trigger if we haven't triggered recently (using a random chance to avoid spam)
      if (Math.random() > 0.3) return; 

      if (idleTime > IDLE_THRESHOLDS.SHORT && idleTime < IDLE_THRESHOLDS.LONG) {
        // Short idle
        const topics = [
            '盯着屏幕太久眼睛会酸哦~',
            '今天有什么开心的事吗？',
            '虽然我不懂代码，但我会陪着你的。',
            '有点无聊呢...',
            '不知道今晚吃什么...'
        ];
        const randomTopic = topics[Math.floor(Math.random() * topics.length)];
        
        addMessage({
            role: 'assistant',
            content: `[emotion:neutral] [action:idle_look_around] ${randomTopic}`,
            id: Date.now().toString()
        });
        playSound('notification');
        // Update interaction time so we don't spam
        useStore.getState().updateLastInteractionTime(); 
      }
    };

    const interval = setInterval(checkIdle, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [lastInteractionTime, isTalking, addMessage, playSound]);
};
