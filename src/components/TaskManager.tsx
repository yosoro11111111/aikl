'use client';

import { useEffect } from 'react';
import { useStore } from '@/store/useStore';

export default function TaskManager() {
  const { stats, tasks, completeTask, addAffection, unlockAchievement, achievements } = useStore();

  // Check tasks
  useEffect(() => {
    tasks.forEach(task => {
      if (task.completed) return;

      let completed = false;
      // Use task.progress instead of stats to avoid synchronization issues
      if (task.progress >= task.target) {
        completed = true;
      }

      if (completed) {
        completeTask(task.id);
        // Reward logic
        if (task.reward.includes('亲密度')) {
           addAffection(10);
        }
        // Use a simple alert or console log if toast is not available, but toast is better.
        // Assuming toast is not installed, I will use browser notification style or just console for now.
        // Or better, I'll assume I can add a simple notification UI later.
        console.log(`Task Completed: ${task.description}`);
      }
    });
  }, [stats, tasks, completeTask, addAffection]);

  // Check achievements
  useEffect(() => {
    achievements.forEach(achievement => {
      if (achievement.unlocked) return;

      let unlocked = false;
      if (achievement.id === 'best_friend' && useStore.getState().affection >= 100) {
        unlocked = true;
      } else if (achievement.id === 'decorator' && useStore.getState().furniture.length >= 5) {
        unlocked = true;
      }

      if (unlocked) {
        unlockAchievement(achievement.id);
        console.log(`Achievement Unlocked: ${achievement.title}`);
      }
    });
  }, [stats, achievements, unlockAchievement]);

  return null;
}
