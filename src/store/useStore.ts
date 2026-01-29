import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Message = {
  role: 'user' | 'assistant' | 'system';
  content: string;
  id: string;
  options?: string[]; // Suggested replies
  attachment?: {
    type: 'image' | 'text' | 'file';
    url?: string; // For images
    content?: string; // For text/code
    name: string;
  };
};

export type Emotion = 
  | 'neutral' 
  | 'happy' 
  | 'angry' 
  | 'sad' 
  | 'surprised'
  | 'shy'
  | 'disgust'
  | 'fear'
  | 'excited'
  | 'relaxed'
  | 'serious'
  | 'confused'
  | 'smug'
  | 'tired'
  | 'wink'
  | 'pain'
  | 'love'
  | 'sleepy'
  | 'pout'
  | 'focus';

export type Action = 
  | 'idle' 
  | 'nod' 
  | 'shake' 
  | 'jump' 
  | 'wave' 
  | 'dance' 
  | 'happy_dance'
  | 'clap' 
  | 'think' 
  | 'laugh' 
  | 'cry'
  | 'idle_look_around'
  | 'idle_sway'
  | 'idle_stretch'
  | 'idle_subtle_shift'
  | 'bow'
  | 'walk'
  | 'run'
  | 'sleep'
  | 'angry_pose'
  | 'surprised_pose'
  | 'shy_pose'
  | 'victory'
  | 'defeat'
  | 'sit_bed'
  | 'sit_sofa'
  | 'sit_chair'
  | 'lie_sofa'
  | 'play_piano'
  | 'type_keyboard'
  | 'brew_coffee'
  | 'crouch'
  | 'reach_out';

export interface ModelConfig {
  id: string;
  name: string;
  url: string;
  description: string;
  defaultEmotion?: Emotion;
}

export interface FurnitureItem {
  id: string;
  type: string;
  name: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  scene: string;
}

export interface InteractionState {
  isInteracting: boolean;
  targetPosition: [number, number, number] | null;
  targetRotation: [number, number, number] | null;
  targetAction: string | null;
  targetAvatarId: string | null;
}

// 桌宠化功能接口
export interface AvatarBounceState {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
}

export interface Task {
  id: string;
  description: string;
  target: number;
  progress: number;
  completed: boolean;
  type: 'chat' | 'pat' | 'interaction';
  reward: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  icon: string;
}

export interface Stats {
  totalChats: number;
  totalHeadPats: number;
  totalInteractions: number;
  loginDays: number;
}

