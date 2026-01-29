'use client';

import { useState, useEffect, useRef } from 'react';
import { useStore, Message, Emotion, Action } from '@/store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Settings, User, Sparkles, Mic, MicOff, Clock, X, RotateCcw, Trash2, Brain, Heart } from 'lucide-react';
import { useSoundManager } from '@/hooks/useSoundManager';
import { useTTS } from '@/hooks/useTTS';
import { BeautifulButton } from '@/components/ui/BeautifulButton';
import { useEmotionDetection } from '@/hooks/useEmotionDetection';
import { useConversationMemory } from '@/hooks/useConversationMemory';

const ACTION_LIST: { id: Action; label: string }[] = [
  { id: 'wave', label: '招手' },
  { id: 'nod', label: '点头' },
  { id: 'shake', label: '摇头' },
  { id: 'laugh', label: '大笑' },
  { id: 'cry', label: '哭泣' },
  { id: 'think', label: '思考' },
  { id: 'clap', label: '鼓掌' },
  { id: 'dance', label: '跳舞' },
  { id: 'jump', label: '跳跃' },
  { id: 'bow', label: '鞠躬' },
  { id: 'walk', label: '走路' },
  { id: 'run', label: '跑步' },
  { id: 'sleep', label: '睡觉' },
  { id: 'angry_pose', label: '生气' },
  { id: 'surprised_pose', label: '惊讶' },
  { id: 'shy_pose', label: '害羞' },
  { id: 'victory', label: '胜利' },
  { id: 'defeat', label: '失败' },
  { id: 'idle_look_around', label: '张望' },
  { id: 'idle_stretch', label: '伸懒腰' },
];

