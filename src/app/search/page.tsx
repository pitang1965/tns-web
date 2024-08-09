import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '旅行先を検索 | 旅のしおり',
  description:
    '理想の旅行先を見つけよう。多様な目的地の中から、あなたにぴったりの行き先を探索できます。',
};

export default function Search() {
  return (
    <div className='flex flex-col items-center justify-between p-24 bg-background text-foreground'>
      <h1 className='text-5xl py-4 font-bold'>旅行先を検索</h1>
      <p className='text-lg mt-4'>理想の行き先を探そう！</p>
    </div>
  );
}
