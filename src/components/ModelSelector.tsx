'use client';

import { useStore } from '@/store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';
import { Users, Check, Plus, Trash2, Upload } from 'lucide-react';
import { Panel } from '@/components/ui/Panel';
import { Button } from '@/components/ui/Button';

export default function ModelSelector() {
  const { availableModels, activeModels, addActiveModel, removeActiveModel, setAvailableModels, setCurrentModel, apiKey, addMessage, activePanel, setActivePanel } = useStore();
  const isOpen = activePanel === 'models';
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate Persona Function
  const generatePersona = async (modelName: string) => {
      if (!apiKey) return `You are ${modelName}, a friendly anime character.`;
      
      try {
        const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                messages: [
                    { 
                        role: 'system', 
                        content: 'You are an expert character designer. Generate a short, engaging system prompt (persona) for an anime character based on their name. The prompt should define their personality, speaking style, and catchphrases. Keep it under 50 words. Output ONLY the prompt text.' 
                    },
                    { role: 'user', content: `Generate a persona for a character named "${modelName}".` }
                ],
                apiKey 
            }),
        });
        const data = await res.json();
        return data.reply || `You are ${modelName}.`;
      } catch (e) {
        console.error("Failed to generate persona:", e);
        return `You are ${modelName}.`;
      }
  };

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await fetch('/api/models');
        if (response.ok) {
          const models = await response.json();
          setAvailableModels(models);
          
          // 重置currentModel和activeModels，确保使用新的API路由格式
          if (models.length > 0) {
            setCurrentModel(models[0]);
            
            // 清空activeModels并添加第一个可用模型
            activeModels.forEach(model => {
              removeActiveModel(model.id);
            });
            
            addActiveModel(models[0]);
          }
        }
      } catch (error) {
        console.error('Failed to fetch models:', error);
      }
    };

    fetchModels();
  }, [setAvailableModels, setCurrentModel, activeModels, removeActiveModel, addActiveModel]);

  const togglePanel = () => setActivePanel(isOpen ? 'none' : 'models');

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.vrm')) {
      alert('请选择 .vrm 格式的模型文件');
      return;
    }

    const url = URL.createObjectURL(file);
    const modelName = file.name.replace(/\.vrm$/i, '');
    
    // Generate Persona
    const generatedPersona = await generatePersona(modelName);
    
    // Notify user
    addMessage({
        role: 'assistant',
        content: `已导入模型 [${modelName}]。AI生成的设定：${generatedPersona}`,
        id: Date.now().toString()
    });

    const newModel = {
      id: `custom-${Date.now()}`,
      name: modelName,
      url: url,
      description: generatedPersona, // Use description as persona storage for now
      defaultEmotion: 'neutral' as const
    };

    setAvailableModels((prev) => [newModel, ...prev]);
    
    // Optional: Reset input value to allow selecting the same file again
    event.target.value = '';
  };

  const handleToggleModel = (model: any) => {
    const isActive = activeModels.some(m => m.id === model.id);
    if (isActive) {
      if (activeModels.length > 1) {
        removeActiveModel(model.id);
      }
    } else {
      if (activeModels.length < 3) {
        // 确保使用从API获取的模型，而不是默认availableModels数组中的模型
        // 查找availableModels中具有相同id的模型
        const updatedModel = availableModels.find(m => m.id === model.id);
        if (updatedModel) {
          addActiveModel(updatedModel);
        } else {
          addActiveModel(model);
        }
      }
    }
  };

  return (
    <div className="absolute top-4 right-20 z-50">
      <AnimatePresence>
        {isOpen && (
          <Panel
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            className="fixed inset-x-4 top-20 md:absolute md:top-16 md:right-0 md:w-72 md:inset-auto z-50"
            title={
              <div className="flex items-center gap-2">
                <Users size={18} className="text-pink-500" />
                <span>选择角色</span>
              </div>
            }
            right={
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".vrm"
                  className="hidden"
                />
                <Button
                  onClick={handleImportClick}
                  variant="glass"
                  size="sm"
                  className="text-blue-700 bg-white/70 hover:bg-white/90"
                  title="导入本地 VRM 模型"
                  aria-label="导入本地 VRM 模型"
                  leftIcon={<Upload size={14} />}
                >
                  导入
                </Button>
                <span className="text-xs text-gray-600">已选 {activeModels.length}/3</span>
              </div>
            }
          >
            
            <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
              {availableModels.map((model) => {
                const isActive = activeModels.some(m => m.id === model.id);
                return (
                    <motion.button
                    key={model.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleToggleModel(model)}
                    disabled={!isActive && activeModels.length >= 3}
                    className={`ui-focus-ring p-2 rounded-lg text-sm text-left transition-colors flex flex-col gap-1 relative ${
                        isActive
                        ? 'bg-pink-500 text-white shadow-md'
                        : activeModels.length >= 3 
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-pink-50 text-pink-700 hover:bg-pink-100'
                    }`}
                    >
                    <div className="flex justify-between items-start w-full">
                        <span className="font-medium truncate pr-4">{model.name}</span>
                        {isActive && <Check size={14} />}
                    </div>
                    {/* Persona Display */}
                    <div className="text-xs opacity-80 line-clamp-2 w-full mt-1 bg-black/5 p-1 rounded">
                      {model.description}
                    </div>
                    </motion.button>
                );
              })}
            </div>
          </Panel>
        )}
      </AnimatePresence>
    </div>
  );
}
