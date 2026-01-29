import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { useSoundManager } from '@/hooks/useSoundManager';

export default function FileDropZone({ children }: { children: React.ReactNode }) {
  const [isDragging, setIsDragging] = useState(false);
  const { addAffection, addMessage, setAction, setEmotion } = useStore();
  const { playSound } = useSoundManager();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    const file = files[0];
    
    // Logic for different file types
    if (file.type.startsWith('image/')) {
        // Handle Image
        addAffection(5);
        setEmotion('happy');
        setAction('clap');
        playSound('success');
        addMessage({ role: 'assistant', content: `[emotion:happy] [action:clap] 哇！是新图片吗？好漂亮！(收到礼物: ${file.name})`, id: Date.now().toString() });
    } else if (file.type.startsWith('audio/')) {
        // Handle Audio
        addAffection(5);
        setEmotion('relaxed');
        setAction('dance');
        playSound('success');
        addMessage({ role: 'assistant', content: `[emotion:relaxed] [action:dance] 这是什么歌？听起来不错呢~(收到礼物: ${file.name})`, id: Date.now().toString() });
    } else {
        // Generic
        addAffection(2);
        setEmotion('neutral');
        setAction('nod');
        playSound('pop');
        addMessage({ role: 'assistant', content: `[emotion:neutral] [action:nod] 嗯？这是给我的文件吗？谢谢你。(收到礼物: ${file.name})`, id: Date.now().toString() });
    }
  };

  return (
    <div 
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="relative w-full h-full"
    >
      {children}
      {isDragging && (
        <div className="absolute inset-0 bg-pink-500/20 z-50 flex items-center justify-center pointer-events-none border-4 border-pink-400 border-dashed m-4 rounded-3xl">
          <div className="text-white text-2xl font-bold bg-pink-500 px-6 py-3 rounded-full shadow-lg">
            🎁 投喂礼物
          </div>
        </div>
      )}
    </div>
  );
}
