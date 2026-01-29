import { useCallback, useRef } from 'react';
import { useStore } from '@/store/useStore';

export const useTTS = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { isVoiceEnabled } = useStore();

  const speak = useCallback(async (text: string) => {
    if (!isVoiceEnabled || !text) return;

    // Filter out emotional tags for cleaner speech
    const cleanText = text
      .replace(/\[emotion:.*?\]/g, '')
      .replace(/\[action:.*?\]/g, '')
      .replace(/<options>.*<\/options>/, '')
      .trim();

    if (!cleanText) return;

    try {
      const response = await fetch('https://yy.yosoro.site/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer yosoro',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'tts-1',
          input: cleanText,
          voice: 'zh-CN-XiaoxiaoNeural',
          response_format: 'mp3',
          speed: 1,
        }),
      });

      if (!response.ok) {
        console.error('TTS API error:', response.statusText);
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      if (audioRef.current) {
        audioRef.current.pause();
        URL.revokeObjectURL(audioRef.current.src);
      }

      const audio = new Audio(url);
      audioRef.current = audio;
      audio.play().catch(e => console.error('Audio play failed:', e));
      
      audio.onended = () => {
        URL.revokeObjectURL(url);
      };

    } catch (error) {
      console.error('TTS error:', error);
    }
  }, [isVoiceEnabled]);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  }, []);

  return { speak, stop };
};
