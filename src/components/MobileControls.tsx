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
    <>
      {/* 左侧常用功能栏 */}
      <div className="fixed left-4 bottom-24 z-50 md:hidden pointer-events-none">
        <div className="pointer-events-auto flex flex-col gap-3">
          {/* 语音控制 */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={toggleVoiceEnabled}
            className={`ui-focus-ring p-3 rounded-[var(--radius-pill)] flex-shrink-0 transition-all shadow-lg ${
                isVoiceEnabled 
                    ? 'bg-green-500 text-white shadow-green-500/30' 
                    : 'bg-white/70 text-gray-700 hover:bg-white/90 backdrop-blur-lg'
            }`}
            title={isVoiceEnabled ? '关闭语音' : '开启语音'}
            aria-label={isVoiceEnabled ? '关闭语音' : '开启语音'}
          >
            {isVoiceEnabled ? <Mic size={20} /> : <MicOff size={20} />}
          </motion.button>

          {/* 音乐控制 */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={toggleBgm}
            className={`ui-focus-ring p-3 rounded-[var(--radius-pill)] flex-shrink-0 transition-all shadow-lg ${
                bgmPlaying 
                    ? 'bg-blue-500 text-white shadow-blue-500/30' 
                    : 'bg-white/70 text-gray-700 hover:bg-white/90 backdrop-blur-lg'
            }`}
            title={bgmPlaying ? '关闭音乐' : '开启音乐'}
            aria-label={bgmPlaying ? '关闭音乐' : '开启音乐'}
          >
            <Music size={20} />
          </motion.button>

          {/* 拍照模式 */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={togglePhotoMode}
            className="ui-focus-ring p-3 rounded-[var(--radius-pill)] bg-white/70 text-gray-700 hover:bg-white/90 flex-shrink-0 transition-all shadow-lg backdrop-blur-lg"
            title="拍照模式"
            aria-label="拍照模式"
          >
            <Camera size={20} />
          </motion.button>
        </div>
      </div>

      {/* 右侧主菜单栏 */}
      <div className="fixed right-4 bottom-24 z-50 md:hidden pointer-events-none">
        <div className="pointer-events-auto">
          <motion.div 
            layout
            initial={false}
            className={`ui-glass flex flex-col items-center overflow-hidden transition-all ${
                isExpanded ? 'rounded-[var(--radius-lg)] p-3 gap-3 max-h-[70vh]' : 'rounded-[var(--radius-pill)] p-3'
            } shadow-lg backdrop-blur-lg`}
          >
            {/* 菜单展开按钮 */}
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

            {/* 展开的菜单项 - 垂直排列 */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex flex-col gap-2 overflow-y-auto custom-scrollbar items-center"
                    >
                        {buttons.filter(btn => !['voice', 'bgm', 'photo'].includes(btn.id)).map((btn) => (
                            <motion.button
                                key={btn.id}
                                layout
                                whileTap={{ scale: 0.9 }}
                                onClick={() => btn.action()}
                                className={`ui-focus-ring p-3 rounded-[var(--radius-pill)] w-12 h-12 flex items-center justify-center transition-all ${
                                    btn.isActive 
                                        ? 'bg-pink-500 text-white shadow-pink-500/30' 
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
      </div>

      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        onChange={processFile}
        accept="image/*,text/*,.md,.txt,.json,.js,.ts"
      />
    </>
  );
}
