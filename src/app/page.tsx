import { Metadata } from 'next';
import { getSession } from '@auth0/nextjs-auth0';
import PublicHome from '@/components/common/PublicHome';
import LoggedInHome from '@/components/common/LoggedInHome';

// metadataはsrc\app\layout.tsxのものを使用する

export default async function Home() {
  const session = await getSession();

  if (session?.user) {
    return <LoggedInHome userName={session.user.name || 'ゲスト'} />;
  } else {
    return <PublicHome />;
  }
}
