'use client';

import { useStore } from '@/store/useStore';
import { motion } from 'framer-motion';
import { Heart, Smile, Activity, Users } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function StatusBar() {
  const { currentEmotion: emotion, affection, activeModels } = useStore();
  const [heartRate, setHeartRate] = useState(70);
  
  // 检测是否为移动端
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);
  
  // 根据人物数量决定显示模式
  const modelCount = activeModels.length;
  const shouldShowCompact = isMobile && modelCount >= 2;

  // Simulate heart rate based on emotion
  useEffect(() => {
    let baseRate = 70;
    switch (emotion) {
      case 'excited': baseRate = 110; break;
      case 'happy': baseRate = 90; break;
      case 'relaxed': baseRate = 65; break;
      case 'sleepy': baseRate = 55; break;
      case 'angry': baseRate = 120; break;
      case 'fear': baseRate = 130; break;
      case 'shy': baseRate = 100; break;
      case 'love': baseRate = 115; break;
      default: baseRate = 75;
    }
    // Add some random fluctuation
    const interval = setInterval(() => {
      setHeartRate(baseRate + Math.floor(Math.random() * 6 - 3));
    }, 2000);
    
    // Initial set
    setHeartRate(baseRate);

    return () => clearInterval(interval);
  }, [emotion]);

  return (
    <div className="fixed top-4 left-4 right-4 z-40 flex justify-center pointer-events-none">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-white/40 backdrop-blur-md rounded-full shadow-lg border border-white/30 max-w-[90vw] ${
          shouldShowCompact 
            ? 'px-3 py-1.5 flex items-center gap-2' 
            : 'px-4 py-2 flex items-center gap-3'
        }`}
      >
        {/* 多人物模式：显示人物名字 */}
        {shouldShowCompact && (
          <>
            <div className="flex items-center gap-1.5" title="当前人物">
              <Users size={12} className="text-purple-500" />
              <div className="flex flex-wrap gap-1 max-w-[120px]">
                {activeModels.slice(0, 3).map((model, index) => (
                  <span key={model.id} className="text-[10px] font-medium text-gray-700 bg-white/50 px-1.5 py-0.5 rounded-full">
                    {model.name}
                  </span>
                ))}
                {modelCount > 3 && (
                  <span className="text-[10px] font-medium text-gray-500 bg-white/30 px-1.5 py-0.5 rounded-full">
                    +{modelCount - 3}
                  </span>
                )}
              </div>
            </div>
            <div className="w-px h-4 bg-white/50 mx-0.5" />
          </>
        )}
        
        {/* Heartbeat */}
        <div className="flex items-center gap-1.5" title="心率 (Heart Rate)">
          <Activity size={shouldShowCompact ? 12 : 16} className="text-pink-500 animate-pulse" />
          <div className="flex flex-col leading-none">
             <span className={`font-bold text-gray-800 ${
               shouldShowCompact ? 'text-xs w-6' : 'text-sm w-8'
             }`}>{heartRate}</span>
             <span className={`text-gray-600 font-medium ${
               shouldShowCompact ? 'text-[8px]' : 'text-[9px]'
             }`}>BPM</span>
          </div>
        </div>
        
        <div className={`w-px bg-white/50 mx-1 ${
          shouldShowCompact ? 'h-4' : 'h-6'
        }`} />

        {/* Emotion */}
        <div className="flex items-center gap-1.5" title="心情 (Mood)">
          <Smile size={shouldShowCompact ? 12 : 16} className="text-blue-500" />
          <span className={`font-bold text-gray-800 capitalize ${
            shouldShowCompact ? 'text-xs' : 'text-sm translate-y-[1px]'
          }`}>{emotion}</span>
        </div>

        <div className={`w-px bg-white/50 mx-1 ${
          shouldShowCompact ? 'h-4' : 'h-6'
        }`} />

         {/* Affection */}
        <div className="flex items-center gap-1.5" title="好感度 (Affection)">
          <Heart size={shouldShowCompact ? 12 : 16} className={`text-red-500 ${affection >= 80 ? 'fill-red-500' : ''}`} />
          <span className={`font-bold text-gray-800 ${
            shouldShowCompact ? 'text-xs' : 'text-sm translate-y-[1px]'
          }`}>{Math.floor(affection)}</span>
        </div>
      </motion.div>
    </div>
  );
}
