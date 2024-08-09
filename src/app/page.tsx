import Image from 'next/image';
import { Metadata } from 'next';
import { getSession, Session, getAccessToken } from '@auth0/nextjs-auth0';

type ApiData = {
  message: string;
};

export const metadata: Metadata = {
  title: '旅のしおり | あなたの旅行計画をサポート',
  description:
    '旅のしおりを簡単に作成。旅行の計画から実行まで、あなたの旅をサポートします。効率的な旅程管理ツールで、思い出に残る旅行を。',
  keywords: '旅のしおり,旅行計画,旅程管理,トラベルプランナー',
  openGraph: {
    title: '旅のしおり作成 | あなたの旅行計画をサポート',
    description:
      '旅のしおりを簡単に作成。旅行の計画から実行まで、あなたの旅をサポートします。',
    type: 'website',
    url: 'https://あなたのウェブサイトURL.com',
    images: [
      {
        url: 'https://あなたのウェブサイトURL.com/og-image.jpg',
      },
    ],
  },
};

export default async function Home() {
  let session: Session | null | undefined = null;
  let apiData: ApiData | null = null;
  let error: string | null = null;

  try {
    session = await getSession();

    if (session?.user) {
      const { accessToken } = await getAccessToken({
        authorizationParams: {
          audience: process.env.AUTH0_AUDIENCE,
          scope: 'openid profile email',
        },
      });

      const response = await fetch('http://localhost:3001/private', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      };

      if (!response.ok) {
        throw new Error(`API request failed. Status: ${response.status}`);
      }

      apiData = await response.json();
    }
  } catch (err: any) {
    error = err.message;
    console.error('Error:', err.message);
  }

  return (
    <div className='flex flex-col items-center justify-center p-24 bg-background text-foreground'>
      <h1 className='text-5xl py-4 font-bold'>旅のしおり作成</h1>
      <Image
        className='relative dark:drop-shadow-[0_0_0.3rem_#ffffff70] mb-4'
        src='/over40.svg'
        alt='Over 40 Web Club Logo'
        width={90}
        height={90}
        priority
      />
      {!session?.user ? (
        <div>
          <p className='text-lg'>旅行を計画するにはログインしてください。</p>
          <p className='text-sm mt-2'>
            旅のしおりを使って、あなたの旅行をより楽しく、効率的に計画しましょう。
          </p>
          <p className='text-xs mt-4'>
            続行することにより、本アプリの利用規約及びプライバシー及びCookieに関する声明に同意するものとします。
          </p>
        </div>
      ) : (
        <div>
          <p className='text-lg'>こんにちは、{session?.user.name}さん</p>
          <p className='text-sm mt-2'>
            旅のしおりを作成して、素晴らしい旅の計画を立てましょう。
          </p>
          <p>{apiData?.message}</p>
        </div>
      )}
    </div>
  );
}
