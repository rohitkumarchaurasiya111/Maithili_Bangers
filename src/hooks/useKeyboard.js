import { useEffect } from 'react';

export function useKeyboard({ onTogglePlay, onNext, onPrev, onMute }) {
  useEffect(() => {
    function handler(e) {
      if (e.target.tagName === 'INPUT') return;
      switch (e.code) {
        case 'Space':
          e.preventDefault();
          onTogglePlay();
          break;
        case 'ArrowRight':
          e.preventDefault();
          onNext();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          onPrev();
          break;
        case 'KeyM':
          onMute();
          break;
      }
    }
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onTogglePlay, onNext, onPrev, onMute]);
}
