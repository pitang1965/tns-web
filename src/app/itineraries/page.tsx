import type { Metadata } from 'next';
import { ItineraryList } from '@/components/itinerary/ItineraryList';
import { sampleItineraries } from '@/data/itineraries';

export const metadata: Metadata = {
  title: '保存された旅程一覧 | あなたの旅行計画',
  description:
    'あなたが作成した旅程の一覧です。過去の旅行計画を確認したり、新しい旅程を作成したりできます。',
  keywords: '旅程一覧,旅行計画,旅のしおり,保存済み旅程',
};

export default function Itineraries() {
  return (
    <main className='flex flex-col items-center justify-between p-24 bg-background text-foreground'>
      <section>
        <h1 className='text-3xl font-bold mb-6'>保存された旅程一覧</h1>
        <p className='text-lg mb-8'>
          これまでに作成した旅程を確認できます。新しい旅程を作成する場合は、「新規作成」ボタンをクリックしてください。
        </p>
        <ItineraryList itineraries={sampleItineraries} />
      </section>
    </main>
  );
}
