import React from 'react';

type ShortcutHandlers = {
  onFocusScan?: () => void;
  onStartBoarding?: () => void;
  onPrint?: () => void;
  onComplete?: () => void;
};

export const useStaffShortcuts = (handlers: ShortcutHandlers) => {
  const { onFocusScan, onStartBoarding, onPrint, onComplete } = handlers;

  React.useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (!e.ctrlKey) return;
      switch (e.key) {
        case '1':
          if (onFocusScan) { e.preventDefault(); onFocusScan(); }
          break;
        case '2':
          if (onStartBoarding) { e.preventDefault(); onStartBoarding(); }
          break;
        case '3':
          if (onPrint) { e.preventDefault(); onPrint(); }
          break;
        case 'Enter':
          if (onComplete) { e.preventDefault(); onComplete(); }
          break;
      }
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [onFocusScan, onStartBoarding, onPrint, onComplete]);
};


