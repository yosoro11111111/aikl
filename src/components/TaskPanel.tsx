'use client';

import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardList, Trophy, X } from 'lucide-react';
import { Panel } from '@/components/ui/Panel';
import { Button } from '@/components/ui/Button';

export default function TaskPanel() {
  const { tasks, achievements, activePanel, setActivePanel } = useStore();
  const isOpen = activePanel === 'tasks';
  const [activeTab, setActiveTab] = useState<'tasks' | 'achievements'>('tasks');

  const completedTasks = tasks.filter(t => t.completed).length;
  const totalTasks = tasks.length;
  const unlockedAchievements = achievements.filter(a => a.unlocked).length;

  return (
    <>
      {/* Button moved to SystemControls */}

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
            <Panel
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              className="w-full max-w-md overflow-hidden m-4"
              title={
                <div className="flex items-center gap-2">
                  <ClipboardList size={18} className="text-pink-500" />
                  <span>任务与成就</span>
                </div>
              }
              right={
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => setActivePanel('none')}
                  aria-label="关闭"
                  title="关闭"
                >
                  <X size={18} />
                </Button>
              }
              contentClassName="pt-2"
            >
              {/* Tabs */}
              <div className="flex p-1 bg-white/50 rounded-[var(--radius-md)] border border-white/40">
                <button
                  onClick={() => setActiveTab('tasks')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-[var(--radius-sm)] transition-all ${
                    activeTab === 'tasks'
                      ? 'bg-white text-pink-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  每日任务 ({completedTasks}/{totalTasks})
                </button>
                <button
                  onClick={() => setActiveTab('achievements')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-[var(--radius-sm)] transition-all ${
                    activeTab === 'achievements'
                      ? 'bg-white text-pink-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  成就 ({unlockedAchievements}/{achievements.length})
                </button>
              </div>

              {/* Content */}
              <div className="mt-3 max-h-[60vh] overflow-y-auto custom-scrollbar pr-1">
                {activeTab === 'tasks' ? (
                  <div className="space-y-3">
                    {tasks.map(task => (
                      <div key={task.id} className={`p-3 rounded-xl border ${task.completed ? 'bg-green-50 border-green-200' : 'bg-white border-gray-100 shadow-sm'}`}>
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className={`font-bold text-sm ${task.completed ? 'text-green-700' : 'text-gray-800'}`}>
                              {task.description}
                            </h4>
                            <p className="text-xs text-gray-500 mt-1">奖励: {task.reward}</p>
                          </div>
                          <div className="text-xs font-medium px-2 py-1 rounded-full bg-white/50">
                            {task.completed ? '已完成' : `${task.progress}/${task.target}`}
                          </div>
                        </div>
                        {/* Progress Bar */}
                        <div className="mt-2 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, (task.progress / task.target) * 100)}%` }}
                            className={`h-full ${task.completed ? 'bg-green-500' : 'bg-pink-500'}`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {achievements.map(achievement => (
                      <div key={achievement.id} className={`p-3 rounded-xl border flex items-center space-x-3 ${achievement.unlocked ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200 opacity-70'}`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${achievement.unlocked ? 'bg-white shadow-sm' : 'bg-gray-200 grayscale'}`}>
                          {achievement.icon}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-gray-800">{achievement.title}</h4>
                          <p className="text-xs text-gray-500">{achievement.description}</p>
                        </div>
                        {achievement.unlocked && <Trophy size={16} className="ml-auto text-yellow-500" />}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Panel>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
