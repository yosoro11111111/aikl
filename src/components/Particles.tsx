import { useStore } from '@/store/useStore';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Particle {
  id: number;
  x: number;
  y: number;
  type: 'heart' | 'star' | 'note' | 'flower' | 'sparkle';
}

export default function Particles() {
  const { particleTrigger, particlePosition } = useStore();
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (particleTrigger > 0) {
      // Spawn burst
      const newParticles: Particle[] = [];
      const count = particlePosition ? 8 : 15; // Increased count slightly
      const forcedType = particlePosition?.type;

      for (let i = 0; i < count; i++) {
        let x, y;
        
        if (particlePosition) {
           // Spawn around the specific position
           x = particlePosition.x + (Math.random() - 0.5) * 100;
           y = particlePosition.y + (Math.random() - 0.5) * 100;
        } else {
           // Random spawn
           x = Math.random() * window.innerWidth;
           y = Math.random() * window.innerHeight * 0.5 + window.innerHeight * 0.2;
        }

        let type: Particle['type'] = 'star';
        if (forcedType) {
            type = forcedType;
        } else {
            type = Math.random() > 0.5 ? 'heart' : 'star';
        }

        newParticles.push({
          id: Date.now() + i,
          x,
          y,
          type,
        });
      }
      setParticles(prev => [...prev, ...newParticles]);
      
      // Cleanup after animation
      setTimeout(() => {
        setParticles(prev => prev.filter(p => p.id < Date.now()));
      }, 2000);
    }
  }, [particleTrigger, particlePosition]);

  const getIcon = (type: Particle['type']) => {
      switch (type) {
          case 'heart': return '💖';
          case 'star': return '✨';
          case 'note': return '🎵';
          case 'flower': return '🌸';
          case 'sparkle': return '💫';
          default: return '✨';
      }
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-10 overflow-hidden">
      <AnimatePresence>
        {particles.map(p => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, scale: 0, x: p.x, y: p.y }}
            animate={{ 
              opacity: [0, 1, 0], 
              scale: [0.5, 1.5, 0.5], 
              y: p.y - 100,
              x: p.x + (Math.random() - 0.5) * 50,
              rotate: (Math.random() - 0.5) * 90
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="absolute text-2xl"
          >
            {getIcon(p.type)}
          </motion.div>
        ))}
      </AnimatePresence>
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 opacity-20 -z-10" />
    </div>
  );
}