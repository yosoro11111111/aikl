'use client';

import { useStore } from '@/store/useStore';
import { motion } from 'framer-motion';
import { Heart, Smile, Activity } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function StatusBar() {
  const { currentEmotion: emotion, affection } = useStore();
  const [heartRate, setHeartRate] = useState(70);

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
        className="bg-white/40 backdrop-blur-md rounded-full px-4 py-2 flex items-center gap-3 shadow-lg border border-white/30 max-w-[90vw]"
      >
        {/* Heartbeat */}
        <div className="flex items-center gap-1.5" title="心率 (Heart Rate)">
          <Activity size={16} className="text-pink-500 animate-pulse" />
          <div className="flex flex-col leading-none">
             <span className="text-sm font-bold text-gray-800 w-8">{heartRate}</span>
             <span className="text-[9px] text-gray-600 font-medium">BPM</span>
          </div>
        </div>
        
        <div className="w-px h-6 bg-white/50 mx-1" />

        {/* Emotion */}
        <div className="flex items-center gap-1.5" title="心情 (Mood)">
          <Smile size={16} className="text-blue-500" />
          <span className="text-sm font-bold text-gray-800 capitalize translate-y-[1px]">{emotion}</span>
        </div>

        <div className="w-px h-6 bg-white/50 mx-1" />

         {/* Affection */}
        <div className="flex items-center gap-1.5" title="好感度 (Affection)">
          <Heart size={16} className={`text-red-500 ${affection >= 80 ? 'fill-red-500' : ''}`} />
          <span className="text-sm font-bold text-gray-800 translate-y-[1px]">{Math.floor(affection)}</span>
        </div>
      </motion.div>
    </div>
  );
}
