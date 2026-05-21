import { useState, useCallback } from 'react';

type RecentUrl = {
  url: string;
  title: string;
  timestamp: number;
};

const STORAGE_KEY = 'recent-urls';
const MAX_RECENT_URLS = 5;

export function useRecentUrls() {
  const [recentUrls, setRecentUrls] = useState<RecentUrl[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored) as RecentUrl[];
      return [];
    } catch {
      return [];
    }
  });

  // 履歴をローカルストレージに保存
  const saveToStorage = useCallback((urls: RecentUrl[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(urls));
    } catch (error) {
      console.error('Failed to save recent URLs:', error);
    }
  }, []);

  // 新しいURLを履歴に追加
  const addUrl = useCallback(
    (url: string, title: string) => {
      setRecentUrls((prevUrls) => {
        // 既存のURLを除外
        const filteredUrls = prevUrls.filter((item) => item.url !== url);

        // 新しいURLを先頭に追加
        const newUrls = [
          { url, title, timestamp: Date.now() },
          ...filteredUrls,
        ].slice(0, MAX_RECENT_URLS);

        saveToStorage(newUrls);
        return newUrls;
      });
    },
    [saveToStorage],
  );

  // 履歴をクリア
  const clearHistory = useCallback(() => {
    setRecentUrls([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // 特定のURLを履歴から削除
  const removeUrl = useCallback(
    (urlToRemove: string) => {
      setRecentUrls((prevUrls) => {
        const filteredUrls = prevUrls.filter(
          (item) => item.url !== urlToRemove,
        );
        saveToStorage(filteredUrls);
        return filteredUrls;
      });
    },
    [saveToStorage],
  );

  return {
    recentUrls,
    addUrl,
    clearHistory,
    removeUrl,
  };
}
