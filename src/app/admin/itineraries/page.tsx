import type { Metadata } from 'next';
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { auth0 } from '@/lib/auth0';
import { isAdmin } from '@/lib/userUtils';
import { getAllItineraries } from '@/lib/itineraries';
import { AdminItineraryList } from '@/components/admin/AdminItineraryList';
import { H1, LargeText } from '@/components/common/Typography';

export const metadata: Metadata = {
  title: '旅程管理 | 車旅のしおり',
  description: '全ての旅程を管理するための管理者専用ページです。',
};

export default async function AdminItinerariesPage() {
  const session = await auth0.getSession();

  if (!session) {
    redirect('/auth/login?returnTo=/admin/itineraries');
  }

  // Check if user is admin
  const userIsAdmin = isAdmin(session.user);

  if (!userIsAdmin) {
    return (
      <div className='flex flex-col justify-center items-center h-screen space-y-4'>
        <h1 className='text-2xl font-bold text-red-600'>アクセス拒否</h1>
        <p className='text-gray-600 dark:text-gray-300'>
          この機能は管理者のみ利用可能です。
        </p>
        <p className='text-sm text-gray-500 dark:text-gray-400'>
          管理者権限が必要な場合は、システム管理者にお問い合わせください。
        </p>
      </div>
    );
  }

  // Promiseを作成（awaitせずに渡す）
  const itinerariesPromise = getAllItineraries();

  return (
    <main className='flex flex-col items-center justify-between p-4 sm:p-8 md:p-12 lg:p-24 bg-background text-foreground'>
      <section>
        <H1>旅程管理</H1>
        <LargeText>
          全ての旅程を確認できます。各旅程の詳細を表示するには、「見る」ボタンをクリックしてください。
        </LargeText>
        <Suspense
          fallback={
            <div className='flex flex-col gap-2'>
              <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4'>
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className='border rounded-lg p-4 bg-gray-50 dark:bg-gray-800 animate-pulse'
                  >
                    <div className='h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3'></div>
                    <div className='h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2'></div>
                    <div className='h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6'></div>
                  </div>
                ))}
              </div>
            </div>
          }
        >
          <AdminItineraryList itinerariesPromise={itinerariesPromise} />
        </Suspense>
      </section>
    </main>
  );
}
