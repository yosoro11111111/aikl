import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { MEMORIES } from '@/config/memories';
import { motion, AnimatePresence } from 'framer-motion';
import { useSoundManager } from '@/hooks/useSoundManager';
import { Panel } from '@/components/ui/Panel';
import { Button } from '@/components/ui/Button';
import { Book, X } from 'lucide-react';

export default function MemoryPanel() {
  const { affection, unlockedMemories, unlockMemory, addMessage, activePanel, setActivePanel } = useStore();
  const isOpen = activePanel === 'memories';
  const { playSound } = useSoundManager();
  const [selectedMemory, setSelectedMemory] = useState<string | null>(null);

  // Check for unlocks
  useEffect(() => {
    MEMORIES.forEach(memory => {
      if (!unlockedMemories.includes(memory.id)) {
        if (memory.condition.type === 'affection' && affection >= memory.condition.value) {
          unlockMemory(memory.id);
          playSound('success');
          addMessage({
            role: 'assistant',
            content: `[emotion:happy] [action:nod] 我好像...想起了什么重要的事情。(${memory.title} 已解锁)`,
            id: Date.now().toString()
          });
        }
      }
    });
  }, [affection, unlockedMemories, unlockMemory, playSound, addMessage]);

  return (
    <>
      {/* Button moved to SystemControls */}

      <AnimatePresence>
        {isOpen && (
          <Panel
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            className="fixed inset-x-4 top-20 bottom-20 md:absolute md:bottom-20 md:right-4 md:w-80 md:inset-auto z-50 max-h-[60vh] overflow-y-auto"
            title={
              <div className="flex items-center gap-2">
                <Book size={18} className="text-pink-500" />
                <span>记忆碎片</span>
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
          >
            <div className="space-y-3">
              {MEMORIES.map((memory) => {
                const isUnlocked = unlockedMemories.includes(memory.id);
                return (
                  <div 
                    key={memory.id}
                    className={`ui-focus-ring p-3 rounded-lg border transition-all ${
                      isUnlocked 
                        ? 'bg-white border-pink-200 cursor-pointer hover:shadow-md' 
                        : 'bg-gray-100 border-gray-200 opacity-70'
                    }`}
                    onClick={() => isUnlocked && setSelectedMemory(selectedMemory === memory.id ? null : memory.id)}
                  >
                    <div className="flex justify-between items-center">
                      <span className={`font-medium ${isUnlocked ? 'text-pink-600' : 'text-gray-500'}`}>
                        {isUnlocked ? memory.title : '???'}
                      </span>
                      {isUnlocked && <span className="text-xs text-pink-400">已解锁</span>}
                    </div>
                    
                    {!isUnlocked && (
                      <div className="text-xs text-gray-400 mt-1">
                        解锁条件: 好感度 {memory.condition.value}
                      </div>
                    )}

                    <AnimatePresence>
                      {selectedMemory === memory.id && isUnlocked && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="mt-2 text-sm text-gray-600 border-t border-pink-100 pt-2"
                        >
                          {memory.description}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </Panel>
        )}
      </AnimatePresence>
    </>
  );
}
