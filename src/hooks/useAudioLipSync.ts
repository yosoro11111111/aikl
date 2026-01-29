import { useEffect, useRef, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { VRM } from '@pixiv/three-vrm';

export const useAudioLipSync = (vrm: VRM | null) => {
  const [isListening, setIsListening] = useState(false);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startAudio = useCallback(async () => {
    if (isListening) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;
      
      const source = audioContext.createMediaStreamSource(stream);
      const analyzer = audioContext.createAnalyser();
      analyzer.fftSize = 256;
      
      source.connect(analyzer);
      analyzerRef.current = analyzer;
      dataArrayRef.current = new Uint8Array(analyzer.frequencyBinCount);
      
      setIsListening(true);
      console.log("Audio Lip Sync Started");
    } catch (err) {
      console.error("Failed to start audio lip sync:", err);
    }
  }, [isListening]);

  const stopAudio = useCallback(() => {
    if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current) {
        audioContextRef.current.close();
    }
    setIsListening(false);
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
        stopAudio();
    };
  }, [stopAudio]);

  useFrame(() => {
    if (!vrm || !isListening || !analyzerRef.current || !dataArrayRef.current) return;

    // 获取音频数据
    analyzerRef.current.getByteFrequencyData(dataArrayRef.current as any);
    
    // 计算平均音量
    let sum = 0;
    // 聚焦于人声频率范围 (大致在 index 2 到 20 之间 for 256 fftSize)
    const startIndex = 2;
    const endIndex = 50;
    for (let i = startIndex; i < endIndex; i++) {
        sum += dataArrayRef.current[i];
    }
    const average = sum / (endIndex - startIndex);
    
    // 映射到嘴巴张合 (0 - 1)
    // 阈值调整: 假设 quiet 是 10, loud 是 100
    const sensitivity = 2.0; 
    const volume = Math.min(1, Math.max(0, (average - 10) / 100 * sensitivity));
    
    if (vrm.expressionManager) {
        // 平滑过渡
        const currentAa = vrm.expressionManager.getValue('aa') || 0;
        const targetAa = volume;
        vrm.expressionManager.setValue('aa', currentAa + (targetAa - currentAa) * 0.3);
        
        // 稍微加一点 'ih' 让嘴型更自然
        vrm.expressionManager.setValue('ih', volume * 0.3);
    }
  });

  return { isListening, startAudio, stopAudio };
};
