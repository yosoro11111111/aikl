import { useCallback } from 'react';

export type SoundType = 'click' | 'pop' | 'success' | 'error' | 'cute' | 'greeting' | 'notification' | 'laugh';

export const useSoundManager = () => {
  const playSound = useCallback((type: SoundType) => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;

      switch (type) {
        case 'click':
          osc.type = 'sine';
          osc.frequency.setValueAtTime(800, now);
          osc.frequency.exponentialRampToValueAtTime(400, now + 0.1);
          gain.gain.setValueAtTime(0.1, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
          osc.start(now);
          osc.stop(now + 0.1);
          break;
        case 'pop':
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(600, now);
          osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
          gain.gain.setValueAtTime(0.1, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
          osc.start(now);
          osc.stop(now + 0.1);
          break;
        case 'cute':
          osc.type = 'sine';
          osc.frequency.setValueAtTime(1200, now);
          osc.frequency.exponentialRampToValueAtTime(800, now + 0.2);
          gain.gain.setValueAtTime(0.1, now);
          gain.gain.linearRampToValueAtTime(0, now + 0.2);
          osc.start(now);
          osc.stop(now + 0.2);
          
          // Second beep for cuteness
          setTimeout(() => {
            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.connect(gain2);
            gain2.connect(ctx.destination);
            const now2 = ctx.currentTime;
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(1500, now2);
            osc2.frequency.exponentialRampToValueAtTime(1000, now2 + 0.2);
            gain2.gain.setValueAtTime(0.1, now2);
            gain2.gain.linearRampToValueAtTime(0, now2 + 0.2);
            osc2.start(now2);
            osc2.stop(now2 + 0.2);
          }, 150);
          break;
        case 'success':
          osc.type = 'sine';
          osc.frequency.setValueAtTime(440, now);
          osc.frequency.linearRampToValueAtTime(880, now + 0.1);
          gain.gain.setValueAtTime(0.1, now);
          gain.gain.linearRampToValueAtTime(0, now + 0.3);
          osc.start(now);
          osc.stop(now + 0.3);
          break;
        case 'error':
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(200, now);
          osc.frequency.linearRampToValueAtTime(100, now + 0.2);
          gain.gain.setValueAtTime(0.1, now);
          gain.gain.linearRampToValueAtTime(0, now + 0.2);
          osc.start(now);
          osc.stop(now + 0.2);
          break;
        case 'greeting':
          // Major chord arpeggio (C-E-G)
          const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
          notes.forEach((freq, i) => {
              const oscG = ctx.createOscillator();
              const gainG = ctx.createGain();
              oscG.connect(gainG);
              gainG.connect(ctx.destination);
              
              const start = now + i * 0.1;
              oscG.type = 'sine';
              oscG.frequency.setValueAtTime(freq, start);
              gainG.gain.setValueAtTime(0.05, start);
              gainG.gain.exponentialRampToValueAtTime(0.001, start + 0.4);
              
              oscG.start(start);
              oscG.stop(start + 0.4);
          });
          break;
        case 'notification':
          // Two-tone "Ding-Dong" (high-low)
          osc.type = 'sine';
          osc.frequency.setValueAtTime(1046.50, now); // C6
          gain.gain.setValueAtTime(0.05, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
          osc.start(now);
          osc.stop(now + 0.3);
          
          setTimeout(() => {
             const oscN = ctx.createOscillator();
             const gainN = ctx.createGain();
             oscN.connect(gainN);
             gainN.connect(ctx.destination);
             
             oscN.type = 'sine';
             oscN.frequency.setValueAtTime(783.99, ctx.currentTime); // G5
             gainN.gain.setValueAtTime(0.05, ctx.currentTime);
             gainN.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
             
             oscN.start(ctx.currentTime);
             oscN.stop(ctx.currentTime + 0.5);
          }, 200);
          break;
      }
    } catch (e) {
      console.error('Audio play failed', e);
    }
  }, []);

  return { playSound };
};
