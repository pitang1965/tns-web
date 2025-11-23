import { Metadata } from 'next';
import ShachuHakuSubmissionForm from '@/components/shachu-haku/ShachuHakuSubmissionForm';

export const metadata: Metadata = {
  title: '車中泊スポット情報の投稿 | 車旅のしおり',
  description:
    '車中泊スポットの情報を投稿して、車中泊コミュニティに貢献しませんか。あなたの知っている穴場スポットや便利な施設情報を共有して、みんなで快適な車中泊ライフを楽しみましょう。',
  keywords:
    '車中泊スポット,スポット投稿,情報共有,道の駅,SA,PA,RVパーク,オートキャンプ場,車中泊,車旅',
  openGraph: {
    title: '車中泊スポット情報の投稿 | 車旅のしおり',
    description:
      '車中泊スポットの情報を投稿して、車中泊コミュニティに貢献しませんか。あなたの知っている穴場スポットや便利な施設情報を共有して、みんなで快適な車中泊ライフを楽しみましょう。',
    url: 'https://tabi.over40web.club/shachu-haku/submit',
    images: [
      {
        url: 'https://tabi.over40web.club/shachu-haku.webp',
        width: 1200,
        height: 629,
        alt: '車中泊スポット情報投稿 - 車旅のしおり',
      },
    ],
    locale: 'ja_JP',
    type: 'website',
  },
  twitter: {
    card: 'summary',
  },
};

export default function CampingSpotSubmitPage() {
  return (
    <div className='min-h-screen bg-gray-50 dark:bg-gray-900 py-8'>
      <div className='container mx-auto px-4'>
        <div className='text-center mb-8'>
          <h1 className='text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2'>
            車中泊スポット情報の投稿
          </h1>
          <p className='text-gray-600 dark:text-gray-300 max-w-2xl mx-auto'>
            あなたが知っている車中泊に適した場所を教えてください。
            投稿された情報は管理者が確認後に公開され、多くの旅行者の参考になります。
          </p>
        </div>

        <ShachuHakuSubmissionForm />

        <div className='mt-8 text-center'>
          <p className='text-sm text-gray-500 dark:text-gray-400'>
            投稿していただいた情報は、多くの車中泊をする人の役に立ちます。
            <br />
            ご協力ありがとうございます。
          </p>
        </div>
      </div>
    </div>
  );
}
