'use client';

import Scene from '@/components/Scene';
import ChatInterface from '@/components/ChatInterface';
import dynamic from 'next/dynamic';
import { useStore } from '@/store/useStore';
import { AnimatePresence, motion } from 'framer-motion';
import { useLifeEvents } from '@/hooks/useLifeEvents';
import { useMemoryOptimization } from '@/hooks/useMemoryOptimization';

const SettingsPanel = dynamic(() => import('@/components/SettingsPanel'), { ssr: false });
const ModelSelector = dynamic(() => import('@/components/ModelSelector'), { ssr: false });
const SceneSelector = dynamic(() => import('@/components/SceneSelector'), { ssr: false });
const FurnitureSystem = dynamic(() => import('@/components/FurnitureSystem'), { ssr: false });
const TaskManager = dynamic(() => import('@/components/TaskManager'), { ssr: false });
const TaskPanel = dynamic(() => import('@/components/TaskPanel'), { ssr: false });
const SystemControls = dynamic(() => import('@/components/SystemControls'), { ssr: false });
const ExpressionPanel = dynamic(() => import('@/components/ExpressionPanel'), { ssr: false });
const MemoryPanel = dynamic(() => import('@/components/MemoryPanel'), { ssr: false });
const FileDropZone = dynamic(() => import('@/components/FileDropZone'), { ssr: false });
const MobileControls = dynamic(() => import('@/components/MobileControls'), { ssr: false });
const StatusBar = dynamic(() => import('@/components/StatusBar'), { ssr: false });

export default function Home() {
  const { scene, isPhotoMode, activePanel } = useStore();
  useLifeEvents();
  
  // 启用内存优化系统
  useMemoryOptimization({
    enableModelLOD: true,
    enableTextureCompression: true,
    enableGarbageCollection: true,
    maxModels: 3,
    maxFurniture: 20,
    enablePerformanceMonitoring: true
  });

  const backgrounds: { [key: string]: string } = {
    room: 'url(/backgrounds/room.jpg)',
    beach: 'url(/backgrounds/beach.jpg)',
    city: 'url(/backgrounds/city.jpg)',
  };

  const backgroundStyle = {
    backgroundImage: backgrounds[scene] || 'none',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  };

  return (
    <main className="relative w-full h-screen overflow-hidden bg-gray-50" style={backgroundStyle}>
      <FileDropZone>
        <div className="absolute inset-0 z-0">
          <Scene />
        </div>
        <div className="absolute inset-0 z-10 pointer-events-none">
          <SystemControls />
          <MobileControls />
          
          <AnimatePresence>
            {!isPhotoMode && (
              <motion.div
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full h-full"
              >
                  <StatusBar />
                  <ChatInterface />
                  <div className="pointer-events-auto">
                      <SettingsPanel />
                      <ModelSelector />
                      <SceneSelector />
                      <ExpressionPanel />
                      <FurnitureSystem />
                      <TaskPanel />
                      <MemoryPanel />
                  </div>
                  <TaskManager />
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* 内存警告功能已集成到内存优化系统中 */}
        </div>
      </FileDropZone>
    </main>
  );
}
