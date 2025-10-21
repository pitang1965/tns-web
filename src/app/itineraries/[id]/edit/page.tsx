'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { withPageAuthRequired } from '@auth0/nextjs-auth0/client';
import { ItineraryToc } from '@/components/layout/ItineraryToc';
import { ItineraryForm } from '@/components/itinerary/forms/ItineraryForm';
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
  const searchParams = useSearchParams();
  const { itinerary, loading, error } = useGetItinerary(params.id);

  // ページタイトルを動的に設定
  useEffect(() => {
    if (itinerary?.title) {
      const dayParam = searchParams.get('day');
      const dayDisplay = dayParam ? ` ${dayParam}日目` : '';
      document.title = `${itinerary.title}${dayDisplay} | 車旅のしおり`;
    }
  }, [itinerary?.title, searchParams]);

  const handleSubmit = async (data: ClientItineraryInput) => {
    console.log('Submitting form data for update:', data);
    setIsSubmitting(true);

    try {
      const result = await updateItineraryAction(params.id, data);
      console.log('Update action result:', result);
      setIsSubmitting(false);
      if (!result) {
        return {
          success: false,
          error: 'サーバーからの応答がありませんでした。',
        };
      }
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
    <main className='min-w-[320px]'>
      <div className='flex flex-col lg:flex-row gap-6'>
        <div className='hidden lg:block w-1/4 max-w-[250px]'>
          <ItineraryToc initialItinerary={itinerary} />
        </div>
        <div className='flex-1 min-w-0 sm:min-w-[320px]'>
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
