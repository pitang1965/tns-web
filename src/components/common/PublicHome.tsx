'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { SmallText } from '@/components/common/Typography';
import AboutSection from '@/components/landing/AboutSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import StatsSection from '@/components/landing/StatsSection';
import SNSSection from '@/components/landing/SNSSection';
import CTASection from '@/components/landing/CTASection';
import { LoadingState } from '@/components/common/LoadingState';

const HeroMapSection = dynamic(
  () => import('@/components/landing/HeroMapSection'),
  {
    ssr: false,
    loading: () => (
      <div className='h-[70vh] bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center'>
        <LoadingState variant='inline' />
      </div>
    ),
  }
);

type PublicHomeProps = {
  initialSpots?: any[];
}

export default function PublicHome({ initialSpots = [] }: PublicHomeProps) {
  return (
    <div className='flex flex-col bg-background text-foreground'>
      {/* Hero Map Section */}
      <Suspense fallback={<div className='h-[70vh] bg-gray-100' />}>
        <HeroMapSection initialSpots={initialSpots} />
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
