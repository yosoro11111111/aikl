'use client';

import { useEffect, useRef, useState } from 'react';
import { useStore } from '@/store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { 
    Settings, 
    Users, 
    Map, 
    ClipboardList, 
    Book, 
    Sofa, 
    Camera, 
    Music, 
    Move,
    ChevronLeft,
    ChevronRight,
    X,
    Mic,
    MicOff,
    Gift,
    RotateCcw
} from 'lucide-react';
import { useGiftSystem } from '@/hooks/useGiftSystem';

export default function SystemControls() {
  const { 
    activePanel, 
    setActivePanel, 
    isPhotoMode, 
    togglePhotoMode,
    bgmPlaying,
    toggleBgm,
    isEditMode,
    toggleEditMode,
    triggerScreenshot,
    isVoiceEnabled,
    toggleVoiceEnabled,
    resetAvatarPosition
  } = useStore();
  
  const { fileInputRef, handleGiftClick, processFile } = useGiftSystem();
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorNodesRef = useRef<OscillatorNode[]>([]);
  const gainNodesRef = useRef<GainNode[]>([]);
  const loopTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);

  // Define buttons list for desktop (matches MobileControls but tailored for desktop layout)
  const buttons = [
    { 
      id: 'settings', 
      icon: Settings, 
      label: '设置', 
      action: () => setActivePanel(activePanel === 'settings' ? 'none' : 'settings'),
      isActive: activePanel === 'settings'
    },
    { 
      id: 'models', 
      icon: Users, 
      label: '角色', 
      action: () => setActivePanel(activePanel === 'models' ? 'none' : 'models'),
      isActive: activePanel === 'models'
    },
    { 
      id: 'scenes', 
      icon: Map, 
      label: '场景', 
      action: () => setActivePanel(activePanel === 'scenes' ? 'none' : 'scenes'),
      isActive: activePanel === 'scenes'
    },
    { 
      id: 'tasks', 
      icon: ClipboardList, 
      label: '任务', 
      action: () => setActivePanel(activePanel === 'tasks' ? 'none' : 'tasks'),
      isActive: activePanel === 'tasks'
    },
    { 
      id: 'memories', 
      icon: Book, 
      label: '记忆', 
      action: () => setActivePanel(activePanel === 'memories' ? 'none' : 'memories'),
      isActive: activePanel === 'memories'
    },
    { 
      id: 'furniture', 
      icon: Sofa, 
      label: '家具', 
      action: () => setActivePanel(activePanel === 'furniture' ? 'none' : 'furniture'),
      isActive: activePanel === 'furniture'
    },
    {
      id: 'gift',
      icon: Gift,
      label: '送礼',
      action: handleGiftClick,
      isActive: false
    },
    {
      id: 'bgm',
      icon: Music,
      label: '音乐',
      action: toggleBgm,
      isActive: bgmPlaying
    },
    {
      id: 'voice',
      icon: isVoiceEnabled ? Mic : MicOff,
      label: '语音',
      action: toggleVoiceEnabled,
      isActive: isVoiceEnabled
    },
    {
      id: 'reset_avatar',
      icon: RotateCcw,
      label: '归位',
      action: () => resetAvatarPosition(),
      isActive: false
    },
    {
      id: 'edit',
      icon: Move,
      label: '编辑',
      action: toggleEditMode,
      isActive: isEditMode
    },
    {
      id: 'photo',
      icon: Camera,
      label: '拍照',
      action: () => handlePhotoClick(),
      isActive: false
    }
  ];

  const handlePhotoClick = () => {
    // 1. Enter Photo Mode (hides UI)
    if (!isPhotoMode) {
        togglePhotoMode();
    }
    
    // 2. Start Countdown
    setCountdown(5);
  };

  useEffect(() => {
    if (!isPhotoMode) {
      setCountdown(null);
      return;
    }

    if (countdown === null) return;

    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      // Countdown finished (0)
      // 3. Trigger Screenshot
      triggerScreenshot();
      
      // 4. Wait a bit then reset/exit or stay
      const timer = setTimeout(() => {
          setCountdown(null);
      }, 500); 
      return () => clearTimeout(timer);
    }
  }, [countdown, triggerScreenshot, isPhotoMode]);

  // BGM Logic (Same as before)
  useEffect(() => {
    if (bgmPlaying) {
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        
        if (!audioContextRef.current) {
            audioContextRef.current = new AudioContext();
        }
        
        const ctx = audioContextRef.current;
        if (ctx.state === 'suspended') {
            ctx.resume();
        }

        // Clean up previous
        oscillatorNodesRef.current.forEach(osc => osc.stop());
        oscillatorNodesRef.current = [];
        gainNodesRef.current = [];

        // Simple chord progression: Cmaj7 - Fmaj7
        const notes = [
            261.63, 329.63, 392.00, 493.88, // Cmaj7
            349.23, 440.00, 523.25, 659.25  // Fmaj7
        ];

        const playNote = (freq: number, time: number, duration: number) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, time);
            
            // Envelope
            const attackRelease = Math.min(0.5, duration * 0.4);
            
            gain.gain.setValueAtTime(0, time);
            gain.gain.linearRampToValueAtTime(0.05, time + attackRelease);
            gain.gain.linearRampToValueAtTime(0.05, time + duration - attackRelease);
            gain.gain.linearRampToValueAtTime(0, time + duration);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(time);
            osc.stop(time + duration);

            oscillatorNodesRef.current.push(osc);
            gainNodesRef.current.push(gain);
        };

        const now = ctx.currentTime;
        const loopDuration = 8; // seconds

        // Loop function
        const scheduleLoop = (startTime: number) => {
             // Chord 1: Cmaj7
             playNote(notes[0], startTime, 4);
             playNote(notes[1], startTime + 0.1, 4);
             playNote(notes[2], startTime + 0.2, 4);
             playNote(notes[3], startTime + 0.3, 4);

             // Chord 2: Fmaj7
             playNote(notes[4], startTime + 4, 4);
             playNote(notes[5], startTime + 4.1, 4);
             playNote(notes[6], startTime + 4.2, 4);
             playNote(notes[7], startTime + 4.3, 4);

             // Melody Arpeggio
             const melodyNotes = [notes[2], notes[3], notes[4], notes[3], notes[2]];
             melodyNotes.forEach((note, i) => {
                 playNote(note * 2, startTime + i * 0.5, 0.4);
             });
             
             // Next loop
             loopTimerRef.current = setTimeout(() => {
                 if (bgmPlaying && audioContextRef.current?.state === 'running') {
                     scheduleLoop(audioContextRef.current.currentTime);
                 }
             }, (loopDuration - 0.1) * 1000);
        };

        scheduleLoop(now);

      } catch (e) {
        console.error('BGM Error:', e);
      }
    } else {
      if (gainNodesRef.current.length > 0) {
          // Fade out all
          gainNodesRef.current.forEach(g => {
             try {
                g.gain.cancelScheduledValues(0);
                g.gain.linearRampToValueAtTime(0, audioContextRef.current!.currentTime + 0.5);
             } catch(e) {}
          });
          
          setTimeout(() => {
              oscillatorNodesRef.current.forEach(o => {
                  try { o.stop(); } catch(e) {}
              });
              oscillatorNodesRef.current = [];
              gainNodesRef.current = [];
          }, 500);
      }
    }

    return () => {
        if (loopTimerRef.current) clearTimeout(loopTimerRef.current);
        oscillatorNodesRef.current.forEach(o => {
            try { o.stop(); } catch(e) {}
        });
    };
  }, [bgmPlaying]);

  return (
    <>
      {/* Countdown Overlay */}
      <AnimatePresence>
        {countdown !== null && countdown > 0 && (
            <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.5 }}
                key={countdown}
                className="fixed inset-0 flex items-center justify-center z-[100] pointer-events-none"
            >
                <span className="text-9xl font-bold text-white drop-shadow-[0_0_10px_rgba(0,0,0,0.5)]">
                    {countdown}
                </span>
            </motion.div>
        )}
      </AnimatePresence>

      {/* Photo Mode Exit Button (Only visible in Photo Mode) */}
      <AnimatePresence>
        {isPhotoMode && (
            <div className="absolute top-4 right-4 z-50 pointer-events-auto">
                <Button
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  onClick={togglePhotoMode}
                  variant="danger"
                  size="icon"
                  title="退出拍照模式"
                  aria-label="退出拍照模式"
                >
                  <X size={22} />
                </Button>
            </div>
        )}
      </AnimatePresence>

      {/* Normal Controls (Hidden in Photo Mode) */}
      <AnimatePresence>
        {!isPhotoMode && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 z-50 pointer-events-auto hidden md:flex flex-col items-end gap-2">
                <Button
                  onClick={() => setIsExpanded(!isExpanded)}
                  variant="glass"
                  size="icon"
                  className="mb-2 text-pink-500"
                  aria-label={isExpanded ? '收起控制栏' : '展开控制栏'}
                  title={isExpanded ? '收起控制栏' : '展开控制栏'}
                >
                  {isExpanded ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                </Button>

                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 50 }}
                            className="ui-glass flex flex-col gap-3 p-3 rounded-[var(--radius-lg)] max-h-[80vh] overflow-y-auto custom-scrollbar"
                        >
                            {buttons.map((btn) => (
                                <motion.button
                                    key={btn.id}
                                    whileHover={{ scale: 1.1, x: -5 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => btn.action()}
                                    className={`ui-focus-ring p-3 rounded-[var(--radius-pill)] shadow-lg backdrop-blur-md border border-white/50 transition-all relative group ${
                                        btn.isActive 
                                        ? 'bg-pink-500 text-white shadow-pink-500/30' 
                                            : 'bg-white/80 text-gray-700 hover:bg-white/90'
                                    }`}
                                >
                                    <btn.icon size={20} className={btn.id === 'bgm' && btn.isActive ? "animate-pulse" : ""} />
                                    
                                    {/* Tooltip */}
                                    <span className="absolute right-full mr-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-black/70 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                        {btn.label}
                                    </span>
                                </motion.button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        )}
      </AnimatePresence>
      
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        onChange={processFile}
        accept="image/*,text/*,.md,.txt,.json,.js,.ts"
      />
    </>
  );
}
