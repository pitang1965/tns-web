import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MapPin, MousePointer2, Filter, Search } from 'lucide-react';

export const metadata: Metadata = {
  title: 'ヘルプ | 車旅のしおり',
  description: '車旅のしおりの使い方',
};

export default function HelpPage() {
  return (
    <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
      <div className='container mx-auto px-4 py-8 max-w-4xl'>
        {/* Header */}
        <div className='mb-8'>
          <Link href='/'>
            <Button variant='ghost' className='mb-4'>
              <ArrowLeft className='w-4 h-4 mr-2' />
              ホームに戻る
            </Button>
          </Link>
          <h1 className='text-3xl font-bold text-gray-900 dark:text-gray-100'>
            ヘルプ
          </h1>
          <p className='mt-2 text-gray-600 dark:text-gray-400'>
            車旅のしおりの使い方をご案内します
          </p>
        </div>

        {/* 車中泊マップの使い方 */}
        <section className='mb-12 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6'>
          <div className='flex items-center mb-4'>
            <MapPin className='w-6 h-6 mr-2 text-blue-600 dark:text-blue-400' />
            <h2 className='text-2xl font-bold text-gray-900 dark:text-gray-100'>
              車中泊マップの使い方
            </h2>
          </div>

          {/* マーカーの色 */}
          <div className='mb-6'>
            <h3 className='text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200'>
              マーカーの色と評価
            </h3>
            <div className='space-y-2 text-gray-700 dark:text-gray-300'>
              <div className='flex items-center'>
                <div className='w-6 h-6 rounded-full bg-green-500 mr-3'></div>
                <span className='font-semibold mr-2'>緑色（5点）</span>
                <span className='text-sm'>- 最高評価のスポット</span>
              </div>
              <div className='flex items-center'>
                <div className='w-6 h-6 rounded-full bg-blue-500 mr-3'></div>
                <span className='font-semibold mr-2'>青色（4点）</span>
                <span className='text-sm'>- 優良スポット</span>
              </div>
              <div className='flex items-center'>
                <div className='w-6 h-6 rounded-full bg-yellow-500 mr-3'></div>
                <span className='font-semibold mr-2'>黄色（3点）</span>
                <span className='text-sm'>- 普通のスポット</span>
              </div>
              <div className='flex items-center'>
                <div className='w-6 h-6 rounded-full bg-orange-500 mr-3'></div>
                <span className='font-semibold mr-2'>橙色（2点）</span>
                <span className='text-sm'>- やや注意が必要</span>
              </div>
              <div className='flex items-center'>
                <div className='w-6 h-6 rounded-full bg-red-500 mr-3'></div>
                <span className='font-semibold mr-2'>赤色（1点）</span>
                <span className='text-sm'>- 注意が必要なスポット</span>
              </div>
            </div>
          </div>

          {/* 基本操作 */}
          <div className='mb-6'>
            <h3 className='text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200 flex items-center'>
              <MousePointer2 className='w-5 h-5 mr-2' />
              基本操作
            </h3>
            <div className='space-y-2 text-gray-700 dark:text-gray-300'>
              <div className='flex items-start'>
                <span className='font-semibold mr-2'>・</span>
                <div>
                  <span className='font-semibold'>マーカーをクリック：</span>
                  <span className='ml-2'>スポットの詳細情報が表示されます</span>
                </div>
              </div>
              <div className='flex items-start'>
                <span className='font-semibold mr-2'>・</span>
                <div>
                  <span className='font-semibold'>
                    地図をダブルクリック（管理者のみ）：
                  </span>
                  <span className='ml-2'>新しいスポットを作成できます</span>
                </div>
              </div>
              <div className='flex items-start'>
                <span className='font-semibold mr-2'>・</span>
                <div>
                  <span className='font-semibold'>マップの拡大・縮小：</span>
                  <span className='ml-2'>
                    ピンチ操作またはマウスホイールで調整できます
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* フィルター機能 */}
          <div className='mb-6'>
            <h3 className='text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200 flex items-center'>
              <Filter className='w-5 h-5 mr-2' />
              フィルター機能
            </h3>
            <div className='space-y-2 text-gray-700 dark:text-gray-300'>
              <p>
                マップ上部のフィルターを使用して、表示するスポットを絞り込めます：
              </p>
              <div className='pl-4 space-y-1'>
                <div>・評価点で絞り込み（1〜5点）</div>
                <div>・施設タイプで絞り込み（道の駅、公園など）</div>
                <div>・設備で絞り込み（トイレ、水道など）</div>
              </div>
            </div>
          </div>

          {/* 検索機能 */}
          <div>
            <h3 className='text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200 flex items-center'>
              <Search className='w-5 h-5 mr-2' />
              検索機能
            </h3>
            <div className='space-y-2 text-gray-700 dark:text-gray-300'>
              <p>検索ボックスを使用して、スポット名や場所で検索できます。</p>
              <p className='text-sm text-gray-600 dark:text-gray-400'>
                ※検索結果はリアルタイムで表示されます
              </p>
            </div>
          </div>
        </section>

        {/* 旅程（しおり）機能 */}
        <section className='mb-12 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6'>
          <h2 className='text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100'>
            旅程（しおり）機能
          </h2>
          <div className='space-y-4 text-gray-700 dark:text-gray-300'>
            <div>
              <h3 className='text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200'>
                しおりの作成
              </h3>
              <p>
                「新規作成」ボタンから、旅行の計画を作成できます。日付、行き先、アクティビティを追加して、自分だけの旅程を作りましょう。
              </p>
            </div>
            <div>
              <h3 className='text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200'>
                しおりの編集
              </h3>
              <p>
                作成したしおりは、いつでも編集・更新が可能です。マップ上でルートを確認しながら、計画を調整できます。
              </p>
            </div>
            <div>
              <h3 className='text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200'>
                しおりの共有
              </h3>
              <p>
                公開設定を「公開」にすることで、他のユーザーとしおりを共有できます。旅の思い出を共有しましょう。
              </p>
            </div>
          </div>
        </section>

        {/* お問い合わせ */}
        <section className='bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6'>
          <h2 className='text-xl font-bold mb-3 text-gray-900 dark:text-gray-100'>
            お問い合わせ
          </h2>
          <p className='text-gray-700 dark:text-gray-300'>
            ご不明な点やご要望がございましたら、お気軽にお問い合わせください。
          </p>
        </section>
      </div>
    </div>
  );
}
