'use client';

import { useState, useEffect } from 'react';
import { useStore, FurnitureItem } from '@/store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { FURNITURE_INTERACTIONS, Interaction } from '@/data/furnitureInteractions';
import { 
  Sofa, Bed, Table, Armchair, Lamp, TreePine, Library, Layers, Monitor, 
  Flower, Clock, Image, Disc, Archive, Box, Flame, Music, Laptop, Heart, 
  Circle, Home, Trash2, X, Play, Coffee, Move, Rotate3d, Scaling, Users,
  MousePointer2, Check
} from 'lucide-react';
import * as THREE from 'three';
import { useFurnitureInteractionEnhanced } from '@/hooks/useFurnitureInteractionEnhanced';

export default function FurnitureSystem() {
  const { 
    scene, addFurniture, furniture, removeFurniture, activePanel, setActivePanel,
    selectedFurnitureId, setSelectedFurnitureId, startInteraction, isEditMode, toggleEditMode,
    transformMode, setTransformMode, triggerAI, activeModels
  } = useStore();
  const showFurniturePanel = activePanel === 'furniture';
  const [activeTab, setActiveTab] = useState<'current' | 'add'>('add');
  const [targetCharacterId, setTargetCharacterId] = useState<string>('lumina');
  const fullAlignActions = new Set<string>(['sleep', 'lie_sofa']);
  
  // Get screen size for boundary checks (approximate)
  const [screenSize, setScreenSize] = useState({ width: 1920, height: 1080 });
  
  // 使用增强的家具交互系统
  const { 
    computeSmartInteractionTarget, 
    isInteractionWithinBounds,
    checkCollision,
    calculateAvoidancePath,
    initializePhysics
  } = useFurnitureInteractionEnhanced(
    {
      size: screenSize,
      camera: new THREE.PerspectiveCamera(75, screenSize.width / screenSize.height, 0.1, 1000)
    },
    {
      margin: 0.4,
      enableSmartPositioning: true,
      enableBoundaryConstraints: true,
      enablePostureAdaptation: true
    }
  );
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
        setScreenSize({ width: window.innerWidth, height: window.innerHeight });
        const handleResize = () => setScreenSize({ width: window.innerWidth, height: window.innerHeight });
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  // 初始化物理系统
  useEffect(() => {
    if (furniture.length > 0) {
      initializePhysics(furniture);
    }
  }, [furniture, initializePhysics]);

  // Ensure target character is valid
  useEffect(() => {
      if (activeModels.length > 0) {
          const exists = activeModels.find(m => m.id === targetCharacterId);
          if (!exists) {
              setTargetCharacterId(activeModels[0].id);
          }
      }
  }, [activeModels, targetCharacterId]);

  const computeInteractionTarget = (selectedItem: FurnitureItem, interaction: Interaction) => {
    // 使用增强的交互系统计算目标位置和旋转
    const result = computeSmartInteractionTarget(selectedItem);
    
    // 检查交互是否在边界内
    if (!isInteractionWithinBounds(result.targetPos)) {
      console.warn('家具交互位置超出边界，已自动调整');
    }
    
    // 碰撞检测和避障
    const targetPos = new THREE.Vector3(...result.targetPos);
    const currentPos = new THREE.Vector3(0, 0, 0); // 假设角色当前位置
    
    // 检查碰撞
    if (checkCollision(targetPos, furniture)) {
      console.log('检测到碰撞，计算避障路径');
      // 计算避障路径
      const safePos = calculateAvoidancePath(currentPos, targetPos, furniture);
      result.targetPos = [safePos.x, safePos.y, safePos.z];
    }
    
    return result;
  };

  const furnitureTypes = [
    { id: 'bed', name: '床', icon: Bed },
    { id: 'sofa', name: '沙发', icon: Sofa },
    { id: 'table', name: '桌子', icon: Table },
    { id: 'chair', name: '椅子', icon: Armchair },
    { id: 'lamp', name: '台灯', icon: Lamp },
    { id: 'tree', name: '树', icon: TreePine },
    { id: 'bookshelf', name: '书架', icon: Library },
    { id: 'rug', name: '地毯', icon: Layers },
    { id: 'tv', name: '电视', icon: Monitor },
    { id: 'plant', name: '植物', icon: Flower },
    { id: 'clock', name: '时钟', icon: Clock },
    { id: 'painting', name: '画作', icon: Image },
    { id: 'desk', name: '书桌', icon: Table },
    { id: 'stool', name: '凳子', icon: Disc },
    { id: 'cabinet', name: '柜子', icon: Archive },
    { id: 'mirror', name: '镜子', icon: Box },
    { id: 'fireplace', name: '壁炉', icon: Flame },
    { id: 'piano', name: '钢琴', icon: Music },
    { id: 'computer', name: '电脑', icon: Laptop },
    { id: 'cat_bed', name: '猫窝', icon: Heart },
    { id: 'bean_bag', name: '懒人沙发', icon: Circle },
    { id: 'coffee_machine', name: '咖啡机', icon: Coffee },
  ];

  const handleAddFurniture = (type: typeof furnitureTypes[0]) => {
    const newItem: FurnitureItem = {
      id: `${type.id}-${Date.now()}`,
      type: type.id,
      name: type.name,
      position: [Math.random() * 2 - 1, 0, Math.random() * 2 - 1], // Random position near center
      rotation: [0, Math.random() * Math.PI * 2, 0], // Random rotation
      scale: [1, 1, 1],
      scene: scene
    };
    addFurniture(newItem);
  };

  const currentSceneFurniture = furniture.filter(f => f.scene === scene);

  // Switch to 'current' tab automatically when a furniture is selected
  useEffect(() => {
    if (selectedFurnitureId) {
      setActiveTab('current');
    }
  }, [selectedFurnitureId]);

  return (
    <div className="z-50 pointer-events-none">
      {/* Container is pointer-events-none to let clicks pass through, but children re-enable it */}
      
      <AnimatePresence>
        {showFurniturePanel && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="pointer-events-auto fixed bottom-0 left-0 right-0 top-auto md:top-0 md:bottom-auto md:left-16 md:right-auto md:w-[360px] bg-white/95 backdrop-blur-xl rounded-t-2xl md:rounded-xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] md:shadow-2xl border-t md:border border-white/50 z-[9999] flex flex-col max-h-[80vh] md:max-h-[600px] safe-area-bottom"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-gray-100 shrink-0">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <Home size={18} className="text-pink-500" />
                家具库
              </h3>
              <div className="flex items-center gap-1">
                  <button 
                    onClick={toggleEditMode}
                    className={`p-1.5 rounded-full transition-colors ${isEditMode ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:bg-gray-100'}`}
                    title={isEditMode ? "退出编辑模式" : "进入编辑模式"}
                  >
                    <Move size={18} />
                  </button>
                  <button onClick={() => setActivePanel('none')} className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-full">
                    <X size={20} />
                  </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex p-1 mx-4 mt-2 bg-gray-100/50 rounded-lg shrink-0">
              <button
                onClick={() => setActiveTab('add')}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                  activeTab === 'add' 
                    ? 'bg-white text-gray-800 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                添加家具
              </button>
              <button
                onClick={() => setActiveTab('current')}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'current' 
                    ? 'bg-white text-gray-800 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                已放置
                {currentSceneFurniture.length > 0 && (
                  <span className="bg-pink-100 text-pink-600 px-1.5 py-0.5 rounded-full text-[10px]">
                    {currentSceneFurniture.length}
                  </span>
                )}
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 min-h-0">
              
              {activeTab === 'add' ? (
                /* Add Furniture Grid */
                <div className="grid grid-cols-4 gap-3 content-start pb-4">
                  {furnitureTypes.map((type) => (
                    <motion.button
                      key={type.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleAddFurniture(type)}
                      className="p-2 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col items-center gap-2 hover:border-pink-300 hover:shadow-md transition-all aspect-square justify-center group"
                    >
                      <type.icon size={24} className="text-pink-400 group-hover:text-pink-500 transition-colors" />
                      <span className="text-[10px] text-gray-500 group-hover:text-gray-700 truncate w-full text-center font-medium">{type.name}</span>
                    </motion.button>
                  ))}
                </div>
              ) : (
                /* Current Furniture List & Interactions */
                <div className="flex flex-col gap-4 pb-4">
                  {currentSceneFurniture.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-sm flex flex-col items-center gap-2">
                      <Box size={32} className="opacity-20" />
                      <span>当前场景还没有家具哦</span>
                      <button 
                        onClick={() => setActiveTab('add')}
                        className="text-pink-500 font-medium hover:underline mt-2"
                      >
                        去添加
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Interactions Panel (if selected) */}
                      <AnimatePresence mode="wait">
                        {selectedFurnitureId && (() => {
                          const selectedItem = furniture.find(f => f.id === selectedFurnitureId);
                          if (!selectedItem) return null;
                          const interactions = FURNITURE_INTERACTIONS[selectedItem.type] || [];
                          
                          return (
                            <motion.div 
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="flex flex-col gap-3 overflow-hidden"
                            >
                                {/* Transform Controls */}
                                {isEditMode && (
                                    <motion.div 
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm"
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs text-gray-500 font-medium flex items-center gap-1.5">
                                                <MousePointer2 size={12} />
                                                调整模式
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-1 bg-gray-100/50 p-1 rounded-lg">
                                            {[
                                                { id: 'translate', label: '移动', icon: Move },
                                                { id: 'rotate', label: '旋转', icon: Rotate3d },
                                                { id: 'scale', label: '缩放', icon: Scaling }
                                            ].map((mode) => (
                                                <button 
                                                    key={mode.id}
                                                    onClick={() => setTransformMode(mode.id as any)}
                                                    className={`
                                                        relative flex flex-col items-center justify-center gap-1 py-2 rounded-md text-xs font-medium transition-all duration-200
                                                        ${transformMode === mode.id 
                                                            ? 'bg-white text-blue-600 shadow-sm ring-1 ring-black/5' 
                                                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                                                        }
                                                    `}
                                                >
                                                    <mode.icon size={16} strokeWidth={transformMode === mode.id ? 2.5 : 2} />
                                                    <span>{mode.label}</span>
                                                    {transformMode === mode.id && (
                                                        <motion.div 
                                                            layoutId="activeTab"
                                                            className="absolute inset-0 border-2 border-blue-500/10 rounded-md"
                                                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                                        />
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                        
                                        {/* 移动端确认和删除按钮 */}
                                        {typeof window !== 'undefined' && window.innerWidth < 768 && (
                                            <div className="flex gap-2 mt-3">
                                                <button 
                                                    onClick={() => {
                                                        setTransformMode('translate');
                                                        setSelectedFurnitureId(null);
                                                    }}
                                                    className="flex-1 bg-green-500 text-white py-2 px-3 rounded-lg text-xs font-medium hover:bg-green-600 transition-colors flex items-center justify-center gap-1"
                                                >
                                                    <Check size={14} />
                                                    确定
                                                </button>
                                                <button 
                                                    onClick={() => {
                                                        if (selectedFurnitureId) {
                                                            removeFurniture(selectedFurnitureId);
                                                            setSelectedFurnitureId(null);
                                                        }
                                                    }}
                                                    className="flex-1 bg-red-500 text-white py-2 px-3 rounded-lg text-xs font-medium hover:bg-red-600 transition-colors flex items-center justify-center gap-1"
                                                >
                                                    <Trash2 size={14} />
                                                    删除
                                                </button>
                                            </div>
                                        )}
                                    </motion.div>
                                )}
            
                                {/* Character Selector */}
                                <div className="bg-purple-50/50 p-3 rounded-xl border border-purple-100">
                                    <div className="flex items-center justify-between mb-2">
                                         <span className="text-xs text-purple-600 font-medium flex items-center gap-1.5">
                                            <Users size={12} />
                                            互动角色
                                        </span>
                                    </div>
                                    <div className="relative">
                                        <select 
                                            value={targetCharacterId}
                                            onChange={(e) => setTargetCharacterId(e.target.value)}
                                            className="w-full text-xs bg-white border border-purple-200 rounded-lg pl-3 pr-8 py-2 text-gray-700 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all appearance-none cursor-pointer hover:bg-purple-50/30"
                                        >
                                            {activeModels.map(model => (
                                                <option key={model.id} value={model.id}>
                                                    {model.name}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-purple-400">
                                            <Users size={14} />
                                        </div>
                                    </div>
                                </div>
            
                               {/* Action Buttons */}
                               <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                                 <span className="text-xs text-blue-600 font-medium mb-2 flex items-center gap-1.5">
                                   <Play size={12} />
                                   {interactions.length > 0 ? `与 ${selectedItem.name} 互动` : `关于 ${selectedItem.name}`}
                                 </span>
                                 
                                 <div className="grid grid-cols-2 gap-2">
                                   {interactions.length > 0 ? (
                                      interactions.map((interaction, idx) => (
                                        <button
                                          key={idx}
                                          onClick={() => {
                                            try {
                                                const { targetPos, targetRot } = computeInteractionTarget(selectedItem, interaction);
                                                startInteraction(targetPos, targetRot, interaction.action as string, targetCharacterId);
                                                triggerAI(`[System Event] ${targetCharacterId} triggered interaction: ${interaction.label} with ${selectedItem.name}`);
                                            } catch (e) {
                                                console.error("Interaction Error:", e);
                                                triggerAI(`[Error] Failed to start interaction: ${e}`);
                                            }
                                         }}
                                         className="flex items-center justify-center gap-1.5 bg-white px-3 py-2.5 rounded-lg shadow-sm border border-blue-100 text-xs font-medium text-blue-700 hover:bg-blue-50 hover:border-blue-300 transition-all active:scale-95 group"
                                       >
                                         <Play size={12} className="fill-blue-700/20 group-hover:fill-blue-700 transition-colors" />
                                         {interaction.label}
                                       </button>
                                     ))
                                   ) : (
                                      <button
                                        onClick={() => triggerAI(`[System Event] User asks about ${selectedItem.name}.`)}
                                        className="col-span-2 flex items-center justify-center gap-1.5 bg-white px-3 py-2.5 rounded-lg shadow-sm border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-all active:scale-95"
                                      >
                                        <Play size={12} />
                                        询问 AI 关于此家具
                                      </button>
                                   )}
                                 </div>
                               </div>
                            </motion.div>
                          );
                        })()}
                      </AnimatePresence>
  
                      {/* List */}
                      <div className="flex flex-col gap-2">
                        <span className="text-xs text-gray-500 font-medium px-1">家具列表</span>
                        {currentSceneFurniture.map(item => (
                          <div 
                            key={item.id} 
                            onClick={() => setSelectedFurnitureId(item.id === selectedFurnitureId ? null : item.id)}
                            className={`flex justify-between items-center text-sm p-3 rounded-xl cursor-pointer transition-all ${item.id === selectedFurnitureId ? 'bg-white border-pink-400 shadow-sm ring-1 ring-pink-100' : 'bg-gray-50/50 hover:bg-white border-transparent hover:shadow-sm border'}`}
                          >
                            <div className="flex items-center gap-3 overflow-hidden">
                              <div className={`w-2 h-2 rounded-full shrink-0 ${item.id === selectedFurnitureId ? 'bg-pink-500' : 'bg-gray-300'}`} />
                              <span className={`truncate font-medium ${item.id === selectedFurnitureId ? 'text-pink-600' : 'text-gray-700'}`}>{item.name}</span>
                            </div>
                            <button 
                              onClick={(e) => { e.stopPropagation(); removeFurniture(item.id); }}
                              className="text-gray-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-lg transition-colors"
                              title="删除"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
