'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useStore } from '@/store/useStore';

interface MemoryOptimizationConfig {
  enableModelLOD?: boolean;
  enableTextureCompression?: boolean;
  enableGarbageCollection?: boolean;
  maxModels?: number;
  maxFurniture?: number;
  enablePerformanceMonitoring?: boolean;
}

interface MemoryStats {
  totalMemory: number;
  usedMemory: number;
  freeMemory: number;
  modelCount: number;
  furnitureCount: number;
  textureCount: number;
}

export const useMemoryOptimization = (config: MemoryOptimizationConfig = {}) => {
  const { 
    activeModels, 
    furniture, 
    removeActiveModel, 
    removeFurniture,
    setActivePanel
  } = useStore();
  
  const {
    enableModelLOD = true,
    enableTextureCompression = true,
    enableGarbageCollection = true,
    maxModels = 3,
    maxFurniture = 20,
    enablePerformanceMonitoring = true
  } = config;

  const statsRef = useRef<MemoryStats>({
    totalMemory: 0,
    usedMemory: 0,
    freeMemory: 0,
    modelCount: 0,
    furnitureCount: 0,
    textureCount: 0
  });

  // 内存监控
  const monitorMemory = useCallback(() => {
    // 使用更安全的内存监控方式
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      const memory = (performance as any).memory;
      statsRef.current = {
        totalMemory: memory.jsHeapSizeLimit || 0,
        usedMemory: memory.usedJSHeapSize || 0,
        freeMemory: (memory.totalJSHeapSize || 0) - (memory.usedJSHeapSize || 0),
        modelCount: activeModels.length,
        furnitureCount: furniture.length,
        textureCount: 0 // 需要从Three.js获取
      };
    } else {
      // 备用内存估算
      statsRef.current = {
        totalMemory: 0,
        usedMemory: 0,
        freeMemory: 0,
        modelCount: activeModels.length,
        furnitureCount: furniture.length,
        textureCount: 0
      };
    }
    
    return statsRef.current;
  }, [activeModels, furniture]);

  // 模型数量限制
  const enforceModelLimit = useCallback(() => {
    if (activeModels.length > maxModels) {
      // 移除最旧的模型
      const modelsToRemove = activeModels.slice(maxModels);
      modelsToRemove.forEach(model => {
        removeActiveModel(model.id);
        console.log(`内存优化: 移除模型 ${model.name} (超过限制 ${maxModels})`);
      });
    }
  }, [activeModels, maxModels, removeActiveModel]);

  // 家具数量限制
  const enforceFurnitureLimit = useCallback(() => {
    if (furniture.length > maxFurniture) {
      // 移除最旧的家具
      const furnitureToRemove = furniture.slice(maxFurniture);
      furnitureToRemove.forEach(item => {
        removeFurniture(item.id);
        console.log(`内存优化: 移除家具 ${item.name} (超过限制 ${maxFurniture})`);
      });
    }
  }, [furniture, maxFurniture, removeFurniture]);

  // 垃圾回收优化
  const optimizeGarbageCollection = useCallback(() => {
    if (enableGarbageCollection) {
      // 强制垃圾回收（如果浏览器支持）
      if (typeof window !== 'undefined' && (window as any).gc) {
        (window as any).gc();
      }
      
      // 清理Three.js缓存（在组件中处理）
      // THREE.Cache.clear(); // 需要在Three.js组件中调用
    }
  }, [enableGarbageCollection]);

  // 性能监控
  const setupPerformanceMonitoring = useCallback(() => {
    if (enablePerformanceMonitoring) {
      // 监控帧率
      let frameCount = 0;
      let lastTime = performance.now();
      
      const monitorFrameRate = () => {
        frameCount++;
        const currentTime = performance.now();
        
        if (currentTime - lastTime >= 1000) {
          const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
          
          if (fps < 30) {
            // 帧率过低，触发优化
            console.warn(`帧率过低: ${fps}FPS，触发内存优化`);
            optimizeGarbageCollection();
            enforceModelLimit();
            enforceFurnitureLimit();
          }
          
          frameCount = 0;
          lastTime = currentTime;
        }
        
        requestAnimationFrame(monitorFrameRate);
      };
      
      monitorFrameRate();
    }
  }, [enablePerformanceMonitoring, optimizeGarbageCollection, enforceModelLimit, enforceFurnitureLimit]);

  // 内存使用警告
  const checkMemoryUsage = useCallback(() => {
    const stats = monitorMemory();
    
    if (stats.usedMemory > stats.totalMemory * 0.8 && stats.totalMemory > 0) {
      // 内存使用超过80%，触发警告
      console.warn('内存使用超过80%，建议减少模型或家具数量');
      
      // 显示内存警告界面（使用现有的settings面板）
      setActivePanel('settings');
      
      // 自动优化
      enforceModelLimit();
      enforceFurnitureLimit();
      optimizeGarbageCollection();
    }
  }, [monitorMemory, enforceModelLimit, enforceFurnitureLimit, optimizeGarbageCollection, setActivePanel]);

  // 初始化优化
  useEffect(() => {
    console.log('内存优化系统初始化');
    
    // 设置优化策略
    setupPerformanceMonitoring();
    
    // 定期检查内存使用
    const memoryCheckInterval = setInterval(checkMemoryUsage, 5000);
    
    // 定期垃圾回收
    const gcInterval = setInterval(optimizeGarbageCollection, 30000);
    
    return () => {
      clearInterval(memoryCheckInterval);
      clearInterval(gcInterval);
    };
  }, [setupPerformanceMonitoring, checkMemoryUsage, optimizeGarbageCollection]);

  // 响应式优化
  useEffect(() => {
    enforceModelLimit();
    enforceFurnitureLimit();
  }, [activeModels.length, furniture.length, enforceModelLimit, enforceFurnitureLimit]);

  return {
    getMemoryStats: monitorMemory,
    optimizeMemory: optimizeGarbageCollection,
    enforceLimits: () => {
      enforceModelLimit();
      enforceFurnitureLimit();
    },
    getConfig: () => config
  };
};