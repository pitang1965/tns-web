'use client';

import { H1, LargeText } from '@/components/common/Typography';
import {
  buildHeroHeadline,
  HERO_SUBTITLE,
} from '@/components/landing/heroContent';
import HeroSearchForm from '@/components/landing/HeroSearchForm';

type HeroPreviewProps = {
  spotCount?: number;
};

export default function HeroPreview({ spotCount = 0 }: HeroPreviewProps) {
  return (
    <div className="relative h-[50vh] sm:h-[70vh] w-full px-2 sm:px-0">
      {/* 静的背景（マップ読み込み前のプレースホルダー） */}
      <div
        className="absolute inset-0 w-full h-full rounded-lg sm:rounded-none bg-linear-to-b from-sky-100 via-sky-50 to-green-50 dark:from-gray-800 dark:via-gray-700 dark:to-gray-600"
        style={{ left: '0.5rem', right: '0.5rem', width: 'calc(100% - 1rem)' }}
      />

      {/* Overlay Text（HeroMapSectionと同じUI） */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-4 sm:px-2">
        <div className="text-center px-4 sm:px-6 bg-white/60 sm:bg-white/80 dark:bg-gray-900/60 dark:sm:bg-gray-900/80 backdrop-blur-sm rounded-xl sm:rounded-2xl py-3 sm:p-8 shadow-xl sm:shadow-2xl max-w-3xl w-full">
          <H1 className="mb-3 sm:mb-4 text-gray-900 dark:text-white text-xl sm:text-3xl md:text-4xl font-bold">
            {buildHeroHeadline(spotCount)}
          </H1>
          <LargeText className="hidden sm:block text-gray-700 dark:text-gray-300 mb-6 text-base">
            {HERO_SUBTITLE}
          </LargeText>

          {/* Search Bar */}
          <HeroSearchForm />
        </div>
      </div>

      {/* Gradient Overlay at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-linear-to-t from-white dark:from-gray-900 to-transparent pointer-events-none" />
    </div>
  );
}
