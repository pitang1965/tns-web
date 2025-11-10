'use client';

import { H2, Text } from '@/components/common/Typography';
import { Map, Share2, Navigation, FileText, MapPin, Car } from 'lucide-react';

const features = [
  {
    icon: FileText,
    title: '旅程作成・共有',
    description:
      '複数日にわたる旅行計画を簡単に作成。公開設定で他のユーザーと共有も可能です。車中泊スポットも簡単追加。',
    link: '/itineraries',
  },
  {
    icon: MapPin,
    title: '車中泊スポット情報',
    description:
      'トイレ・入浴施設、コンビニまでの距離、安全性・静けさの情報を提供。あなたのおすすめスポットも募集中！',
    link: '/shachu-haku',
  },
  {
    icon: Map,
    title: '地図連携',
    description:
      '各アクティビティに地図情報を紐づけて視覚的に管理。Google Mapsから座標を簡単インポート。',
    link: '/itineraries/new',
  },
  {
    icon: Navigation,
    title: 'カーナビ連携',
    description:
      'Android Auto・Apple CarPlay対応。保存した位置情報からGoogle Mapsを起動してルート検索。',
    link: '#',
  },
  {
    icon: Share2,
    title: '簡単共有',
    description:
      '旅程をSNS（X・LINE・Facebook等）やメールで簡単に共有できます。',
    link: '#',
  },
  {
    icon: Car,
    title: 'スポット投稿',
    description:
      'あなたが見つけた車中泊スポットを投稿して、他の旅行者と情報を共有しましょう。',
    link: '/shachu-haku/submit',
  },
];

export default function FeaturesSection() {
  return (
    <section className='py-16 px-6 bg-gray-50 dark:bg-gray-800'>
      <div className='max-w-6xl mx-auto'>
        <H2 className='text-center mb-12'>主な機能</H2>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <a
                key={index}
                href={feature.link}
                className='group bg-white dark:bg-gray-900 rounded-lg p-6 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1'
              >
                <div className='flex items-start space-x-4'>
                  <div className='shrink-0 w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-800 transition-colors'>
                    <Icon className='w-6 h-6 text-blue-600 dark:text-blue-400' />
                  </div>
                  <div className='flex-1'>
                    <h3 className='font-semibold text-lg mb-2 text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors'>
                      {feature.title}
                    </h3>
                    <Text className='text-gray-600 dark:text-gray-400 text-sm'>
                      {feature.description}
                    </Text>
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
