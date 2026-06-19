import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UpdateNotesList } from '@/components/updates/UpdateNotesList';
import { UpdatesReadMarker } from '@/components/updates/UpdatesReadMarker';

export const metadata: Metadata = {
  title: '更新情報 | 車旅のしおり',
  description: '車旅のしおりの新機能・不具合修正・変更のお知らせ',
  alternates: {
    canonical: '/updates',
  },
  openGraph: {
    title: '更新情報 | 車旅のしおり',
    description: '車旅のしおりの新着情報。新機能・不具合修正・変更点をお知らせします。',
    images: [
      {
        url: 'https://tabi.over40web.club/touge.webp', // 1200×628のOGP用画像
        width: 1200,
        height: 628,
        alt: '車旅のしおりアプリ - 旅行計画作成ツール',
      },
    ],
    locale: 'ja_JP',
    type: 'website',
  },
};

export default function UpdatesPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <UpdatesReadMarker />
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              ホームに戻る
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            更新情報
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            車旅のしおりの新機能・不具合修正・変更をお知らせします
          </p>
        </div>

        {/* Update list */}
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <UpdateNotesList />
        </section>
      </div>
    </div>
  );
}
