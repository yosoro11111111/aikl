'use client';

import { useStore } from '@/store/useStore';
import { Sun, Moon, Palette } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ThemeToggle() {
  const { theme, setTheme } = useStore();

  const themes = [
    { id: 'light', name: '明亮', icon: Sun, color: 'bg-yellow-100 text-yellow-800' },
    { id: 'dark', name: '暗黑', icon: Moon, color: 'bg-gray-800 text-gray-100' },
    { id: 'pink', name: '粉色', icon: Palette, color: 'bg-pink-100 text-pink-800' },
  ];

  return (
    <div className="mb-4">
      <h4 className="font-medium text-gray-700 mb-2">主题风格</h4>
      <div className="flex gap-2">
        {themes.map((t) => {
          const Icon = t.icon;
          return (
            <motion.button
              key={t.id}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setTheme(t.id as 'light' | 'dark' | 'pink')}
              className={`p-2 rounded-lg flex flex-col items-center ${
                theme === t.id
                  ? 'ring-2 ring-pink-500 ' + t.color
                  : t.color + ' opacity-70 hover:opacity-100'
              }`}
            >
              <Icon size={16} />
              <span className="text-xs mt-1">{t.name}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}