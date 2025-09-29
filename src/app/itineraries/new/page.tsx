'use client';

import { useState, useEffect } from 'react';
import { withPageAuthRequired, useUser } from '@auth0/nextjs-auth0/client';
import { useRouter } from 'next/navigation';
import { ItineraryForm } from '@/components/itinerary/forms/ItineraryForm';
import { createItineraryAction } from '@/actions/createItinerary';
import { ClientItineraryInput, ClientItineraryDocument } from '@/data/schemas/itinerarySchema';
import { TransportationType } from '@/data/schemas/transportationSchema';
import { LoadingSpinner } from '@/components/common/loading-spinner';
import { toast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default withPageAuthRequired(function NewItineraryPage() {
  const { user } = useUser();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [itineraries, setItineraries] = useState<ClientItineraryDocument[]>([]);
  const [canCreate, setCanCreate] = useState(true);

  // Check itinerary creation limit on component mount
  useEffect(() => {
    const checkLimit = async () => {
      try {
        const response = await fetch('/api/itineraries/limit-check');
        const result = await response.json();

        if (result.success) {
          setItineraries(result.data.itineraries);
          setCanCreate(result.data.canCreate);
        } else {
          console.error('Error checking itinerary limit:', result.error);
          toast({
            title: 'エラー',
            description: '制限チェックに失敗しました',
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Error checking itinerary limit:', error);
        toast({
          title: 'エラー',
          description: '制限チェックに失敗しました',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      checkLimit();
    } else {
      setIsLoading(false);
    }
  }, [user]);

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

  if (isLoading) {
    return (
      <main className='container mx-auto p-4'>
        <LoadingSpinner />
      </main>
    );
  }

  if (!canCreate) {
    return (
      <main className='container mx-auto p-4 max-w-2xl'>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="text-red-500" />
              旅程作成制限に達しています
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">
                一般ユーザーは最大10個まで旅程を作成できます。
                <br />
                現在{itineraries.length}個の旅程を作成済みです。
              </p>

              <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="text-amber-500" size={20} />
                  <span className="font-medium">プレミアム会員なら無制限！</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  プレミアム会員になると、旅程を無制限に作成できます。
                </p>
              </div>

              <div className="flex gap-3 justify-center">
                <Link href="/itineraries">
                  <Button variant="outline">
                    旅程一覧に戻る
                  </Button>
                </Link>
                <Link href="/account">
                  <Button>
                    プレミアム会員について
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className='container mx-auto p-4'>
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
