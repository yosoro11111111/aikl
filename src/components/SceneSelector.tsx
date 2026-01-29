'use client';

import { useStore } from '@/store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Map, Check } from 'lucide-react';
import { Panel } from '@/components/ui/Panel';

export default function SceneSelector() {
  const { scene, setScene, availableScenes, activePanel, setActivePanel } = useStore();
  const isOpen = activePanel === 'scenes';

  return (
    <div className="absolute top-4 left-20 z-10">
      {/* Button moved to SystemControls */}
      {/* <motion.button ... /> */}

      <AnimatePresence>
        {isOpen && (
          <Panel
            initial={{ opacity: 0, scale: 0.92, x: -20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.92, x: -20 }}
            className="fixed inset-x-4 top-20 md:absolute md:top-16 md:left-0 md:w-80 md:inset-auto z-20"
            title={
              <div className="flex items-center gap-2">
                <Map size={18} className="text-pink-500" />
                <span>场景选择</span>
              </div>
            }
            right={<span className="text-xs text-gray-600">{availableScenes.length} 个场景</span>}
          >
            
            <div className="grid grid-cols-3 gap-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
              {availableScenes.map((s) => (
                <motion.button
                  key={s.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setScene(s.id);
                  }}
                  className={`ui-focus-ring relative p-2 rounded-lg flex flex-col items-center gap-2 transition-all overflow-hidden border ${
                    scene === s.id
                      ? 'border-pink-500 bg-pink-50'
                      : 'border-transparent hover:bg-white/50'
                  }`}
                >
                  <div 
                    className="w-full aspect-video rounded-md shadow-sm border border-black/5"
                    style={{ 
                      background: s.type === 'color' ? s.value : `url(${s.value}) center/cover`
                    }}
                  />
                  <span className={`text-xs truncate w-full text-center ${
                    scene === s.id ? 'font-bold text-pink-600' : 'text-gray-600'
                  }`}>
                    {s.name}
                  </span>
                  {scene === s.id && (
                    <div className="absolute top-2 right-2 bg-pink-500 text-white rounded-full p-0.5 shadow-md">
                      <Check size={10} />
                    </div>
                  )}
                </motion.button>
              ))}
            </div>
          </Panel>
        )}
      </AnimatePresence>
    </div>
  );
}
