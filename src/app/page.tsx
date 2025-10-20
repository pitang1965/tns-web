import { Metadata } from 'next';
import { auth0 } from '@/lib/auth0';
import PublicHome from '@/components/common/PublicHome';
import LoggedInHome from '@/components/common/LoggedInHome';

// metadataはsrc\app\layout.tsxのものを使用する

async function getFeaturedSpots() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/camping-spots?limit=20`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.features || [];
  } catch (error) {
    console.error('Failed to fetch featured spots:', error);
    return [];
  }
}

export default async function Home() {
  const session = await auth0.getSession();

  if (session?.user) {
    return <LoggedInHome userName={session.user.name || 'ゲスト'} />;
  } else {
    const initialSpots = await getFeaturedSpots();
    return <PublicHome initialSpots={initialSpots} />;
  }
}
