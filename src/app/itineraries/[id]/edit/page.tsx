'use client';

import { useState } from 'react';
import { withPageAuthRequired } from '@auth0/nextjs-auth0/client';
import { ItineraryToc } from '@/components/itinerary/ItineraryToc';
import { ItineraryForm } from '@/components/itinerary/ItineraryForm';
import { updateItineraryAction } from '@/actions/updateItinerary';
import { ClientItineraryInput } from '@/data/schemas/itinerarySchema';
import { useGetItinerary } from '@/hooks/useGetItinerary';

type EditItineraryPageProps = {
  params: {
    id: string;
  };
};

export default withPageAuthRequired(function EditItineraryPage({
  params,
}: EditItineraryPageProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { itinerary, loading, error } = useGetItinerary(params.id);

  const handleSubmit = async (data: ClientItineraryInput) => {
    console.log('Submitting form data for update:', data);
    setIsSubmitting(true);

    try {
      const result = await updateItineraryAction(params.id, data);
      console.log('Update action result:', result);
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

  if (loading) {
    return <div className='container mx-auto p-4'>読み込み中...</div>;
  }

  if (error) {
    return (
      <div className='container mx-auto p-4'>エラーが発生しました: {error}</div>
    );
  }

  if (!itinerary) {
    return (
      <div className='container mx-auto p-4'>旅程が見つかりませんでした。</div>
    );
  }

  return (
    <main className='container mx-auto p-4'>
      <div className='flex flex-col md:flex-row gap-6'>
        <div className='hidden md:block'>
          <ItineraryToc itinerary={itinerary} />
        </div>
        <div className='flex-1'>
          <ItineraryForm
            initialData={itinerary}
            onSubmit={handleSubmit}
            title='旅程編集'
            description='旅程の詳細を編集してください。* の付いた項目は入力必須です。'
            submitLabel='更新'
            isSubmitting={isSubmitting}
          />
        </div>
      </div>
    </main>
  );
});
