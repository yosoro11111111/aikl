'use client';

import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { Settings, Eye, Volume2, Palette, RotateCcw, User, Maximize, Camera, Mic, MicOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ThemeToggle from './ThemeToggle';
import { Panel } from '@/components/ui/Panel';
import { Button } from '@/components/ui/Button';

export default function SettingsPanel() {
  const {
    apiKey,
    setApiKey,
    currentModel,
    setCurrentModel,
    availableModels,
    theme,
    setTheme,
    affection,
    addAffection,
    outfit,
    setOutfit,
    scene,
    setScene,
    isMaximized,
    toggleIsMaximized,
    triggerResetCamera,
    activePanel,
    setActivePanel,
    isVoiceEnabled,
    toggleVoiceEnabled,
    expressionExaggeration,
    setExpressionExaggeration,
    resetAvatarPosition,
    quality,
    setQuality,
  } = useStore();
  
  const isOpen = activePanel === 'settings';
  const [tempApiKey, setTempApiKey] = useState(apiKey);
  
  const togglePanel = () => setActivePanel(isOpen ? 'none' : 'settings');
  
  const saveApiKey = () => {
    setApiKey(tempApiKey);
    setActivePanel('none');
  };
  
  return (
    <div className="absolute top-4 right-4 z-50">
      {/* Button moved to SystemControls */}
      
      <AnimatePresence>
        {isOpen && (
          <Panel
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            className="fixed inset-x-4 top-20 md:absolute md:top-16 md:right-0 md:w-80 md:inset-auto z-50"
            title={
              <div className="flex items-center gap-2 min-w-0">
                <User size={18} className="text-pink-500" />
                <span className="truncate">{currentModel.name}</span>
              </div>
            }
            right={
              <div className="text-xs bg-pink-500/10 text-pink-700 dark:text-pink-200 px-2 py-1 rounded-[var(--radius-pill)]">
                好感度 {affection}%
              </div>
            }
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  画质设置
                </label>
                <div className="grid grid-cols-4 gap-2 bg-gray-50 p-1 rounded-lg">
                  {([
                    { id: 'low', label: '低' },
                    { id: 'medium', label: '中' },
                    { id: 'high', label: '高' },
                    { id: 'ultra', label: '极高' },
                    { id: 'extreme', label: '极致' },
                    { id: 'master', label: '大师' },
                    { id: 'god', label: '超神' },
                    { id: 'absolute', label: '绝对' }
                  ] as const).map((q) => (
                    <button
                      key={q.id}
                      onClick={() => setQuality(q.id as any)}
                      className={`py-1 text-xs rounded-md transition-all ${
                        quality === q.id 
                          ? 'bg-white text-pink-500 shadow-sm font-medium' 
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {q.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  DeepSeek API Key
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={tempApiKey}
                    onChange={(e) => setTempApiKey(e.target.value)}
                    placeholder="输入 API Key"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <Button
                    onClick={saveApiKey}
                    variant="primary"
                    size="sm"
                  >
                    保存
                  </Button>
                </div>
              </div>
              
              <ThemeToggle />
              
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <RotateCcw size={16} />
                  <span>重置人物位置</span>
                </div>
                <Button
                  onClick={() => resetAvatarPosition()}
                  variant="glass"
                  size="sm"
                  className="bg-white/80"
                >
                  重置
                </Button>
              </div>
              
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  {isVoiceEnabled ? <Mic size={16} className="text-pink-500" /> : <MicOff size={16} />}
                  <span>语音合成 (TTS)</span>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={toggleVoiceEnabled}
                  className={`w-10 h-6 rounded-full p-1 transition-colors ${isVoiceEnabled ? 'bg-pink-500' : 'bg-gray-300'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${isVoiceEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                </motion.button>
              </div>

              <div className="p-2 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-gray-700 mb-2">
                    <span className="text-yellow-500">⚡</span>
                    <span>表情夸张度</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                    {[0, 1, 2].map((level) => (
                        <button
                            key={level}
                            onClick={() => setExpressionExaggeration(level)}
                            className={`px-2 py-1 text-xs rounded-md transition-colors ${
                                expressionExaggeration === level
                                    ? 'bg-pink-500 text-white'
                                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-pink-50'
                            }`}
                        >
                            {level === 0 ? '夸张' : level === 1 ? '超夸张' : '颜艺'}
                        </button>
                    ))}
                </div>
              </div>
              
              {/* Scene Settings Removed */}
              
              <div className="pt-2 border-t border-pink-100">
                <Button
                  onClick={() => {
                    // 重置所有数据
                    localStorage.clear();
                    window.location.reload();
                  }}
                  variant="ghost"
                  size="md"
                  className="w-full bg-red-500/10 text-red-700 hover:bg-red-500/15"
                >
                  <RotateCcw size={16} />
                  重置应用
                </Button>
              </div>
            </div>
          </Panel>
        )}
      </AnimatePresence>
    </div>
  );
}