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
  Search,
  Shield,
  Volume2,
  PenLine,
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
import { openCurrentLocationRoute, showSpotOnMap } from '@/lib/mapNavigation';

// Dynamically import the map components to avoid SSR issues
const FacilityMap = dynamic(
  () => import('@/components/shachu-haku/FacilityMap'),
  {
    ssr: false,
    loading: () => (
      <div className='h-[400px] bg-gray-100 animate-pulse rounded-lg' />
    ),
  },
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

  const correctionContactUrl = (() => {
    const pricing = spot.pricing.isFree
      ? '無料'
      : spot.pricing.pricePerNight
        ? `¥${spot.pricing.pricePerNight}/泊`
        : '有料（金額不明）';
    const amenitiesStr =
      spot.amenities.length > 0 ? spot.amenities.join('、') : 'なし';
    const restrictionsStr =
      spot.restrictions.length > 0
        ? spot.restrictions.map((r) => `•${r}`).join('\n')
        : 'なし';
    const spotUrl = `https://tabi.over40web.club/shachu-haku/${spot._id}`;

    const subject = `[スポット情報修正] ${spot.name}`;
    const message = `スポット名：${spot.name}
URL: ${spotUrl}

情報の更新（修正・追加）を依頼します。

--- 修正候補 ---
スポット名：${spot.name} →
料金：${pricing} →
ゲート・門扉：${spot.security.hasGate ? 'あり' : 'なし'} →
照明設備：${spot.security.hasLighting ? '十分' : '暗め'} →
スタッフ常駐：${spot.security.hasStaff ? 'あり' : 'なし'} →
騒音問題：${spot.nightNoise.hasNoiseIssues ? 'あり' : 'なし'} →
交通量の多い道路：${spot.nightNoise.nearBusyRoad ? '近い' : '離れている'} →
静かなエリア：${spot.nightNoise.isQuietArea ? 'はい' : 'いいえ'} →
その他設備：${amenitiesStr} →
制限事項：
${restrictionsStr} →
詳細・備考：
${spot.notes ?? 'なし'} → `;

    return `/contact?subject=${encodeURIComponent(subject)}&message=${encodeURIComponent(message)}`;
  })();

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
            spot.pricing.pricePerNight,
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

      {/* 情報修正依頼カード */}
      <Card className='bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700'>
        <CardContent className='pt-6 pb-6'>
          <div className='text-center space-y-3'>
            <div className='flex justify-center'>
              <div className='p-3 bg-amber-100 dark:bg-amber-800/50 rounded-full'>
                <PenLine className='w-6 h-6 text-amber-600 dark:text-amber-400' />
              </div>
            </div>
            <div>
              <h2 className='text-lg font-semibold text-amber-900 dark:text-amber-100 mb-2'>
                情報の更新・修正をお知らせください
              </h2>
              <p className='text-sm text-amber-700 dark:text-amber-300 mb-4'>
                掲載情報に誤りや変更がある場合は、お問い合わせフォームからご連絡ください。
                <br />
                スポット名・料金・設備状況などの修正前の情報が自動入力されます。
              </p>
            </div>
            <Link href={correctionContactUrl}>
              <Button
                variant='outline'
                className='cursor-pointer border-amber-500 text-amber-700 hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-900/50'
              >
                <PenLine className='w-4 h-4 mr-2' />
                情報の修正を依頼する
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
