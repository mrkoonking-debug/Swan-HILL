import { useEffect } from 'react';

/**
 * Custom hook to lock body scroll on mobile and desktop whenever a modal/dialog is open.
 * Prevents background scroll chaining and elastic rubber-band pull.
 */
export function useLockBodyScroll(lock: boolean) {
  useEffect(() => {
    if (!lock) return;

    const originalOverflow = document.body.style.overflow;
    const originalTouchAction = document.body.style.touchAction;
    const originalPosition = document.body.style.position;
    const originalWidth = document.body.style.width;

    // Lock body scroll completely
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.touchAction = originalTouchAction;
      document.body.style.position = originalPosition;
      document.body.style.width = originalWidth;
    };
  }, [lock]);
}
