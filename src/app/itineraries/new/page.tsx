'use client';

import { useState } from 'react';
import { withPageAuthRequired, useUser } from '@auth0/nextjs-auth0/client';
import { useRouter } from 'next/navigation';
import { ItineraryForm } from '@/components/itinerary/forms/ItineraryForm';
import { createItineraryAction } from '@/actions/createItinerary';
import { ClientItineraryInput } from '@/data/schemas/itinerarySchema';
import { TransportationType } from '@/components/common/TransportationBadge';
import { LoadingSpinner } from '@/components/common/loading-spinner';
import { toast } from '@/components/ui/use-toast';

export default withPageAuthRequired(function NewItineraryPage() {
  const { user } = useUser();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const initialData = {
    title: '',
    description: '',
    startDate: undefined,
    numberOfDays: 1,
    isPublic: false,
    dayPlans: [],
    transportation: {
      type: 'OTHER' as TransportationType,
      details: null as string | null,
    },
    sharedWith: [],
    owner: {
      id: user?.sub || 'dummy-id',
      name: user?.name || 'Test User',
      email: user?.email || 'test@example.com',
    },
  };

  const handleSubmit = async (data: ClientItineraryInput) => {
    console.log('Submitting form data:', data);
    setIsSubmitting(true);
    setIsLoading(true);

    // ownerフィールドを追加
    const dataWithOwner = {
      ...data,
      owner: {
        id: user?.sub || '',
        name: user?.name || '',
        email: user?.email || '',
      },
    };

    try {
      const result = await createItineraryAction(dataWithOwner);
      console.log('Server action result:', result);
      setIsSubmitting(false);
      if (result.success) {
        router.push(`/itineraries/${result.id}`);
      } else {
        setIsLoading(false);
        toast({
          title: '旅程の作成に失敗しました',
          description: result.error,
          variant: 'destructive',
        });
      }
      return result;
    } catch (error) {
      console.error('Error submitting form:', error);
      setIsSubmitting(false);
      setIsLoading(false);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : '予期しないエラーが発生しました',
      };
    }
  };

  return (
    <main className='container mx-auto p-4'>
      {isLoading && <LoadingSpinner />}
      <ItineraryForm
        initialData={initialData}
        onSubmit={handleSubmit}
        title='旅程作成'
        description='新しい旅程の詳細を入力してください。* の付いた項目は入力必須です。'
        submitLabel='作成'
        isSubmitting={isSubmitting}
      />
    </main>
  );
});
