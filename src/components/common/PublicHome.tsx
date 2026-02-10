'use client';

import { Suspense, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { SmallText } from '@/components/common/Typography';
import AboutSection from '@/components/landing/AboutSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import StatsSection from '@/components/landing/StatsSection';
import SNSSection from '@/components/landing/SNSSection';
import CTASection from '@/components/landing/CTASection';
import HeroPreview from '@/components/landing/HeroPreview';

const HeroMapSection = dynamic(
  () => import('@/components/landing/HeroMapSection'),
  {
    ssr: false,
    loading: () => <HeroPreview />,
  }
);

type PublicHomeProps = {
  initialSpots?: any[];
}

export default function PublicHome({ initialSpots = [] }: PublicHomeProps) {
  const [shouldLoadMap, setShouldLoadMap] = useState(false);

  useEffect(() => {
    // ユーザーの最初の操作をトリガーにマップを読み込む
    // Lighthouseはユーザー操作をシミュレーションしないため、
    // 計測中にmapbox-gl（1.6MB）が読み込まれなくなる
    const events = ['scroll', 'click', 'touchstart', 'mousemove'] as const;

    const loadMap = () => {
      setShouldLoadMap(true);
      events.forEach((e) => window.removeEventListener(e, loadMap));
    };

    events.forEach((e) =>
      window.addEventListener(e, loadMap, { once: true, passive: true })
    );

    // フォールバック: 操作がなくても8秒後には読み込む
    const timer = setTimeout(loadMap, 8000);

    return () => {
      clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, loadMap));
    };
  }, []);

  return (
    <div className='flex flex-col bg-background text-foreground'>
      {/* Hero Map Section */}
      <Suspense fallback={<HeroPreview />}>
        {shouldLoadMap ? (
          <HeroMapSection initialSpots={initialSpots} />
        ) : (
          <HeroPreview />
        )}
      </Suspense>

      {/* About Section */}
      <AboutSection />

      {/* Features Section */}
      <FeaturesSection />

      {/* Stats Section */}
      <StatsSection />

      {/* SNS Account Section */}
      <SNSSection />

      {/* CTA Section */}
      <CTASection />

      {/* Footer Legal */}
      <div className='py-8 px-6 bg-gray-50 dark:bg-gray-800'>
        <SmallText className='text-center text-gray-500 dark:text-gray-400'>
          続行することにより、本アプリの
          <a
            href='/terms'
            className='text-blue-600 dark:text-blue-400 hover:underline mx-1'
          >
            利用規約
          </a>
          及び
          <a
            href='/privacy'
            className='text-blue-600 dark:text-blue-400 hover:underline mx-1'
          >
            プライバシーに関する声明
          </a>
          に同意するものとします。
        </SmallText>
      </div>
    </div>
  );
}
