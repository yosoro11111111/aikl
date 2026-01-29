'use client';

import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { useStore } from '@/store/useStore';

export default function ScreenshotManager() {
  const { gl } = useThree();
  const { screenshotTrigger } = useStore();

  useEffect(() => {
    if (screenshotTrigger > 0) {
      // Capture the canvas
      const dataURL = gl.domElement.toDataURL('image/png');
      
      // Create a link and download
      const link = document.createElement('a');
      link.href = dataURL;
      link.download = `yosoro-snap-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [screenshotTrigger, gl]);

  return null;
}
