import type { Metadata } from 'next';
import { PublicItineraryList } from '@/components/itinerary/PublicItineraryList';
import { getPublicItineraries } from '@/lib/itineraries';

export const metadata: Metadata = {
  title: '旅行先を検索 | 旅のしおり',
  description:
    '理想の旅行先を見つけよう。多様な目的地の中から、あなたにぴったりの行き先を探索できます。',
};

export default async function Search() {
  // 公開旅程を取得
  const publicItineraries = await getPublicItineraries();

  return (
    <div className='container mx-auto p-4 md:p-6'>
      <h1 className='text-3xl md:text-4xl font-bold mb-6'>旅行先を検索</h1>
      <p className='text-lg mb-8'>みんなが共有している旅程を探索しよう！</p>

      <div className='mb-8'>
        <h2 className='text-xl font-semibold mb-4'>公開されている旅程</h2>
        <PublicItineraryList itineraries={publicItineraries} />
      </div>
    </div>
  );
}
