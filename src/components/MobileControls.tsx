'use client';

import { useStore } from '@/store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { 
  Settings, 
  Users, 
  Map, 
  ClipboardList, 
  Book, 
  Sofa, 
  Camera, 
  Music, 
  Move,
  Menu,
  X,
  Mic,
  MicOff,
  Gift
} from 'lucide-react';
import { useState } from 'react';
import { useGiftSystem } from '@/hooks/useGiftSystem';

export default function MobileControls() {
  const { 
    activePanel, 
    setActivePanel, 
    isPhotoMode, 
    togglePhotoMode,
    bgmPlaying,
    toggleBgm,
    isEditMode,
    toggleEditMode,
    isVoiceEnabled,
    toggleVoiceEnabled
  } = useStore();

  const { fileInputRef, handleGiftClick, processFile } = useGiftSystem();
  const [isExpanded, setIsExpanded] = useState(false);

  if (isPhotoMode) return null;

  const buttons = [
    { 
      id: 'settings', 
      icon: Settings, 
      label: '设置', 
      action: () => setActivePanel(activePanel === 'settings' ? 'none' : 'settings'),
      isActive: activePanel === 'settings'
    },
    { 
      id: 'models', 
      icon: Users, 
      label: '角色', 
      action: () => setActivePanel(activePanel === 'models' ? 'none' : 'models'),
      isActive: activePanel === 'models'
    },
    { 
      id: 'scenes', 
      icon: Map, 
      label: '场景', 
      action: () => setActivePanel(activePanel === 'scenes' ? 'none' : 'scenes'),
      isActive: activePanel === 'scenes'
    },
    { 
      id: 'tasks', 
      icon: ClipboardList, 
      label: '任务', 
      action: () => setActivePanel(activePanel === 'tasks' ? 'none' : 'tasks'),
      isActive: activePanel === 'tasks'
    },
    { 
      id: 'memories', 
      icon: Book, 
      label: '记忆', 
      action: () => setActivePanel(activePanel === 'memories' ? 'none' : 'memories'),
      isActive: activePanel === 'memories'
    },
    { 
      id: 'furniture', 
      icon: Sofa, 
      label: '家具', 
      action: () => setActivePanel(activePanel === 'furniture' ? 'none' : 'furniture'),
      isActive: activePanel === 'furniture'
    },
    {
      id: 'gift',
      icon: Gift,
      label: '送礼',
      action: handleGiftClick,
      isActive: false
    },
    // System Controls
    {
      id: 'bgm',
      icon: Music,
      label: '音乐',
      action: toggleBgm,
      isActive: bgmPlaying
    },
    {
      id: 'voice',
      icon: isVoiceEnabled ? Mic : MicOff,
      label: '语音',
      action: toggleVoiceEnabled,
      isActive: isVoiceEnabled
    },
    {
      id: 'edit',
      icon: Move,
      label: '编辑',
      action: toggleEditMode,
      isActive: isEditMode
    },
    {
      id: 'photo',
      icon: Camera,
      label: '拍照',
      action: togglePhotoMode,
      isActive: false
    }
  ];

  return (
    <div className="fixed top-4 left-0 right-0 z-50 flex justify-center md:hidden pointer-events-none">
      <div className="pointer-events-auto">
          <motion.div 
            layout
            initial={false}
            className={`ui-glass flex items-center overflow-hidden transition-all ${
                isExpanded ? 'rounded-[var(--radius-lg)] p-2 gap-2 max-w-[95vw]' : 'rounded-[var(--radius-pill)] p-2'
            } shadow-lg`}
          >
            <Button
              layout
              onClick={() => setIsExpanded(!isExpanded)}
              variant="glass"
              size="icon"
              className="flex-shrink-0 text-pink-500"
              aria-label={isExpanded ? '收起菜单' : '展开菜单'}
              title={isExpanded ? '收起菜单' : '展开菜单'}
            >
              {isExpanded ? <X size={20} /> : <Menu size={20} />}
            </Button>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        className="flex gap-2 overflow-x-auto custom-scrollbar items-center pr-1"
                    >
                        {buttons.map((btn) => (
                            <motion.button
                                key={btn.id}
                                layout
                                whileTap={{ scale: 0.9 }}
                                onClick={() => btn.action()}
                                className={`ui-focus-ring p-3 rounded-[var(--radius-pill)] flex-shrink-0 transition-all ${
                                    btn.isActive 
                                        ? 'bg-pink-500 text-white shadow-pink-500/30 shadow-md' 
                                        : 'bg-white/70 text-gray-700 hover:bg-white/90'
                                }`}
                                title={btn.label}
                                aria-label={btn.label}
                            >
                                <btn.icon size={20} />
                            </motion.button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
          </motion.div>
      </div>
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        onChange={processFile}
        accept="image/*,text/*,.md,.txt,.json,.js,.ts"
      />
    </div>
  );
}
