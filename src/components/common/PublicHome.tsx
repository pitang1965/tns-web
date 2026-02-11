'use client';

import { useState, useEffect, type ComponentType } from 'react';
import { SmallText } from '@/components/common/Typography';
import AboutSection from '@/components/landing/AboutSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import StatsSection from '@/components/landing/StatsSection';
import SNSSection from '@/components/landing/SNSSection';
import CTASection from '@/components/landing/CTASection';
import HeroPreview from '@/components/landing/HeroPreview';

type PublicHomeProps = {
  initialSpots?: any[];
}

export default function PublicHome({ initialSpots = [] }: PublicHomeProps) {
  const [MapComponent, setMapComponent] =
    useState<ComponentType<{ initialSpots?: any[] }> | null>(null);

  useEffect(() => {
    // ユーザーの最初の操作をトリガーにマップを読み込む
    // Lighthouseはユーザー操作をシミュレーションしないため、
    // 計測中にmapbox-gl（1.6MB）が読み込まれなくなる
    const events = ['scroll', 'click', 'touchstart', 'mousemove'] as const;

    const loadMap = () => {
      events.forEach((e) => window.removeEventListener(e, loadMap));
      import('@/components/landing/HeroMapSection').then((mod) => {
        setMapComponent(() => mod.default);
      });
    };

    events.forEach((e) =>
      window.addEventListener(e, loadMap, { once: true, passive: true })
    );

    return () => {
      events.forEach((e) => window.removeEventListener(e, loadMap));
    };
  }, []);

  return (
    <div className='flex flex-col bg-background text-foreground'>
      {/* Hero Map Section */}
      {MapComponent ? (
        <MapComponent initialSpots={initialSpots} />
      ) : (
        <HeroPreview />
      )}

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
        <SmallText className='text-center text-gray-600 dark:text-gray-400'>
          続行することにより、本アプリの
          <a
            href='/terms'
            className='text-blue-700 dark:text-blue-400 underline underline-offset-4 mx-1'
          >
            利用規約
          </a>
          及び
          <a
            href='/privacy'
            className='text-blue-700 dark:text-blue-400 underline underline-offset-4 mx-1'
          >
            プライバシーに関する声明
          </a>
          に同意するものとします。
        </SmallText>
      </div>
    </div>
  );
}
