import { useState, useEffect } from 'react';

/**
 * クライアントサイドでのマウント完了を検出するフック
 * SSRとクライアントの差異によるハイドレーションエラーを防ぐために使用
 *
 * @returns {boolean} - クライアントサイドでマウント済みの場合true
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const isClient = useIsClient();
 *
 *   // クライアントサイドでのみレンダリング
 *   if (!isClient) return null;
 *
 *   return <ClientOnlyComponent />;
 * }
 * ```
 */
export function useIsClient() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return isClient;
}
