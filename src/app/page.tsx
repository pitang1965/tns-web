import Image from 'next/image';
import { getSession, Session, getAccessToken } from '@auth0/nextjs-auth0';

type ApiData = {
  message: string;
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
      <p className='text-5xl py-4'>情報</p>
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
          <p className='text-xs'>
            続行することにより、本アプリの利用規約及びプライバシー及びCookieに関する声明に同意するものとします。
          </p>
        </div>
      ) : (
        <div>
            <p className='text-lg'>こんにちは。{session?.user.name}さん</p>
            {/* <HomeDataDisplay initialData={apiData} error={error} /> */}
            <p>{apiData.message}</p>
        </div>
      )}
    </div>
  );
}
