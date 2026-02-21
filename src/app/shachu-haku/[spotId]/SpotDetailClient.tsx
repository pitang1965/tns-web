'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams, usePathname } from 'next/navigation';
import { formatDate } from '@/lib/date';
import { useRecentUrls } from '@/hooks/useRecentUrls';
import {
  ArrowLeft,
  Share2,
  Navigation,
  Map,
  MapPin,
  Plus,
  Search,
  Shield,
  Volume2,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { AdLink } from '@/components/shachu-haku/AdLink';
import { SpotBasicInfoCard } from '@/components/shachu-haku/SpotBasicInfoCard';
import { SpotFacilitiesCard } from '@/components/shachu-haku/SpotFacilitiesCard';
import { SpotSecurityCard } from '@/components/shachu-haku/SpotSecurityCard';
import { SpotNightNoiseCard } from '@/components/shachu-haku/SpotNightNoiseCard';
import { SpotAmenitiesCard } from '@/components/shachu-haku/SpotAmenitiesCard';
import { SpotRestrictionsCard } from '@/components/shachu-haku/SpotRestrictionsCard';

import {
  CampingSpotWithId,
  CampingSpotTypeLabels,
} from '@/data/schemas/campingSpot';
import {
  calculateSecurityLevel,
  calculateQuietnessLevel,
} from '@/lib/campingSpotUtils';
import {
  isFacebookBrowser,
  safeSocialShare,
  safeClipboardWrite,
} from '@/lib/browserDetection';
import {
  getTypeColor,
  getRatingColor,
  getPricingColor,
} from '@/lib/spotColorUtils';
import {
  openCurrentLocationRoute,
  showSpotOnMap,
} from '@/lib/mapNavigation';

// Dynamically import the map components to avoid SSR issues
const FacilityMap = dynamic(
  () => import('@/components/shachu-haku/FacilityMap'),
  {
    ssr: false,
    loading: () => (
      <div className='h-[400px] bg-gray-100 animate-pulse rounded-lg' />
    ),
  }
);

type SpotDetailClientProps = {
  spot: CampingSpotWithId;
};

export default function SpotDetailClient({ spot }: SpotDetailClientProps) {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { addUrl } = useRecentUrls();
  const isFromList = searchParams.get('from') === 'list';

  // 閲覧履歴に追加
  useEffect(() => {
    if (spot && spot.name) {
      addUrl(pathname, spot.name);
    }
  }, [spot, pathname, addUrl]);

  const handleShare = async () => {
    const url = window.location.href;
    const title = `${spot.name} - 車中泊スポット`;

    if (isFacebookBrowser()) {
      toast({
        title: 'ブラウザ環境について',
        description:
          'Facebook内ブラウザでは一部機能が制限されます。外部ブラウザでの閲覧を推奨します。',
        duration: 5000,
      });
    }

    const shareSuccess = await safeSocialShare({ title, url });
    if (shareSuccess) return;

    const clipboardSuccess = await safeClipboardWrite(url);
    if (clipboardSuccess) {
      toast({
        title: '共有リンクをコピーしました',
        description: 'URLがクリップボードにコピーされました',
      });
    } else {
      toast({
        title: '共有リンク',
        description: `以下のURLを手動でコピーしてください: ${url}`,
        duration: 10000,
      });
    }
  };

  const securityLevel = calculateSecurityLevel(spot);
  const quietnessLevel = calculateQuietnessLevel(spot);

  return (
    <div className='container mx-auto p-6 space-y-6'>
      {/* ヘッダー */}
      <div className='space-y-4'>
        <div>
          <Link href={isFromList ? '/shachu-haku?tab=list' : '/shachu-haku'}>
            <Button variant='outline' size='sm'>
              <ArrowLeft className='w-4 h-4 mr-2' />
              {isFromList ? '一覧に戻る' : '地図に戻る'}
            </Button>
          </Link>
        </div>

        <div className='flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4'>
          <div>
            <h1 className='text-3xl font-bold text-gray-900 dark:text-gray-100'>
              {spot.name}
            </h1>
            <p className='text-gray-600 dark:text-gray-400'>{spot.address}</p>
            {spot.updatedAt && (
              <p className='text-sm text-gray-500 dark:text-gray-500 mt-1'>
                {formatDate(spot.updatedAt.toString())}更新
              </p>
            )}
          </div>
          <div className='flex flex-wrap gap-2'>
            <Button
              onClick={() => openCurrentLocationRoute(spot.coordinates, toast)}
              variant='outline'
              size='sm'
              className='cursor-pointer'
            >
              <Navigation className='w-4 h-4 mr-2' />
              ルート検索
            </Button>
            <Button
              onClick={() => {
                const searchQuery = [spot.name, spot.address]
                  .filter(Boolean)
                  .join(' ');
                const url = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}&udm=50`;
                window.open(url, '_blank');
              }}
              variant='outline'
              size='sm'
              className='cursor-pointer'
              title='名称と住所で Google AI モード検索'
            >
              <Search className='w-4 h-4 mr-2' />
              AI検索
            </Button>
            <Button
              onClick={() => showSpotOnMap(spot.coordinates, toast)}
              variant='outline'
              size='sm'
              className='cursor-pointer'
            >
              <Map className='w-4 h-4 mr-2' />
              地図で表示
            </Button>
            <Button
              onClick={handleShare}
              variant='outline'
              size='sm'
              className='cursor-pointer'
            >
              <Share2 className='w-4 h-4 mr-2' />
              共有
            </Button>
          </div>
        </div>
      </div>

      {/* バッジ */}
      <div className='flex gap-2 flex-wrap'>
        <Badge className={`${getTypeColor(spot.type)} text-white`}>
          {CampingSpotTypeLabels[spot.type]}
        </Badge>
        <Badge
          className={`${getPricingColor(
            spot.pricing.isFree,
            spot.pricing.pricePerNight
          )} text-white`}
        >
          {spot.pricing.isFree
            ? '無料'
            : spot.pricing.pricePerNight
            ? `¥${spot.pricing.pricePerNight}`
            : '有料：？円'}
        </Badge>
        <Badge className={`${getRatingColor(securityLevel)} text-white`}>
          <Shield className='w-3 h-3 mr-1' />
          治安 {securityLevel}/5
        </Badge>
        <Badge className={`${getRatingColor(quietnessLevel)} text-white`}>
          <Volume2 className='w-3 h-3 mr-1' />
          静けさ {quietnessLevel}/5
        </Badge>
        {spot.isVerified && (
          <Badge className='bg-blue-500 text-white'>✓ 確認済み</Badge>
        )}
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* メイン情報 */}
        <div className='lg:col-span-2 space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <MapPin className='w-5 h-5' />
                施設マップ
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FacilityMap spot={spot} showTitle={false} showLegend={true} />
            </CardContent>
          </Card>

          {spot.notes && (
            <Card>
              <CardHeader>
                <CardTitle>詳細・備考</CardTitle>
              </CardHeader>
              <CardContent>
                <p className='text-gray-700 dark:text-gray-300 whitespace-pre-wrap'>
                  {spot.notes}
                </p>
              </CardContent>
            </Card>
          )}

          {/* スポット投稿促進 */}
          <Card className='bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700'>
            <CardContent className='pt-6'>
              <div className='text-center space-y-3'>
                <div className='flex justify-center'>
                  <div className='p-3 bg-blue-100 dark:bg-blue-800/50 rounded-full'>
                    <Plus className='w-6 h-6 text-blue-600 dark:text-blue-400' />
                  </div>
                </div>
                <div>
                  <h2 className='text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2'>
                    あなたの車中泊スポットを教えてください
                  </h2>
                  <p className='text-sm text-blue-700 dark:text-blue-300 mb-4'>
                    車旅のしおりに掲載されていないあなたの好きな車中泊場所を教えてください。
                    <br />
                    みんなで情報を共有して、より快適な車中泊を楽しみましょう。
                  </p>
                </div>
                <Link href='/shachu-haku/submit'>
                  <Button className='bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'>
                    <Plus className='w-4 h-4 mr-2' />
                    スポット情報を投稿する
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* サイドバー */}
        <div className='space-y-6'>
          <SpotBasicInfoCard spot={spot} />
          <SpotFacilitiesCard spot={spot} />
          <SpotSecurityCard spot={spot} />
          <SpotNightNoiseCard spot={spot} />
          <SpotAmenitiesCard spot={spot} />
          <SpotRestrictionsCard spot={spot} />
          <div className='flex justify-center'>
            <AdLink
              href='https://amzn.to/45c0kmK'
              label='電気毛布セール'
              shortLabel='電気毛布'
            />
          </div>
        </div>
      </div>
    </div>
  );
}
