'use client';

import { useState } from 'react';
import { withPageAuthRequired, useUser } from '@auth0/nextjs-auth0/client';
import { ItineraryForm } from '@/components/itinerary/ItineraryForm';
import { createItineraryAction } from '@/actions/createItinerary';
import { ClientItineraryInput } from '@/data/schemas/itinerarySchema';
import { TransportationType } from '@/components/TransportationBadge'; 

export default withPageAuthRequired(function NewItineraryPage() {
  const { user } = useUser(); // useUserを追加
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      return result;
    } catch (error) {
      console.error('Error submitting form:', error);
      setIsSubmitting(false);
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
      <ItineraryForm
        initialData={initialData}
        onSubmit={handleSubmit}
        title='新しい旅程の作成'
        description='新しい旅程の詳細を入力してください。* の付いた項目は入力必須です。'
        submitLabel='作成'
        isSubmitting={isSubmitting}
      />
    </main>
  );
});
