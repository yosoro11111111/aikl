'use client';

import { useStore, Emotion } from '@/store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Smile, X } from 'lucide-react';
import { Panel } from '@/components/ui/Panel';
import { Button } from '@/components/ui/Button';

const EMOTIONS: { id: Emotion; label: string; icon: string }[] = [
  { id: 'neutral', label: '默认', icon: '😐' },
  { id: 'happy', label: '开心', icon: '😊' },
  { id: 'angry', label: '生气', icon: '😠' },
  { id: 'sad', label: '悲伤', icon: '😢' },
  { id: 'surprised', label: '惊讶', icon: '😮' },
  { id: 'relaxed', label: '轻松', icon: '😌' },
  { id: 'shy', label: '害羞', icon: '😳' },
  { id: 'love', label: '喜爱', icon: '😍' },
  { id: 'wink', label: '眨眼', icon: '😉' },
  { id: 'sleepy', label: '困倦', icon: '😪' },
  { id: 'smug', label: '得意', icon: '😏' },
  { id: 'confused', label: '困惑', icon: '😕' },
  { id: 'focus', label: '专注', icon: '🧐' },
  { id: 'disgust', label: '厌恶', icon: '🤢' },
  { id: 'fear', label: '恐惧', icon: '😱' },
  { id: 'excited', label: '兴奋', icon: '🤩' },
  { id: 'serious', label: '严肃', icon: '😐' },
  { id: 'tired', label: '疲惫', icon: '😫' },
  { id: 'pain', label: '痛苦', icon: '😣' },
  { id: 'pout', label: '嘟嘴', icon: '🥺' },
];

export default function ExpressionPanel() {
  const { currentEmotion, setEmotion, activePanel, setActivePanel } = useStore();
  const isOpen = activePanel === 'expressions';

  return (
    <div className="absolute top-4 left-36 z-10">
      {/* Button moved to SystemControls */}

      <AnimatePresence>
        {isOpen && (
          <Panel
            initial={{ opacity: 0, scale: 0.92, x: -20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.92, x: -20 }}
            className="fixed inset-x-4 top-20 md:absolute md:top-16 md:left-0 md:w-80 md:inset-auto z-20"
            title="表情控制"
            right={
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={() => setActivePanel('none')}
                aria-label="关闭"
                title="关闭"
              >
                <X size={16} />
              </Button>
            }
          >
            
            <div className="grid grid-cols-4 gap-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
              {EMOTIONS.map((e) => (
                <motion.button
                  key={e.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setEmotion(e.id)}
                  className={`ui-focus-ring flex flex-col items-center justify-center p-2 rounded-lg transition-colors border ${
                    currentEmotion === e.id
                      ? 'bg-pink-100 border-pink-300 text-pink-700 shadow-sm'
                      : 'bg-white/50 border-transparent hover:bg-white hover:border-pink-200'
                  }`}
                >
                  <span className="text-2xl mb-1">{e.icon}</span>
                  <span className="text-xs font-medium">{e.label}</span>
                </motion.button>
              ))}
            </div>
          </Panel>
        )}
      </AnimatePresence>
    </div>
  );
}
