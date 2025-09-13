import { notFound } from 'next/navigation';
import { getCampingSpotById } from '../../actions/campingSpots';
import SpotDetailClient from './SpotDetailClient';

interface SpotDetailPageProps {
  params: { spotId: string };
}

export default async function SpotDetailPage({ params }: SpotDetailPageProps) {
  if (!params?.spotId) {
    notFound();
  }

  try {
    const spot = await getCampingSpotById(params.spotId);

    if (!spot) {
      notFound();
    }

    return <SpotDetailClient spot={spot} />;
  } catch (error) {
    console.error('Error loading spot:', error);
    notFound();
  }
}