export interface AppState {
  messages: Message[];
  addMessage: (message: Message) => void;
  rollbackMessages: (messageId: string) => void;
  clearMessages: () => void;
  // Settings - Expressions
  expressionExaggeration: number; // 0, 1, 2
  setExpressionExaggeration: (level: number) => void;
  isThinking: boolean;
  setIsThinking: (isThinking: boolean) => void;
  currentEmotion: Emotion;
  setEmotion: (emotion: Emotion) => void;
  currentAction: Action;
  setAction: (action: Action) => void;
  // Interaction
  targetBodyPart: string | null;
  setTargetBodyPart: (part: string | null) => void;
  isHovering: boolean;
  setIsHovering: (hovering: boolean) => void;
  isMaximized: boolean;
  toggleIsMaximized: () => void;
  // Quality Settings
  quality: 'low' | 'medium' | 'high' | 'ultra' | 'extreme' | 'master' | 'god' | 'absolute';
  setQuality: (quality: 'low' | 'medium' | 'high' | 'ultra' | 'extreme' | 'master' | 'god' | 'absolute') => void;
  // Avatar Control
  resetAvatarPosition: (avatarId?: string) => void;
  resetCamera: boolean;
  triggerResetCamera: () => void;
  isTalking: boolean;
  setIsTalking: (talking: boolean) => void;
  focusTarget: number[] | null; // [x, y, z]
  setFocusTarget: (target: number[] | null) => void;
  // Particles
  particleTrigger: number; // Increment to trigger
  particlePosition: { x: number, y: number, type?: 'heart' | 'star' | 'note' | 'flower' | 'sparkle' } | null;
  triggerParticles: (position?: { x: number, y: number, type?: 'heart' | 'star' | 'note' | 'flower' | 'sparkle' }) => void;
  // Settings
  isPhotoMode: boolean;
  togglePhotoMode: () => void;
  screenshotTrigger: number; // Increment to trigger screenshot
  triggerScreenshot: () => void;
  isEditMode: boolean;
  toggleEditMode: () => void;
  modelPositions: Record<string, [number, number, number]>;
  updateModelPosition: (id: string, position: [number, number, number]) => void;
  modelStates: Record<string, { action: Action; emotion: Emotion }>;
  setModelAction: (id: string, action: Action) => void;
  setModelEmotion: (id: string, emotion: Emotion) => void;
  bgmPlaying: boolean;
  toggleBgm: () => void;
  isVoiceEnabled: boolean;
  toggleVoiceEnabled: () => void;
  currentModel: ModelConfig; // @deprecated use activeModels[0] if needed, or for single selection context
  setCurrentModel: (model: ModelConfig) => void;
  activeModels: ModelConfig[];
  addActiveModel: (model: ModelConfig) => void;
  removeActiveModel: (modelId: string) => void;
  availableModels: ModelConfig[];
  setAvailableModels: (models: ModelConfig[] | ((prev: ModelConfig[]) => ModelConfig[])) => void;
  apiKey: string;
  setApiKey: (key: string) => void;
  affection: number;
  addAffection: (amount: number) => void;
  theme: 'light' | 'dark' | 'pink';
  setTheme: (theme: 'light' | 'dark' | 'pink') => void;
  outfit: string;
  setOutfit: (outfit: string) => void;
  scene: string;
  setScene: (scene: string) => void;
  availableScenes: { id: string; name: string; type: 'color' | 'image'; value: string }[];
  // Furniture
  furniture: FurnitureItem[];
  addFurniture: (item: FurnitureItem) => void;
  removeFurniture: (id: string) => void;
  updateFurniture: (id: string, updates: Partial<FurnitureItem>) => void;
  
  // Furniture Selection & Interaction
  selectedFurnitureId: string | null;
  setSelectedFurnitureId: (id: string | null) => void;
  interactionState: InteractionState;
  startInteraction: (position: [number, number, number], rotation: [number, number, number] | null, action: string, avatarId?: string) => void;
  stopInteraction: () => void;
  
  // AI Trigger
  aiRequest: string | null;
  triggerAI: (prompt: string) => void;

  // Transform Controls Mode
  transformMode: 'translate' | 'rotate' | 'scale';
  setTransformMode: (mode: 'translate' | 'rotate' | 'scale') => void;

  // Tasks & Achievements
  stats: Stats;
  updateStats: (updates: Partial<Stats>) => void;
  tasks: Task[];
  completeTask: (taskId: string) => void;
  incrementTaskProgress: (type: 'chat' | 'pat' | 'interaction', amount: number) => void;
  achievements: Achievement[];
  unlockAchievement: (achievementId: string) => void;
  // UI State
  activePanel: 'none' | 'settings' | 'models' | 'scenes' | 'tasks' | 'memories' | 'furniture' | 'expressions';
  setActivePanel: (panel: 'none' | 'settings' | 'models' | 'scenes' | 'tasks' | 'memories' | 'furniture' | 'expressions') => void;
  // Life Events & Personality
  lastLoginDate: string;
  updateLoginDate: () => void;
  lastInteractionTime: number;
  updateLastInteractionTime: () => void;
  unlockedMemories: string[];
  unlockMemory: (memoryId: string) => void;
  personality: 'normal' | 'tsundere' | 'sweet';
  setPersonality: (p: 'normal' | 'tsundere' | 'sweet') => void;
  interactionHistory: { nice: number; mean: number; touchy: number };
  updateInteractionHistory: (type: 'nice' | 'mean' | 'touchy') => void;
  
