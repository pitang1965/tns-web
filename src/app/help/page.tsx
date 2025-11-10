import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MapPin, MousePointer2, Filter, Search, Share2, Tent } from 'lucide-react';

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
                  <span className='font-semibold'>マップの拡大・縮小：</span>
                  <span className='ml-2'>
                    ピンチ操作またはマウスホイールで調整できます
                  </span>
                </div>
              </div>
              <div className='flex items-start'>
                <span className='font-semibold mr-2'>・</span>
                <div>
                  <span className='font-semibold'>表示範囲の変更：</span>
                  <span className='ml-2'>
                    「現在付近」「地域」「都道府県」のボタンで表示エリアを切り替えられます
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
              <p className='mb-3'>
                マップ上部のフィルターを使用して、表示するスポットを絞り込めます：
              </p>
              <div className='pl-4 space-y-2'>
                <div>
                  <span className='font-semibold'>・評価点：</span>
                  <span className='ml-2'>1〜5点で絞り込み</span>
                </div>
                <div>
                  <span className='font-semibold'>・施設タイプ：</span>
                  <span className='ml-2'>道の駅、公園、駐車場などで絞り込み</span>
                </div>
                <div>
                  <span className='font-semibold'>・料金：</span>
                  <span className='ml-2'>無料のみ、有料のみで絞り込み</span>
                </div>
                <div>
                  <span className='font-semibold'>・治安レベル：</span>
                  <span className='ml-2'>安全性の高いスポットを選択</span>
                </div>
                <div>
                  <span className='font-semibold'>・静けさレベル：</span>
                  <span className='ml-2'>静かに過ごせるスポットを選択</span>
                </div>
                <div>
                  <span className='font-semibold'>・トイレまでの距離：</span>
                  <span className='ml-2'>近い順で絞り込み</span>
                </div>
                <div>
                  <span className='font-semibold'>・標高：</span>
                  <span className='ml-2'>標高の範囲で絞り込み</span>
                </div>
                <div>
                  <span className='font-semibold'>・設備：</span>
                  <span className='ml-2'>トイレ、水道、電源などの有無で絞り込み</span>
                </div>
              </div>
            </div>
          </div>

          {/* 検索機能 */}
          <div className='mb-6'>
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

          {/* SNS共有機能 */}
          <div>
            <h3 className='text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200 flex items-center'>
              <Share2 className='w-5 h-5 mr-2' />
              SNS共有機能
            </h3>
            <div className='space-y-2 text-gray-700 dark:text-gray-300'>
              <p>
                スポットの詳細情報から、車中泊スポット情報をSNSで共有できます。
              </p>
              <div className='pl-4 space-y-1 mt-2'>
                <div>・X（旧Twitter）で共有</div>
                <div>・Facebookで共有</div>
                <div>・LINEで共有</div>
              </div>
              <p className='text-sm text-gray-600 dark:text-gray-400 mt-2'>
                ※スポット名、評価、URLが自動的に設定されます
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
            <div>
              <h3 className='text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200 flex items-center'>
                <Tent className='w-5 h-5 mr-2' />
                車中泊スポットの追加
              </h3>
              <p className='mb-3'>
                旅程編集画面から、車中泊スポットを簡単にアクティビティとして追加できます。
              </p>
              <div className='bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-3'>
                <div>
                  <h4 className='font-semibold text-gray-800 dark:text-gray-200 mb-2'>
                    使い方：
                  </h4>
                  <ol className='list-decimal list-inside space-y-2 pl-2'>
                    <li>旅程編集画面で任意の日を選択</li>
                    <li>「車中泊スポットを追加」ボタン（テントアイコン）をクリック</li>
                    <li>地図上で検索したい地点をクリック
                      <span className='text-sm text-gray-600 dark:text-gray-400 ml-2'>
                        （例：前のアクティビティの近く）
                      </span>
                    </li>
                    <li>「スポットを検索」をクリック</li>
                    <li>表示された最寄り5件から選択</li>
                    <li>「アクティビティに追加」で確定</li>
                  </ol>
                </div>
                <div>
                  <h4 className='font-semibold text-gray-800 dark:text-gray-200 mb-2'>
                    自動入力される情報：
                  </h4>
                  <div className='pl-4 space-y-1 text-sm'>
                    <div>・タイトル：「車中泊：[スポット名]」</div>
                    <div>・場所：スポット名、座標、住所</div>
                    <div>・費用：無料 or 1泊料金</div>
                    <div>・説明：料金、施設距離、設備、セキュリティなど詳細情報</div>
                    <div>・URL：スポットの詳細ページ（ある場合）</div>
                  </div>
                </div>
                <div className='pt-2 border-t border-gray-200 dark:border-gray-600'>
                  <p className='text-sm text-gray-600 dark:text-gray-400'>
                    💡 ヒント：車中泊マップで事前にスポットを確認してから、旅程に追加すると計画が立てやすくなります。
                  </p>
                </div>
              </div>
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
