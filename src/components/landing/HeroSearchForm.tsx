'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { capture } from '@/lib/analytics';

// ヒーローの検索UIは HeroPreview（マップ読み込み前）と HeroMapSection の
// 両方で表示するため共通化する。表示が切り替わっても見た目が変わらないようにする狙いもある。

// チップはキーワード検索（q）ではなく、shachu-haku ページが解釈する
// 種別（type）・料金（pricing）フィルターへ直接リンクする
const QUICK_TAGS: { label: string; params: Record<string, string> }[] = [
  { label: '道の駅', params: { type: 'roadside_station' } },
  { label: 'RVパーク', params: { type: 'rv_park' } },
  { label: '温泉', params: { type: 'onsen_facility' } },
  { label: '無料スポット', params: { pricing: 'free' } },
];

export default function HeroSearchForm() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const goToShachuHaku = (params: Record<string, string>) => {
    const search = new URLSearchParams(params);
    router.push(
      `/shachu-haku${search.toString() ? `?${search.toString()}` : ''}`,
    );
  };

  const goToSearch = (query: string) => {
    const trimmed = query.trim();
    if (trimmed) {
      // 遷移前に発火する（リダイレクト先での URL 初期化では二重計上しない）
      capture('spot_search', { query: trimmed, source: 'hero' });
    }
    goToShachuHaku(trimmed ? { q: trimmed } : {});
  };

  return (
    <div className="pointer-events-auto mt-0 sm:mt-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          goToSearch(searchQuery);
        }}
        className="flex flex-col gap-2 items-stretch w-full max-w-md mx-auto"
      >
        <input
          type="text"
          placeholder="キーワードで検索（例: 千葉県 RVパーク）"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 sm:px-6 py-2 sm:py-4 text-sm sm:text-lg rounded-full border-2 border-blue-500 focus:border-blue-600 focus:outline-none focus:ring-2 sm:focus:ring-4 focus:ring-blue-200 dark:bg-gray-800 dark:border-blue-400 dark:text-white transition-all"
        />
        <button
          type="submit"
          className="w-full px-4 sm:px-8 py-2 sm:py-4 text-sm sm:text-base bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full transition-colors shadow-lg hover:shadow-xl cursor-pointer"
        >
          検索
        </button>
      </form>

      {/* よく検索されるキーワード（モバイルは縦スペースが限られるため非表示） */}
      <div className="hidden sm:flex flex-wrap gap-2 justify-center mt-4">
        {QUICK_TAGS.map((tag) => (
          <button
            key={tag.label}
            type="button"
            onClick={() => goToShachuHaku(tag.params)}
            className="px-4 py-1.5 text-sm rounded-full bg-white/80 hover:bg-white text-gray-700 border border-gray-300 hover:border-blue-400 dark:bg-gray-800/80 dark:hover:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:border-blue-500 shadow-sm transition-all cursor-pointer"
          >
            {tag.label}
          </button>
        ))}
      </div>

      {/* スポット診断への導線（最大の差別化機能なのでヒーローで訴求する） */}
      <div className="mt-3 sm:mt-4 text-center">
        <Link
          href="/shachu-haku/shindan"
          className="inline-flex items-center gap-1.5 text-sm sm:text-base font-medium text-blue-700 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-200 underline underline-offset-4 transition-colors"
        >
          <Sparkles className="w-4 h-4" />
          10問でぴったりのスポットを診断する
        </Link>
      </div>
    </div>
  );
}
