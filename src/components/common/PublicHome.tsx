'use client';

import Image from 'next/image';
import dynamic from 'next/dynamic';
import {
  H1,
  H2,
  LargeText,
  Text,
  SmallText,
} from '@/components/common/Typography';

const DynamicMap = dynamic(() => import('@/components/common/Maps/Map'), {
  ssr: false,
  loading: () => <LargeText>地図の読み込み中...</LargeText>,
});

export default function ClientHome() {
  return (
    <div className='flex flex-col items-center justify-center px-6 py-8 sm:p-8 md:p-12 lg:p-24 bg-background text-foreground'>
      <H1 className='mb-6 text-center'>『旅のしおり』について</H1>

      <Image
        className='relative dark:drop-shadow-[0_0_0.3rem_#ffffff70] mb-8'
        src='/azuki.webp'
        alt='あずきちゃん（スズキ エブリイワゴン）'
        width={120}
        height={120}
        priority
      />

      <div className='w-full max-w-3xl mx-auto space-y-6 px-4'>
        <LargeText className='text-center font-semibold'>
          旅行計画をもっと簡単に、もっと楽しく。
        </LargeText>

        <H2 className='mt-8 mb-4'>概要</H2>
        <Text>
          旅行計画の作成から実施までをサポートするウェブアプリケーションで、Google
          Maps連携により効率的な旅程管理を実現します。
          カーナビゲーション（Android Auto・Apple
          CarPlay）との連携を前提に設計されており、旅行中の移動をスムーズにサポートします。
        </Text>

        <H2 className='mt-8 mb-4'>主な機能</H2>
        <ul className='list-disc pl-6 space-y-2'>
          <li>
            <Text>
              <span className='font-semibold'>アカウント管理:</span>{' '}
              アカウントを作成して個人の旅程を管理
            </Text>
          </li>
          <li>
            <Text>
              <span className='font-semibold'>旅程作成・共有:</span>{' '}
              公開設定により、作成した旅程を他のユーザーと共有可能
            </Text>
          </li>
          <li>
            <Text>
              <span className='font-semibold'>複数日程対応:</span>{' '}
              複数日にわたる旅行計画を日ごとに管理
            </Text>
          </li>
          <li>
            <Text>
              <span className='font-semibold'>地図連携:</span>{' '}
              各アクティビティに地図情報を紐づけて視覚的に管理
            </Text>
          </li>
          <li>
            <Text>
              <span className='font-semibold'>座標データ連携:</span> Google
              Mapsから座標データをクリップボード経由で簡単インポート
            </Text>
          </li>
          <li>
            <Text>
              <span className='font-semibold'>ナビゲーション:</span>{' '}
              保存した位置情報からGoogle Maps起動やルート検索が可能
            </Text>
          </li>
          <li>
            <Text>
              <span className='font-semibold'>SNS共有:</span>{' '}
              旅程をX（Twitter）で共有するボタンを実装
            </Text>
          </li>
          <li>
            <Text>
              <span className='font-semibold'>車中泊スポットマップ:</span>{' '}
              開発中...
            </Text>
          </li>
        </ul>

        <div className='bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md mt-6'>
          <Text className='font-semibold'>ご注意:</Text>
          <Text>※旅程を編集するにはログインが必要です。</Text>
          <Text>※現在開発中のサービスです。</Text>
        </div>

        <SmallText className='text-center mt-8 text-gray-500 dark:text-gray-400'>
          続行することにより、本アプリの利用規約及びプライバシー及びCookieに関する声明に同意するものとします。
        </SmallText>
      </div>

      <div className='w-full max-w-4xl h-96 mt-12 mx-6 rounded-lg overflow-hidden shadow-lg'>
        <DynamicMap />
      </div>
    </div>
  );
}
