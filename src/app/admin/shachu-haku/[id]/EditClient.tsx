'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useRouter, useParams, usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { getCampingSpotById } from '../../../actions/campingSpots/admin';
import { CampingSpotWithId } from '@/data/schemas/campingSpot';
import { LoadingState } from '@/components/common/LoadingState';
import { useRecentUrls } from '@/hooks/useRecentUrls';

// Dynamically import the form component to avoid SSR issues
const ShachuHakuForm = dynamic(
  () => import('@/components/admin/ShachuHakuForm'),
  {
    ssr: false,
  }
);

export default function EditClient() {
  const { user, isLoading } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const { addUrl } = useRecentUrls();
  const id = params?.id as string;

  // Check if user is admin
  const isAdmin =
    user?.email &&
    process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',')
      .map((email) => email.trim())
      .includes(user.email);

  const [spot, setSpot] = useState<CampingSpotWithId | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || isLoading || !isAdmin) return;

    const loadSpot = async () => {
      try {
        setLoading(true);
        const spotData = await getCampingSpotById(id);
        setSpot(spotData);
      } catch (err) {
        console.error('Error loading spot:', err);
        setError(
          err instanceof Error
            ? err.message
            : '車中泊スポットの読み込みに失敗しました'
        );
        toast({
          title: 'エラー',
          description: '車中泊スポットの読み込みに失敗しました',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadSpot();
  }, [id, isLoading, isAdmin, toast]);

  // 閲覧履歴に追加
  useEffect(() => {
    if (spot && isAdmin) {
      addUrl(pathname, spot.name);
    }
  }, [spot, isAdmin, pathname, addUrl]);

  const handleFormSuccess = () => {
    toast({
      title: '成功',
      description: '車中泊スポットを更新しました',
    });
    router.push('/admin/shachu-haku');
  };

  const handleFormClose = () => {
    router.push('/admin/shachu-haku');
  };

  if (isLoading || !user) {
    // Let Suspense handle loading
    return null;
  }

  if (!isAdmin) {
    return (
      <div className='flex flex-col justify-center items-center h-screen space-y-4'>
        <h1 className='text-2xl font-bold text-red-600'>アクセス拒否</h1>
        <p className='text-gray-600 dark:text-gray-300'>
          この機能は管理者のみ利用可能です。
        </p>
        <p className='text-sm text-gray-500 dark:text-gray-400'>
          管理者権限が必要な場合は、システム管理者にお問い合わせください。
        </p>
        <div className='flex gap-4'>
          <Link href='/'>
            <Button variant='outline'>
              <ArrowLeft className='w-4 h-4 mr-2' />
              トップページに戻る
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return <LoadingState variant='fullscreen' />;
  }

  if (error || !spot) {
    return (
      <div className='flex flex-col justify-center items-center h-screen space-y-4'>
        <h1 className='text-2xl font-bold text-red-600'>エラー</h1>
        <p className='text-gray-600 dark:text-gray-300'>
          {error || '車中泊スポットが見つかりませんでした'}
        </p>
        <Link href='/admin/shachu-haku'>
          <Button variant='outline'>
            <ArrowLeft className='w-4 h-4 mr-2' />
            管理画面に戻る
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className='container mx-auto px-6 py-6 space-y-6 min-h-screen'>
      <div className='flex items-center gap-4'>
        <Link href='/admin/shachu-haku'>
          <Button variant='outline' size='sm'>
            <ArrowLeft className='w-4 h-4 mr-2' />
            戻る
          </Button>
        </Link>
        <h1 className='text-3xl font-bold'>車中泊スポット編集</h1>
      </div>

      <ShachuHakuForm
        spot={spot}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}
