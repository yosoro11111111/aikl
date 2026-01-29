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
  Gift,
  Heart
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  if (isPhotoMode) return null;

  // 主要功能按钮
  const mainButtons = [
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
      id: 'settings', 
      icon: Settings, 
      label: '设置', 
      action: () => setActivePanel(activePanel === 'settings' ? 'none' : 'settings'),
      isActive: activePanel === 'settings'
    }
  ];

  // 更多功能按钮
  const moreButtons = [
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
      {/* 底部导航栏 */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden pointer-events-none">
        <div className="pointer-events-auto">
          {/* 主要功能导航栏 */}
          <motion.div 
            className="ui-glass flex items-center justify-around py-3 px-4 shadow-lg"
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            transition={{ type: 'spring', damping: 20 }}
          >
            {mainButtons.map((btn) => (
              <motion.button
                key={btn.id}
                whileTap={{ scale: 0.9 }}
                onClick={() => btn.action()}
                className={`flex flex-col items-center gap-1 px-4 py-2 transition-all ${
                  btn.isActive 
                    ? 'text-pink-500' 
                    : 'text-gray-600 hover:text-pink-400'
                }`}
                title={btn.label}
                aria-label={btn.label}
              >
                <btn.icon size={24} />
                <span className="text-xs font-medium">{btn.label}</span>
              </motion.button>
            ))}
            
            {/* 更多按钮 */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex flex-col items-center gap-1 px-4 py-2 text-gray-600 hover:text-pink-400"
              title="更多"
              aria-label="更多"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              <span className="text-xs font-medium">更多</span>
            </motion.button>
          </motion.div>
        </div>
      </div>

      {/* 更多功能弹出菜单 */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: 'spring', damping: 20 }}
            className="fixed bottom-24 left-0 right-0 z-50 md:hidden pointer-events-none"
          >
            <div className="pointer-events-auto">
              <motion.div 
                className="ui-glass mx-4 rounded-t-2xl shadow-xl"
              >
                <div className="grid grid-cols-4 gap-4 p-4">
                  {moreButtons.map((btn) => (
                    <motion.button
                      key={btn.id}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        btn.action();
                        // 自动关闭菜单
                        setIsMenuOpen(false);
                      }}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all ${
                        btn.isActive 
                          ? 'bg-pink-500/20 text-pink-500' 
                          : 'bg-white/10 text-gray-600 hover:bg-white/20'
                      }`}
                      title={btn.label}
                      aria-label={btn.label}
                    >
                      <btn.icon size={24} />
                      <span className="text-xs font-medium text-center">{btn.label}</span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 浮动操作按钮 - 快速拍照 */}
      <motion.div 
        className="fixed right-6 bottom-32 z-50 md:hidden pointer-events-none"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <div className="pointer-events-auto">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={togglePhotoMode}
            className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-full p-4 shadow-lg flex items-center justify-center"
            title="拍照"
            aria-label="拍照"
          >
            <Camera size={24} className="text-white" />
          </motion.button>
        </div>
      </motion.div>

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