export default function ChatInterface() {
  const { 
    messages, 
    addMessage, 
    clearMessages,
    isThinking, 
    setIsThinking, 
    setEmotion, 
    setAction,
    targetBodyPart, 
    setTargetBodyPart,
    apiKey,
    setIsTalking,
    activeModels,
    personality,
    incrementTaskProgress
  } = useStore();
  
  // 情感识别和上下文记忆
  const { detectEmotion, getResponseStyle, getEmotionAction } = useEmotionDetection();
  const { updateMemory, getContextPrompt, clearExpiredMemory } = useConversationMemory();
  
  // 智能对话状态
  const [currentUserEmotion, setCurrentUserEmotion] = useState('neutral');
  const [emotionIntensity, setEmotionIntensity] = useState(1);
  const [showEmotionIndicator, setShowEmotionIndicator] = useState(false);
  
  // 情感指示器定时器
  useEffect(() => {
    if (showEmotionIndicator) {
      const timer = setTimeout(() => {
        setShowEmotionIndicator(false);
      }, 3000); // 3秒后自动隐藏
      
      return () => clearTimeout(timer);
    }
  }, [showEmotionIndicator]);

  // Listen for AI requests from other components
  const { aiRequest, triggerAI } = useStore();
  
  useEffect(() => {
    if (aiRequest) {
        // Send as a user message describing the action
        handleSend(aiRequest);
        // Clear the request
        triggerAI(''); // Or add a clear method, but setting to empty string works if we check for truthiness
        // Actually, triggerAI takes a string. useStore implementation: triggerAI: (prompt) => set({ aiRequest: prompt })
        // So passing '' sets it to empty string. The check `if (aiRequest)` handles it.
        // Wait, better to be explicit.
    }
  }, [aiRequest]);
  
  const [input, setInput] = useState('');
  const [showActions, setShowActions] = useState(false);
  const [showHistory, setShowHistory] = useState(false); // 控制历史记录弹窗
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const { playSound } = useSoundManager();
  const { speak } = useTTS();
  const { rollbackMessages } = useStore(); // 获取回滚方法

  // 解析和渲染消息内容 (不再包含选项)
  const ParsedMessage = ({ message, isHistoryItem = false }: { message: any, isHistoryItem?: boolean }) => {
    const { content, attachment } = message;
    
    // 如果是礼物图片
    if (attachment && attachment.type === 'image' && attachment.url) {
        return (
            <div className="flex flex-col items-center gap-2">
                <div className="relative group">
                    <img 
                        src={attachment.url} 
                        alt={attachment.name}
                        className={`rounded-xl border-4 border-white shadow-xl transform transition-transform duration-300 ${
                            isHistoryItem 
                                ? 'max-w-[150px] max-h-[150px] rotate-0' 
                                : 'max-w-[200px] max-h-[200px] rotate-[-5deg] hover:rotate-0'
                        }`}
                    />
                    {!isHistoryItem && (
                        <div className="absolute -bottom-3 -right-3 bg-pink-500 text-white text-xs px-2 py-1 rounded-full shadow-md">
                            Gift 🎁
                        </div>
                    )}
                </div>
                <p 
                   className={`${isHistoryItem ? 'text-sm text-gray-700' : 'text-lg font-bold text-white/90'}`}
                   style={!isHistoryItem ? { textShadow: '1px 1px 0 #000' } : {}}
                 >
                   {content}
                 </p>
            </div>
        );
    }
    
    // 如果是文档/文件
    if (attachment && (attachment.type === 'text' || attachment.type === 'file')) {
        return (
            <div className="flex flex-col items-center gap-2">
                <div className={`bg-white/90 rounded-xl border-2 border-pink-300 shadow-xl ${isHistoryItem ? 'p-2 max-w-[200px]' : 'p-4 max-w-[250px]'}`}>
                    <div className="flex items-center gap-2 mb-2 text-pink-600 font-bold border-b border-pink-100 pb-1">
                        <span>📄</span>
                        <span className="truncate">{attachment.name}</span>
                    </div>
                    <div className="text-xs text-gray-600 max-h-[100px] overflow-hidden leading-relaxed">
                        {attachment.content || "Binary File"}
                    </div>
                </div>
                <p 
                   className={`${isHistoryItem ? 'text-sm text-gray-700' : 'text-lg font-bold text-white/90'}`}
                   style={!isHistoryItem ? { textShadow: '1px 1px 0 #000' } : {}}
                 >
                   {content}
                 </p>
            </div>
        );
    }

    const textPart = content
        .replace(/<options>.*<\/options>/, '')
        .replace(/\[emotion:.*?\]/g, '')
        .replace(/\[action:.*?\]/g, '')
        .trim();
        
    return (
      <p 
         className={isHistoryItem 
            ? "text-sm text-gray-700 leading-normal" 
            : "text-lg sm:text-xl md:text-2xl font-bold text-white leading-relaxed tracking-wide"
        }
        style={!isHistoryItem ? { 
            textShadow: '2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 0 0 20px rgba(236, 72, 153, 0.8)' 
        } : {}}
       >
         {textPart}
       </p>
    );
  };

  // 提取当前最新的选项
  const lastMessage = messages[messages.length - 1];
  let currentOptions: string[] = [];
  if (lastMessage && lastMessage.role === 'assistant') {
      const optionsMatch = lastMessage.content.match(/<options>(.*)<\/options>/);
      if (optionsMatch && optionsMatch[1]) {
          try {
              currentOptions = JSON.parse(optionsMatch[1]);
          } catch (e) {
              console.error("Failed to parse options:", e);
          }
      }
  }

  // 初始欢迎消息
  useEffect(() => {
    if (messages.length === 0) {
      addMessage({
        role: 'assistant',
        content: '你好呀！我是露米娜，你的专属AI伙伴。今天想聊些什么呢？<options>["你叫什么名字？", "你会做什么？", "我们来聊天吧！"]</options>',
        id: 'init-message'
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 语音识别初始化
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).webkitSpeechRecognition) {
        const SpeechRecognition = (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'zh-CN';

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setInput(transcript);
            setIsListening(false);
            playSound('success');
            // 自动发送
            setTimeout(() => handleSend(transcript), 500);
        };

        recognition.onerror = (event: any) => {
            console.error('Speech recognition error', event.error);
            setIsListening(false);
            playSound('error');
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognitionRef.current = recognition;
    }
  }, [playSound]);

  const toggleListening = () => {
      if (isListening) {
          recognitionRef.current?.stop();
          setIsListening(false);
      } else {
          recognitionRef.current?.start();
          setIsListening(true);
          playSound('click');
      }
  };

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 处理身体交互
  useEffect(() => {
    if (targetBodyPart) {
      handleInteraction(targetBodyPart);
      // Reset after a short delay to allow re-trigger
      const timer = setTimeout(() => setTargetBodyPart(null), 1000);
      return () => clearTimeout(timer);
    }
  }, [targetBodyPart]);

  const handleInteraction = async (part: string) => {
    if (isThinking) return;
    setIsThinking(true);
    
    try {
      console.log('Sending request to /api/chat with bodyPart:', part);
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            messages: messages.slice(-5),
            bodyPart: part,
            apiKey 
        }),
      });
      
      const data = await res.json();
      processResponse(data.reply);
    } catch (error) {
      console.error(error);
      const cuteErrorMessages = [
        '呜哇！网络好像开小差了，可以再说一遍吗？',
        '哎呀，我的思路好像卡住了... 重新整理一下语言再告诉我吧！',
        '风太大啦，我没听清你说什么，可以再说一次吗？',
        '糟糕，和服务器的连接断开惹... 检查一下网络再试试？'
      ];
      const randomError = cuteErrorMessages[Math.floor(Math.random() * cuteErrorMessages.length)];
      addMessage({
        role: 'assistant',
        content: randomError,
        id: Date.now().toString(),
      });
      setIsThinking(false);
    }
  };

  const handleSend = async (messageContent?: string) => {
    const textToSend = messageContent || input;
    if (!textToSend.trim() || isThinking) return;
    
    // 情感识别
    const emotionResult = detectEmotion(textToSend);
    setCurrentUserEmotion(emotionResult.emotion);
    setEmotionIntensity(emotionResult.intensity);
    setShowEmotionIndicator(true);
    
    // 更新上下文记忆
    updateMemory();
    clearExpiredMemory();
    
    const userMsg: Message = {
      role: 'user',
      content: textToSend,
      id: Date.now().toString(),
    };
    
    addMessage(userMsg);
    incrementTaskProgress('chat', 1);
    setInput('');
    setIsThinking(true);
    playSound('pop');

    // 根据用户情感设置角色反应
    const emotionAction = getEmotionAction(emotionResult.emotion);
    if (emotionAction && emotionAction !== 'neutral') {
      setAction(emotionAction as any);
      setEmotion(emotionResult.emotion as any);
    }

    // Get current persona from the first active model
    const currentModel = activeModels.length > 0 ? activeModels[0] : null;
    const persona = currentModel ? (currentModel.description || `You are ${currentModel.name}.`) : "You are a helpful AI assistant.";

    const PERSONALITY_TRAITS: Record<string, string> = {
      normal: "You are friendly, polite, and helpful.",
      tsundere: "You are a 'Tsundere' (傲娇). You act cold, harsh, and annoyed on the surface (saying 'Hmph', 'Baka', 'I didn't do it for you!'), but you secretly care about the user. You easily get flustered when complimented.",
      sweet: "You are 'Sweet' (甜美/粘人). You are extremely affectionate, gentle, and loving. You speak softly, express your love openly, and want to be close to the user."
    };

    // 获取上下文提示
    const contextPrompt = getContextPrompt();
    const responseStyle = getResponseStyle(emotionResult.emotion, emotionResult.intensity);

    const SYSTEM_INSTRUCTION = `
    Instructions:
    - ${persona}
    - Current Personality Mode: ${PERSONALITY_TRAITS[personality] || PERSONALITY_TRAITS.normal}
    - ${responseStyle}
    - ${contextPrompt}
    - Keep replies concise (1-2 sentences).
    - You CAN control your expression by adding [emotion:happy] (or angry, sad, shy, etc.) at the START of your reply.
    - You CAN control your action by adding [action:wave] (or nod, shake, jump, dance, etc.) at the START of your reply.
    - Example: "[emotion:happy] [action:wave] Hello! I am so glad to see you!"
    - If suggesting replies for the user, use <options>["Option 1", "Option 2"]</options> at the END.
    `;

    try {
      console.log('Sending request to /api/chat');
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            messages: [
                { role: 'system', content: SYSTEM_INSTRUCTION },
                ...messages.slice(-10), 
                userMsg
            ],
            apiKey 
        }),
      });
      
      const data = await res.json();
      processResponse(data.reply);
    } catch (error) {
      console.error(error);
      const cuteErrorMessages = [
        '呜哇！网络好像开小差了，可以再说一遍吗？',
        '哎呀，我的思路好像卡住了... 重新整理一下语言再告诉我吧！',
        '风太大啦，我没听清你说什么，可以再说一次吗？',
        '糟糕，和服务器的连接断开惹... 检查一下网络再试试？'
      ];
      const randomError = cuteErrorMessages[Math.floor(Math.random() * cuteErrorMessages.length)];
      addMessage({
        role: 'assistant',
        content: randomError,
        id: Date.now().toString(),
      });
      setIsThinking(false);
    }
  };

  const processResponse = (fullReply: string) => {
    // 1. Extract Emotion
    const emotionMatch = fullReply.match(/\[emotion:(.*?)\]/);
    if (emotionMatch && emotionMatch[1]) {
        // Remove trailing bracket if regex was greedy (though .*? should be fine)
        const em = emotionMatch[1].trim() as Emotion;
        setEmotion(em);
    }

    // 2. Extract Action
    const actionMatch = fullReply.match(/\[action:(.*?)\]/);
    if (actionMatch && actionMatch[1]) {
        const act = actionMatch[1].trim() as Action;
        setAction(act);
    }
    
    // 3. Extract Options (handled in render) and add message
    addMessage({
      role: 'assistant',
      content: fullReply,
      id: Date.now().toString(),
    });
    
    setIsThinking(false);
    setIsTalking(true);
    playSound('pop');
    speak(fullReply);
    
    // Stop talking animation after a while (estimate based on length)
    // Rough estimate: 200ms per character
    const textLength = fullReply.replace(/<.*?>/g, '').length;
    setTimeout(() => setIsTalking(false), Math.min(textLength * 200, 5000));
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-end p-4 sm:p-8">
        {/* 顶部按钮组 */}
        <div className="absolute top-4 right-4 z-50 pointer-events-auto flex gap-2">
            <BeautifulButton
                icon={Trash2}
                onClick={() => {
                    if (window.confirm('确定要清空所有对话并重新开始吗？')) {
                        clearMessages();
                        playSound('click');
                    }
                }}
                variant="glass"
                size="sm"
                color="red"
                glow={false}
                title="重新对话"
            />
            <BeautifulButton
                icon={Clock}
                onClick={() => setShowHistory(true)}
                variant="glass"
                size="sm"
                color="blue"
                glow={false}
                title="聊天历史"
            />
        </div>

        {/* 历史消息弹窗 (Modal) */}
        <AnimatePresence>
            {showHistory && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm pointer-events-auto">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="bg-white/95 w-full max-w-lg h-[70vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-white/50"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white">
                            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <Clock size={20} className="text-pink-500" />
                                时光机 (Time Machine)
                            </h3>
                            <button 
                                onClick={() => setShowHistory(false)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-gray-50/50">
                            {messages.map((msg, index) => (
                                <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                    {/* Avatar Placeholder */}
                                    <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${
                                        msg.role === 'user' ? 'bg-pink-100 text-pink-600' : 'bg-blue-100 text-blue-600'
                                    }`}>
                                        {msg.role === 'user' ? 'ME' : 'AI'}
                                    </div>
                                    
                                    <div className={`flex flex-col max-w-[75%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                        <div className={`rounded-2xl px-4 py-3 shadow-sm ${
                                            msg.role === 'user' 
                                                ? 'bg-pink-50 text-gray-800 rounded-tr-sm' 
                                                : 'bg-white text-gray-800 rounded-tl-sm border border-gray-100'
                                        }`}>
                                            <ParsedMessage message={msg} isHistoryItem={true} />
                                        </div>
                                        
                                        {/* Rollback Button */}
                                        <button
                                            onClick={() => {
                                                if (window.confirm('确定要回到这句话的时候吗？之后的对话将会消失哦。')) {
                                                    rollbackMessages(msg.id);
                                                    setShowHistory(false);
                                                    playSound('click');
                                                }
                                            }}
                                            className="mt-1 text-xs text-gray-400 hover:text-pink-500 flex items-center gap-1 transition-colors px-1"
                                        >
                                            <RotateCcw size={12} />
                                            回到这里
                                        </button>
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>

        {/* 动态浮动文字区域 (Floating Text) - 移至右侧避免遮挡模型 */}
        <div className="absolute top-[15%] right-4 md:right-[20%] flex flex-col items-end z-40 pointer-events-none px-4">
            <AnimatePresence mode="wait">
                {messages.length > 0 && (
                    <motion.div
                        key={messages[messages.length - 1].id} // 确保每次消息变化都重新触发动画
                        initial={{ opacity: 0, scale: 0.8, x: 20 }}
                        animate={{ 
                            opacity: 1, 
                            scale: 1,
                            x: 0,
                        }}
                        exit={{ opacity: 0, scale: 0.8, x: 20 }}
                        transition={{ 
                            type: "spring",
                            stiffness: 300,
                            damping: 25
                        }}
                        className="max-w-[280px] md:max-w-md origin-top-right"
                    >
                        {messages[messages.length - 1].role === 'assistant' 
                            ? (
                                <motion.div
                                    animate={{ 
                                        y: [0, -5, 0],
                                    }}
                                    transition={{
                                        duration: 4,
                                        repeat: Infinity,
                                        ease: "easeInOut"
                                    }}
                                >
                                    <ParsedMessage message={messages[messages.length - 1]} />
                                </motion.div>
                            )
                            : (
                                <p 
                                    className="text-xl font-bold text-white/80"
                                    style={{ textShadow: '1px 1px 0 #000' }}
                                >
                                    {messages[messages.length - 1].attachment ? '🎁 发送礼物中...' : '思考中...'}
                                </p>
                            )
                        }
                    </motion.div>
                )}
            </AnimatePresence>
        </div>

        {/* 选项区域 (Floating Options) - 位于输入框上方 */}
        {currentOptions.length > 0 && !isThinking && (
            <div className="w-full max-w-2xl mx-auto mb-4 flex flex-wrap justify-center gap-2 pointer-events-auto">
                {currentOptions.map((option, index) => (
                    <BeautifulButton
                        key={index}
                        onClick={() => { setInput(option); setTimeout(() => handleSend(option), 50); }}
                        variant="glass"
                        size="sm"
                        color="purple"
                        glow={false}
                        className="min-w-[120px]"
                    >
                        {option}
                    </BeautifulButton>
                ))}
            </div>
        )}

        {/* 动作选择菜单 (Action Menu) */}
        <AnimatePresence>
            {showActions && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute bottom-24 left-1/2 -translate-x-1/2 w-[95vw] max-w-2xl bg-white/80 backdrop-blur-xl rounded-2xl p-4 shadow-2xl border border-white/50 pointer-events-auto z-50"
                >
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                        {ACTION_LIST.map((action) => (
                            <BeautifulButton
                                key={action.id}
                                onClick={() => { setAction(action.id); setShowActions(false); }}
                                variant="glass"
                                size="sm"
                                color="pink"
                                glow={false}
                                className="text-xs py-3"
                            >
                                {action.label}
                            </BeautifulButton>
                        ))}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

      {/* 底部输入栏 */}
      <div className="pointer-events-auto w-full max-w-2xl mx-auto glass-effect rounded-full p-2 shadow-2xl flex items-center gap-2 relative z-50 touch-optimized">
        
        {/* 动作按钮 */}
        <BeautifulButton
            icon={Sparkles}
            onClick={() => { setShowActions(!showActions); playSound('click'); }}
            variant="glass"
            size="sm"
            color="pink"
            glow={showActions}
            pulse={showActions}
            isActive={showActions}
            className="flex-shrink-0"
        />

        {/* 语音按钮 */}
        <BeautifulButton
            icon={isListening ? MicOff : Mic}
            onClick={toggleListening}
            variant={isListening ? "neon" : "glass"}
            size="sm"
            color={isListening ? "red" : "blue"}
            glow={isListening}
            pulse={isListening}
            className="flex-shrink-0"
        />

        <div className="w-[1px] h-6 bg-gray-300/50 mx-1"></div>

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="有什么悄悄话想对我说吗？"
          className="flex-1 bg-transparent border-none outline-none text-gray-700 placeholder-gray-400 px-2 py-2 text-sm"
          disabled={isThinking}
        />
        
        {/* 情感指示器 */}
        <AnimatePresence>
          {showEmotionIndicator && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="hidden sm:flex items-center gap-1 px-2 py-1 bg-white/80 rounded-full text-xs font-medium"
            >
              <Heart className="w-3 h-3 text-pink-500" />
              <span className="text-gray-700">
                {currentUserEmotion === 'happy' && '😊 开心'}
                {currentUserEmotion === 'sad' && '😢 难过'}
                {currentUserEmotion === 'angry' && '😠 生气'}
                {currentUserEmotion === 'surprised' && '😲 惊讶'}
                {currentUserEmotion === 'love' && '❤️ 喜欢'}
                {currentUserEmotion === 'shy' && '😳 害羞'}
                {currentUserEmotion === 'excited' && '🎉 兴奋'}
                {currentUserEmotion === 'neutral' && '😐 中性'}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
        
        <BeautifulButton
            icon={Send}
            onClick={() => handleSend()}
            disabled={isThinking}
            variant={isThinking ? "glass" : "gradient"}
            size="sm"
            color="pink"
            glow={!isThinking}
            pulse={!isThinking}
            className="flex-shrink-0"
        />
      </div>
    </div>
  );
}
