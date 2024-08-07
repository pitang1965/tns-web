import Head from 'next/head';
import { withPageAuthRequired } from '@auth0/nextjs-auth0';
import { ItineraryList } from '@/components/itinerary/ItineraryList';
import { sampleItineraries } from '@/data/itineraries';

function Itineraries() {
  return (
    <>
      <Head>
        <title>保存された旅程一覧 | あなたの旅行計画</title>
        <meta
          name='description'
          content='あなたが作成した旅程の一覧です。過去の旅行計画を確認したり、新しい旅程を作成したりできます。'
        />
        <meta
          name='keywords'
          content='旅程一覧,旅行計画,旅のしおり,保存済み旅程'
        />
      </Head>
      <main className='flex flex-col items-center justify-between p-24 bg-background text-foreground'>
        <section>
          <h1 className='text-3xl font-bold mb-6'>保存された旅程一覧</h1>
          <p className='text-lg mb-8'>
            これまでに作成した旅程を確認できます。新しい旅程を作成する場合は、「新規作成」ボタンをクリックしてください。
          </p>
          <ItineraryList itineraries={sampleItineraries} />
        </section>
      </main>
    </>
  );
}

export default withPageAuthRequired(Itineraries, { returnTo: '/itineraries' });
