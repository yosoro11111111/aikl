'use client';

import { useStore } from '@/store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Maximize, RotateCcw, CornerDownLeft, ArrowLeftRight, ArrowUp } from 'lucide-react';
import { Html } from '@react-three/drei';

export function ActionButtons() {
  const { setAction, toggleIsMaximized, isMaximized, triggerResetCamera, isHovering, isPhotoMode } = useStore();

  if (isPhotoMode) return null;

  const buttonStyle = "p-3 bg-white/80 backdrop-blur-md rounded-full shadow-lg border border-white/50 text-pink-600 hover:bg-pink-100 transition-colors";

  const containerVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <Html position={[-1.5, 2, 0]} transform>
      <AnimatePresence>
        {isHovering && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="flex flex-col gap-3"
          >
            <motion.button variants={itemVariants} onClick={() => setAction('nod')} className={buttonStyle} title="点头">
              <CornerDownLeft size={18} />
            </motion.button>
            <motion.button variants={itemVariants} onClick={() => setAction('shake')} className={buttonStyle} title="摇头">
              <ArrowLeftRight size={18} />
            </motion.button>
            <motion.button variants={itemVariants} onClick={() => setAction('jump')} className={buttonStyle} title="跳跃">
              <ArrowUp size={18} />
            </motion.button>
            <motion.button variants={itemVariants} onClick={toggleIsMaximized} className={buttonStyle} title={isMaximized ? '恢复' : '最大化'}>
              <Maximize size={18} />
            </motion.button>
            <motion.button variants={itemVariants} onClick={triggerResetCamera} className={buttonStyle} title="重置视角">
              <Camera size={18} />
            </motion.button>
            <motion.button
              variants={itemVariants}
              onClick={() => {
                setAction('idle');
                useStore.getState().setEmotion('neutral');
              }}
              className={buttonStyle}
              title="恢复初始姿态"
            >
              <RotateCcw size={18} />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </Html>
  );
}
