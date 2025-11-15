'use client';

import { H2, Text } from '@/components/common/Typography';
import { Map, Navigation, Users } from 'lucide-react';

export default function AboutSection() {
  return (
    <section className='py-16 px-6 bg-white dark:bg-gray-900'>
      <div className='max-w-4xl mx-auto'>
        <H2 className='text-center mb-6'>車旅のしおりとは</H2>

        <div className='space-y-6 mb-12'>
          <Text className='text-center text-lg text-gray-700 dark:text-gray-300'>
            旅行計画の作成から実施までをサポートするウェブアプリケーションです。
            <br />
            Google Maps 連携により効率的な旅程管理を実現し、カーナビゲーション（Android Auto・Apple CarPlay）との連携を前提に設計されています。
          </Text>

          <Text className='text-center text-lg text-gray-700 dark:text-gray-300'>
            全国の車中泊スポット情報（トイレ・入浴施設、安全性、静けさなど）を地図で検索でき、気になるスポットは旅程に直接追加可能。
            ユーザー投稿機能により、コミュニティで情報を共有できます。
          </Text>
        </div>

        {/* 主な特徴 */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
          <div className='text-center'>
            <div className='w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4'>
              <Map className='w-8 h-8 text-blue-600 dark:text-blue-400' />
            </div>
            <h3 className='font-semibold text-lg mb-2 text-gray-900 dark:text-white'>
              Google Maps 連携
            </h3>
            <Text className='text-gray-600 dark:text-gray-400 text-sm'>
              座標データの簡単インポートと視覚的な旅程管理
            </Text>
          </div>

          <div className='text-center'>
            <div className='w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4'>
              <Navigation className='w-8 h-8 text-blue-600 dark:text-blue-400' />
            </div>
            <h3 className='font-semibold text-lg mb-2 text-gray-900 dark:text-white'>
              カーナビ連携
            </h3>
            <Text className='text-gray-600 dark:text-gray-400 text-sm'>
              Android Auto・Apple CarPlay対応でスムーズな移動
            </Text>
          </div>

          <div className='text-center'>
            <div className='w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4'>
              <Users className='w-8 h-8 text-blue-600 dark:text-blue-400' />
            </div>
            <h3 className='font-semibold text-lg mb-2 text-gray-900 dark:text-white'>
              コミュニティ共有
            </h3>
            <Text className='text-gray-600 dark:text-gray-400 text-sm'>
              車中泊スポット情報をユーザー同士で共有
            </Text>
          </div>
        </div>
      </div>
    </section>
  );
}
