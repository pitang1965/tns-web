import { useState, useEffect } from 'react';

/**
 * 画面の方向（横向き/縦向き）を検出するフック
 *
 * @returns {Object} - isLandscape: 横向きの場合true
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { isLandscape } = useOrientation();
 *   return <div>{isLandscape ? '横向き' : '縦向き'}</div>;
 * }
 * ```
 */
export function useOrientation() {
  const [isLandscape, setIsLandscape] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      setIsLandscape(window.innerWidth > window.innerHeight);
    };

    // Initial check
    checkOrientation();

    // Listen for resize and orientation change events
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  return { isLandscape };
}