  // 桌宠化功能
  avatarBounce: AvatarBounceState;
  setAvatarBounce: (bounce: AvatarBounceState) => void;
  petLevel: number;
  setPetLevel: (level: number) => void;
  unlockPetAbility: (ability: string) => void;
  unlockedPetAbilities: string[];
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      messages: [],
      addMessage: (message) =>
        set((state) => {
            // Prevent duplicate messages (especially for init-message)
            if (state.messages.some(m => m.id === message.id)) {
                return {};
            }
            
            // Auto-increment chat tasks
            let newTasks = state.tasks;
            if (message.role === 'user') {
                 newTasks = state.tasks.map(t => {
                    if (t.type === 'chat' && !t.completed) {
                        const newProgress = Math.min(t.target, t.progress + 1);
                        return {
                            ...t,
                            progress: newProgress,
                            completed: newProgress >= t.target
                        };
                    }
                    return t;
                });
            }

            return { messages: [...state.messages, message], tasks: newTasks };
        }),
      rollbackMessages: (messageId) => set((state) => {
        const index = state.messages.findIndex(m => m.id === messageId);
        if (index === -1) return {};
        // Keep messages up to and including the target message
        return { messages: state.messages.slice(0, index + 1) };
      }),
      clearMessages: () => set({ messages: [] }),
      // Settings - Expressions
      expressionExaggeration: 0,
      setExpressionExaggeration: (level) => set({ expressionExaggeration: level }),
      isThinking: false,
      setIsThinking: (isThinking) => set({ isThinking }),
      currentEmotion: 'neutral',
      setEmotion: (emotion) => set({ currentEmotion: emotion }),
      currentAction: 'idle',
      setAction: (action) => set({ currentAction: action }),
      targetBodyPart: null,
      setTargetBodyPart: (part) => set({ targetBodyPart: part }),
      isHovering: false,
      setIsHovering: (hovering) => set({ isHovering: hovering }),
      isMaximized: false,
      toggleIsMaximized: () => set((state) => ({ isMaximized: !state.isMaximized })),
      quality: 'high',
      setQuality: (quality) => set({ quality }),
      resetAvatarPosition: (avatarId) => set((state) => {
        const newPositions = { ...state.modelPositions };
        if (avatarId) {
          delete newPositions[avatarId];
        } else {
          // Reset all active models
          state.activeModels.forEach(m => {
            delete newPositions[m.id];
          });
        }
        return { modelPositions: newPositions };
      }),
      resetCamera: false,
      triggerResetCamera: () => set({ resetCamera: true, focusTarget: null }),
      isTalking: false,
      setIsTalking: (talking) => set({ isTalking: talking }),
      focusTarget: null,
      setFocusTarget: (target) => set({ focusTarget: target, resetCamera: false }),
      particleTrigger: 0,
      particlePosition: null,
      triggerParticles: (position) => set((state) => ({ 
        particleTrigger: state.particleTrigger + 1,
        particlePosition: position || null 
      })),
      screenshotTrigger: 0,
      triggerScreenshot: () => set((state) => ({ screenshotTrigger: state.screenshotTrigger + 1 })),
      isEditMode: false,
      toggleEditMode: () => set((state) => ({ isEditMode: !state.isEditMode })),
      modelPositions: {},
      updateModelPosition: (id, position) => set((state) => ({
        modelPositions: { ...state.modelPositions, [id]: position }
      })),
      modelStates: {},
      setModelAction: (id, action) => set((state) => ({
        modelStates: {
          ...state.modelStates,
          [id]: {
            ...(state.modelStates[id] || { emotion: 'neutral' }),
            action
          }
        }
      })),
      setModelEmotion: (id, emotion) => set((state) => ({
        modelStates: {
          ...state.modelStates,
          [id]: {
            ...(state.modelStates[id] || { action: 'idle' }),
            emotion
          }
        }
      })),
      isPhotoMode: false,
      togglePhotoMode: () => set((state) => ({ isPhotoMode: !state.isPhotoMode })),
      bgmPlaying: false,
      toggleBgm: () => set((state) => ({ bgmPlaying: !state.bgmPlaying })),
      isVoiceEnabled: false,
      toggleVoiceEnabled: () => set((state) => ({ isVoiceEnabled: !state.isVoiceEnabled })),
      currentModel: {
        id: 'bronya',
        name: 'Bronya',
        url: '/models/Bronya.vrm',
        description: '默认角色',
        defaultEmotion: 'neutral'
      },
      setCurrentModel: (model) => set({ currentModel: model }),
      activeModels: [
        {
          id: 'bronya',
          name: 'Bronya',
          url: '/models/Bronya.vrm',
          description: '默认角色',
          defaultEmotion: 'neutral'
        }
      ],
      addActiveModel: (model) => set((state) => ({ activeModels: [...state.activeModels, model] })),
      removeActiveModel: (id) => set((state) => ({
        activeModels: state.activeModels.filter(m => m.id !== id)
      })),
      availableModels: [
        { id: 'lumina', name: 'Lumina', url: '/models/lumina.vrm', description: '默认角色', defaultEmotion: 'happy' },
        { id: 'bronya', name: 'Bronya', url: '/models/Bronya.vrm', description: 'Bronya', defaultEmotion: 'neutral' },
        { id: 'himeko', name: 'Himeko', url: '/models/Himeko.vrm', description: 'Himeko', defaultEmotion: 'neutral' },
        { id: 'kafka', name: 'Kafka', url: '/models/Kafka.vrm', description: 'Kafka', defaultEmotion: 'neutral' },
        { id: 'silverwolf', name: 'SilverWolf', url: '/models/SilverWolf.vrm', description: 'SilverWolf', defaultEmotion: 'neutral' },
        { id: 'march7th', name: 'March7th', url: '/models/March7th.vrm', description: 'March 7th', defaultEmotion: 'happy' },
        { id: 'seele', name: 'Seele', url: '/models/Seele.vrm', description: 'Seele', defaultEmotion: 'serious' },
        { id: 'jingliu', name: 'Jingliu', url: '/models/Jingliu.vrm', description: 'Jingliu', defaultEmotion: 'serious' },
        { id: 'topaz', name: 'Topaz', url: '/models/Topaz.vrm', description: 'Topaz', defaultEmotion: 'happy' },
        { id: 'fuxuan', name: 'FuXuan', url: '/models/FuXuan.vrm', description: 'Fu Xuan', defaultEmotion: 'serious' },
        { id: 'qingque', name: 'Qingque', url: '/models/Qingque.vrm', description: 'Qingque', defaultEmotion: 'happy' },
        { id: 'tingyun', name: 'Tingyun', url: '/models/Tingyun.vrm', description: 'Tingyun', defaultEmotion: 'happy' },
        { id: 'huohuo', name: 'Huohuo', url: '/models/Huohuo.vrm', description: 'Huohuo', defaultEmotion: 'fear' },
        { id: 'hanya', name: 'Hanya', url: '/models/Hanya.vrm', description: 'Hanya', defaultEmotion: 'serious' },
        { id: 'xueyi', name: 'Xueyi', url: '/models/Xueyi.vrm', description: 'Xueyi', defaultEmotion: 'serious' },
        { id: 'ruanmei', name: 'RuanMei', url: '/models/RuanMei.vrm', description: 'Ruan Mei', defaultEmotion: 'neutral' },
        { id: 'drratio', name: 'DrRatio', url: '/models/DrRatio.vrm', description: 'Dr. Ratio', defaultEmotion: 'serious' },
        { id: 'blackswan', name: 'BlackSwan', url: '/models/BlackSwan.vrm', description: 'Black Swan', defaultEmotion: 'neutral' },
        { id: 'sparkle', name: 'Sparkle', url: '/models/Sparkle.vrm', description: 'Sparkle', defaultEmotion: 'happy' },
        { id: 'acheron', name: 'Acheron', url: '/models/Acheron.vrm', description: 'Acheron', defaultEmotion: 'serious' },
        { id: 'aventurine', name: 'Aventurine', url: '/models/Aventurine.vrm', description: 'Aventurine', defaultEmotion: 'happy' },
        { id: 'robin', name: 'Robin', url: '/models/Robin.vrm', description: 'Robin', defaultEmotion: 'happy' },
        { id: 'boothill', name: 'Boothill', url: '/models/Boothill.vrm', description: 'Boothill', defaultEmotion: 'angry' },
        { id: 'firefly', name: 'Firefly', url: '/models/Firefly.vrm', description: 'Firefly', defaultEmotion: 'happy' },
        { id: 'jade', name: 'Jade', url: '/models/Jade.vrm', description: 'Jade', defaultEmotion: 'neutral' },
        { id: 'yunli', name: 'Yunli', url: '/models/Yunli.vrm', description: 'Yunli', defaultEmotion: 'happy' },
        { id: 'jiaoqiu', name: 'Jiaoqiu', url: '/models/Jiaoqiu.vrm', description: 'Jiaoqiu', defaultEmotion: 'neutral' },
        { id: 'feixiao', name: 'Feixiao', url: '/models/Feixiao.vrm', description: 'Feixiao', defaultEmotion: 'serious' },
        { id: 'lingsha', name: 'Lingsha', url: '/models/Lingsha.vrm', description: 'Lingsha', defaultEmotion: 'neutral' },
        { id: 'moze', name: 'Moze', url: '/models/Moze.vrm', description: 'Moze', defaultEmotion: 'serious' },
        { id: 'rappa', name: 'Rappa', url: '/models/Rappa.vrm', description: 'Rappa', defaultEmotion: 'happy' },
        { id: 'sunday', name: 'Sunday', url: '/models/Sunday.vrm', description: 'Sunday', defaultEmotion: 'neutral' },
        { id: 'fugue', name: 'Fugue', url: '/models/Fugue.vrm', description: 'Fugue', defaultEmotion: 'neutral' },
        { id: 'yuki', name: 'Yuki', url: '/models/yuki.vrm', description: 'Yuki', defaultEmotion: 'happy' },
        { id: 'qiqi', name: '七七', url: '/models/七七.vrm', description: '七七', defaultEmotion: 'neutral' },
        { id: 'kazuha', name: '万叶', url: '/models/万叶.vrm', description: '枫原万叶', defaultEmotion: 'relaxed' },
        { id: 'lisa', name: '丽莎', url: '/models/丽莎.vrm', description: '丽莎', defaultEmotion: 'relaxed' },
        { id: 'shinobu', name: '久岐忍', url: '/models/久岐忍.vrm', description: '久岐忍', defaultEmotion: 'serious' },
        { id: 'sara', name: '九条裟罗', url: '/models/九条裟罗.vrm', description: '九条裟罗', defaultEmotion: 'serious' },
        { id: 'yae', name: '八重神子', url: '/models/八重神子.vrm', description: '八重神子', defaultEmotion: 'smug' },
        { id: 'childe', name: '公子', url: '/models/公子.vrm', description: '达达利亚', defaultEmotion: 'happy' },
        { id: 'ningguang', name: '凝光', url: '/models/凝光.vrm', description: '凝光', defaultEmotion: 'serious' },
        { id: 'keqing', name: '刻晴', url: '/models/刻晴 (2).vrm', description: '刻晴', defaultEmotion: 'serious' },
        { id: 'beidou', name: '北斗', url: '/models/北斗.vrm', description: '北斗', defaultEmotion: 'happy' },
        { id: 'klee', name: '可莉', url: '/models/可莉.vrm', description: '可莉', defaultEmotion: 'happy' },
        { id: 'nilou', name: '妮露', url: '/models/妮露.vrm', description: '妮露', defaultEmotion: 'happy' },
        { id: 'amber', name: '安柏', url: '/models/安柏.vrm', description: '安柏', defaultEmotion: 'happy' },
        { id: 'nahida', name: '纳西妲', url: '/models/纳西妲.vrm', description: '纳西妲', defaultEmotion: 'happy' },
        { id: 'hutao', name: '胡桃', url: '/models/胡桃.vrm', description: '胡桃', defaultEmotion: 'happy' },
        { id: 'zhongli', name: '钟离', url: '/models/钟离.vrm', description: '钟离', defaultEmotion: 'serious' },
        { id: 'raiden', name: '雷电将军', url: '/models/雷电将军.vrm', description: '雷电将军', defaultEmotion: 'serious' },
        { id: 'xiao', name: '魈', url: '/models/魈.vrm', description: '魈', defaultEmotion: 'serious' },
      ],
      setAvailableModels: (models) => set((state) => ({ 
        availableModels: typeof models === 'function' ? models(state.availableModels) : models 
      })),
      apiKey: '',
      setApiKey: (key) => set({ apiKey: key }),
      affection: 20,
      addAffection: (amount) => set((state) => ({ affection: Math.min(100, Math.max(0, state.affection + amount)) })),
      theme: 'light',
      setTheme: (theme) => set({ theme }),
      outfit: 'normal',
      setOutfit: (outfit) => set({ outfit }),
      scene: 'bedroom',
      setScene: (scene) => set({ scene }),
      availableScenes: [
        { id: 'default', name: '默认白', type: 'color', value: '#f8fafc' },
        { id: 'warm', name: '温馨暖', type: 'color', value: '#fff1f2' },
        { id: 'cool', name: '清凉蓝', type: 'color', value: '#f0f9ff' },
        { id: 'fresh', name: '清新绿', type: 'color', value: '#f0fdf4' },
        { id: 'dark', name: '深邃黑', type: 'color', value: '#1a1a1a' },
        { id: 'purple', name: '梦幻紫', type: 'color', value: '#faf5ff' },
        { id: 'peach', name: '甜美粉', type: 'color', value: '#fff0f5' },
        { id: 'mint', name: '薄荷青', type: 'color', value: '#f0fff4' },
        { id: 'bedroom', name: '温馨卧室', type: 'image', value: 'https://images.unsplash.com/photo-1522771753033-6a586611f74e?q=80&w=2087&auto=format&fit=crop' },
        { id: 'livingroom', name: '现代客厅', type: 'image', value: 'https://images.unsplash.com/photo-1567225557594-88d73e55f2cb?q=80&w=1974&auto=format&fit=crop' },
        { id: 'garden', name: '阳光花园', type: 'image', value: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?q=80&w=2032&auto=format&fit=crop' },
        { id: 'cafe', name: '午后咖啡', type: 'image', value: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=2047&auto=format&fit=crop' },
        { id: 'night_city', name: '城市夜景', type: 'image', value: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?q=80&w=1964&auto=format&fit=crop' },
      ],
      furniture: [],
      addFurniture: (item) => set((state) => ({ furniture: [...state.furniture, item] })),
      removeFurniture: (id) => set((state) => ({ furniture: state.furniture.filter((f) => f.id !== id) })),
      updateFurniture: (id, updates) =>
        set((state) => ({
          furniture: state.furniture.map((f) => (f.id === id ? { ...f, ...updates } : f)),
        })),

      // Furniture Selection & Interaction
      selectedFurnitureId: null,
      setSelectedFurnitureId: (id) => set({ selectedFurnitureId: id }),
      interactionState: {
        isInteracting: false,
        targetPosition: null,
        targetRotation: null,
        targetAction: null,
        targetAvatarId: null,
      },
      startInteraction: (position, rotation, action, avatarId = 'lumina') => set({
        interactionState: {
          isInteracting: true,
          targetPosition: position,
          targetRotation: rotation,
          targetAction: action,
          targetAvatarId: avatarId
        }
      }),
      stopInteraction: () => set({
        interactionState: {
          isInteracting: false,
          targetPosition: null,
          targetRotation: null,
          targetAction: null,
          targetAvatarId: null
        }
      }),

      aiRequest: null,
      triggerAI: (prompt) => set({ aiRequest: prompt }),

      transformMode: 'translate',
      setTransformMode: (mode) => set({ transformMode: mode }),

      // Tasks & Achievements
      stats: {
        totalChats: 0,
        totalHeadPats: 0,
        totalInteractions: 0,
        loginDays: 1,
      },
      updateStats: (updates) => set((state) => ({ stats: { ...state.stats, ...updates } })),
      tasks: [
        { id: 'daily_chat', description: '和露米娜聊天 5 次', target: 5, progress: 0, completed: false, type: 'chat', reward: '解锁新动作' },
        { id: 'daily_pat', description: '摸摸头 3 次', target: 3, progress: 0, completed: false, type: 'pat', reward: '亲密度 +10' },
      ],
      completeTask: (taskId) => set((state) => ({
        tasks: state.tasks.map(t => t.id === taskId ? { ...t, completed: true, progress: t.target } : t)
      })),
      incrementTaskProgress: (type, amount) => set((state) => {
        const newTasks = state.tasks.map(t => {
           if (t.type === type && !t.completed) {
               const newProgress = Math.min(t.target, t.progress + amount);
               if (newProgress >= t.target && !t.completed) {
                   // Task completed!
                   // Maybe trigger notification here if we had one
               }
               return {
                   ...t,
                   progress: newProgress,
                   completed: newProgress >= t.target
               };
           }
           return t;
        });
        
        // Update stats
        const newStats = { ...state.stats };
        if (type === 'chat') newStats.totalChats += amount;
        if (type === 'pat') newStats.totalHeadPats += amount;
        if (type === 'interaction') newStats.totalInteractions += amount;

        return { tasks: newTasks, stats: newStats };
      }),
      achievements: [
        { id: 'first_chat', title: '初次见面', description: '完成第一次对话', unlocked: false, icon: '👋' },
        { id: 'best_friends', title: '好朋友', description: '亲密度达到 100', unlocked: false, icon: '❤️' },
      ],
      unlockAchievement: (achievementId) => set((state) => ({
        achievements: state.achievements.map(a => a.id === achievementId ? { ...a, unlocked: true } : a)
      })),
      // UI State
      activePanel: 'none',
      setActivePanel: (panel) => set({ activePanel: panel }),
      // Life Events
      lastLoginDate: new Date().toISOString().split('T')[0],
      updateLoginDate: () => set({ lastLoginDate: new Date().toISOString().split('T')[0] }),
      lastInteractionTime: Date.now(),
      updateLastInteractionTime: () => set({ lastInteractionTime: Date.now() }),
      unlockedMemories: [],
      unlockMemory: (memoryId) => set((state) => ({ unlockedMemories: [...state.unlockedMemories, memoryId] })),
      personality: 'normal',
      setPersonality: (p) => set({ personality: p }),
      interactionHistory: { nice: 0, mean: 0, touchy: 0 },
      updateInteractionHistory: (type) => set((state) => ({
        interactionHistory: { ...state.interactionHistory, [type]: state.interactionHistory[type] + 1 }
      })),
      
      // 桌宠化功能
      avatarBounce: { position: [0, 0, 0], rotation: [0, 0, 0], scale: 1 },
      setAvatarBounce: (bounce) => set({ avatarBounce: bounce }),
      petLevel: 1,
      setPetLevel: (level) => set({ petLevel: level }),
      unlockPetAbility: (ability) => set((state) => ({
        unlockedPetAbilities: [...new Set([...state.unlockedPetAbilities, ability])]
      })),
      unlockedPetAbilities: [],
    }),
    {
      name: 'yosoro-storage',
      partialize: (state) => ({
        messages: state.messages,
        expressionExaggeration: state.expressionExaggeration,
        isVoiceEnabled: state.isVoiceEnabled,
        apiKey: state.apiKey,
        affection: state.affection,
        theme: state.theme,
        outfit: state.outfit,
        scene: state.scene,
        furniture: state.furniture,
        stats: state.stats,
        tasks: state.tasks,
        achievements: state.achievements,
        lastLoginDate: state.lastLoginDate,
        unlockedMemories: state.unlockedMemories,
        personality: state.personality,
        interactionHistory: state.interactionHistory,
        activeModels: state.activeModels,
        currentModel: state.currentModel, // Persist current model
      }),
      version: 1,
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          // Migration from version 0 to 1: Fix default model
          const defaultModel = {
            id: 'bronya',
            name: 'Bronya',
            url: '/models/Bronya.vrm',
            description: '默认角色',
            defaultEmotion: 'neutral' as const
          };
          
          // Check if currentModel is invalid (miku or lumina)
          let currentModel = persistedState.currentModel;
          if (currentModel?.url?.includes('miku') || currentModel?.url?.includes('lumina')) {
             currentModel = defaultModel;
          }

          // Check activeModels
          let activeModels = persistedState.activeModels || [];
          activeModels = activeModels.map((m: any) => {
             if (m.url?.includes('miku') || m.url?.includes('lumina')) {
                 return defaultModel;
             }
             return m;
          });
          
          // Deduplicate if we replaced multiple with default
          const seen = new Set();
          activeModels = activeModels.filter((m: any) => {
              if (seen.has(m.id)) return false;
              seen.add(m.id);
              return true;
          });
          
          if (activeModels.length === 0) activeModels = [defaultModel];

          return {
            ...persistedState,
            currentModel,
            activeModels,
          };
        }
        return persistedState as AppState;
      },
    }
  )
);
