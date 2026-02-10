'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { H1, LargeText } from '@/components/common/Typography';

export default function HeroPreview() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className='relative h-[50vh] sm:h-[70vh] w-full px-2 sm:px-0'>
      {/* 静的背景（マップ読み込み前のプレースホルダー） */}
      <div
        className='absolute inset-0 w-full h-full rounded-lg sm:rounded-none bg-gradient-to-b from-sky-100 via-sky-50 to-green-50 dark:from-gray-800 dark:via-gray-700 dark:to-gray-600'
        style={{ left: '0.5rem', right: '0.5rem', width: 'calc(100% - 1rem)' }}
      />

      {/* Overlay Text（HeroMapSectionと同じUI） */}
      <div className='absolute inset-0 flex items-center justify-center pointer-events-none px-4 sm:px-2'>
        <div className='text-center px-4 sm:px-6 bg-white/60 sm:bg-white/80 dark:bg-gray-900/60 dark:sm:bg-gray-900/80 backdrop-blur-sm rounded-xl sm:rounded-2xl py-3 sm:p-8 shadow-xl sm:shadow-2xl max-w-3xl w-full'>
          <H1 className='mb-3 sm:mb-4 text-gray-900 dark:text-white text-xl sm:text-3xl md:text-4xl font-bold'>
            車中泊スポットを探そう
          </H1>
          <LargeText className='hidden sm:block text-gray-700 dark:text-gray-300 mb-6 text-base'>
            旅行計画をもっと簡単に、もっと楽しく。
          </LargeText>

          {/* Search Bar */}
          <div className='pointer-events-auto mt-0 sm:mt-6'>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const params = new URLSearchParams();
                if (searchQuery.trim()) {
                  params.set('q', searchQuery.trim());
                }
                router.push(
                  `/shachu-haku${
                    params.toString() ? `?${params.toString()}` : ''
                  }`
                );
              }}
              className='flex flex-col gap-2 items-stretch w-full max-w-md mx-auto'
            >
              <input
                type='text'
                placeholder='キーワードで検索（例: 千葉県 RVパーク）'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='w-full px-3 sm:px-6 py-2 sm:py-4 text-sm sm:text-lg rounded-full border-2 border-blue-500 focus:border-blue-600 focus:outline-none focus:ring-2 sm:focus:ring-4 focus:ring-blue-200 dark:bg-gray-800 dark:border-blue-400 dark:text-white transition-all'
              />
              <button
                type='submit'
                className='w-full px-4 sm:px-8 py-2 sm:py-4 text-sm sm:text-base bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full transition-colors shadow-lg hover:shadow-xl cursor-pointer'
              >
                検索
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Gradient Overlay at bottom */}
      <div className='absolute bottom-0 left-0 right-0 h-32 bg-linear-to-t from-white dark:from-gray-900 to-transparent pointer-events-none' />
    </div>
  );
}
