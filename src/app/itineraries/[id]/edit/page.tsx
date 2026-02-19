import type { Metadata } from 'next';
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { auth0 } from '@/lib/auth0';
import { getItineraryById } from '@/lib/itineraries';
import { EditItineraryClient } from '@/components/itinerary/forms/EditItineraryClient';
import { LoadingState } from '@/components/common/LoadingState';

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export const generateMetadata = async ({
  params,
  searchParams,
}: PageProps): Promise<Metadata> => {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const itinerary = await getItineraryById(id);

  if (!itinerary) {
    return {
      title: '旅程が見つかりません | 車旅のしおり',
    };
  }

  const dayParam = resolvedSearchParams.day
    ? parseInt(resolvedSearchParams.day as string)
    : null;
  const totalDays = itinerary.dayPlans?.length || 1;
  const dayDisplay = dayParam && totalDays > 1 ? ` ${dayParam}日目` : '';

  return {
    title: `${itinerary.title}${dayDisplay} 編集 | 車旅のしおり`,
  };
};

export default async function EditItineraryPage({ params }: PageProps) {
  const { id } = await params;
  const session = await auth0.getSession();

  if (!session) {
    redirect(`/auth/login?returnTo=/itineraries/${id}/edit`);
  }

  const itineraryPromise = getItineraryById(id);

  return (
    <Suspense
      fallback={
        <div className='container mx-auto p-4'>
          <LoadingState variant='inline' />
        </div>
      }
    >
      <EditItineraryClient itineraryPromise={itineraryPromise} id={id} />
    </Suspense>
  );
}
