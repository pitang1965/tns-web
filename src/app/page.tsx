import { Metadata } from 'next';
import { getSession, getAccessToken } from '@auth0/nextjs-auth0';
import ClientHome from '@/components/ClientHome';

type ApiData = {
  message: string;
};

type SerializableSession = {
  user?: {
    name?: string;
    email?: string;
  };
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
  let serializableSession: SerializableSession | null = null;
  let apiData: ApiData | null = null;
  let error: string | null = null;

  try {
    const fullSession = await getSession();

    if (fullSession?.user) {
      serializableSession = {
        user: {
          name: fullSession.user.name,
          email: fullSession.user.email,
        },
      };
    }

    if (serializableSession?.user) {
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
      console.log('API Data fetched:', apiData); //
    }
  } catch (err: any) {
    error = err.message;
    console.error('Error:', err.message);
  }

  console.log('Passing to ClientHome:', {
    session: serializableSession,
    apiData,
    error,
  }); // デバッグログ

  return (
    <ClientHome session={serializableSession} apiData={apiData} error={error} />
  );
}
