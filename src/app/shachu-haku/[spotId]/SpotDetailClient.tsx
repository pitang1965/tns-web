'use client';

import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { formatDistance } from '@/lib/formatDistance';
import {
  ArrowLeft,
  Share2,
  MapPin,
  Car,
  Zap,
  Shield,
  Volume2,
  Navigation,
  Map,
  ExternalLink,
  Plus,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';

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
  isInAppBrowser,
  safeWindowOpen,
  safeSocialShare,
  safeClipboardWrite,
} from '@/lib/browserDetection';

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

// スポットタイプごとの色分け関数
const getTypeColor = (type: string) => {
  switch (type) {
    case 'roadside_station':
      return 'bg-blue-600';
    case 'sa_pa':
      return 'bg-purple-600';
    case 'rv_park':
      return 'bg-emerald-600';
    case 'convenience_store':
      return 'bg-cyan-600';
    case 'parking_lot':
      return 'bg-slate-600';
    case 'other':
      return 'bg-gray-600';
    default:
      return 'bg-gray-500';
  }
};

// 評価レベルごとの色分け関数
const getRatingColor = (rating: number) => {
  if (rating >= 5) return 'bg-green-600';
  if (rating >= 4) return 'bg-blue-600';
  if (rating >= 3) return 'bg-yellow-600';
  if (rating >= 2) return 'bg-orange-600';
  return 'bg-red-600';
};

// 料金レベルごとの色分け関数
const getPricingColor = (isFree: boolean, pricePerNight?: number) => {
  if (isFree) return 'bg-green-500';
  if (!pricePerNight) return 'bg-gray-500';
  if (pricePerNight <= 1000) return 'bg-yellow-500';
  if (pricePerNight <= 2000) return 'bg-orange-500';
  return 'bg-red-500';
};

interface SpotDetailClientProps {
  spot: CampingSpotWithId;
}

export default function SpotDetailClient({ spot }: SpotDetailClientProps) {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const isFromList = searchParams.get('from') === 'list';

  // 座標の有効性をチェック
  const isValidCoordinate = (
    coords: [number, number] | undefined | null
  ): coords is [number, number] => {
    return (
      coords != null &&
      Array.isArray(coords) &&
      coords.length === 2 &&
      typeof coords[0] === 'number' &&
      typeof coords[1] === 'number' &&
      !isNaN(coords[0]) &&
      !isNaN(coords[1]) &&
      isFinite(coords[0]) &&
      isFinite(coords[1]) &&
      coords[0] >= -180 &&
      coords[0] <= 180 &&
      coords[1] >= -90 &&
      coords[1] <= 90
    );
  };

  const openCurrentLocationRoute = () => {
    if (!isValidCoordinate(spot.coordinates)) {
      toast({
        title: 'エラー',
        description:
          '座標情報が正しく設定されていないため、ルート検索を実行できません。',
        variant: 'destructive',
      });
      return;
    }

    const [longitude, latitude] = spot.coordinates;

    try {
      if (
        typeof navigator !== 'undefined' &&
        /iPhone|iPad|iPod/i.test(navigator.userAgent)
      ) {
        // iOS: Google Maps app を優先
        const mapUrl = `comgooglemaps://?daddr=${latitude},${longitude}&directionsmode=driving`;

        // In-App Browserでは直接的なlocation.href変更を避ける
        if (isInAppBrowser()) {
          safeWindowOpen(mapUrl, '_self');

          // フォールバック: Google Maps Web（遅延なし）
          setTimeout(() => {
            const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`;
            safeWindowOpen(webUrl, '_blank');
          }, 500);
        } else {
          window.location.href = mapUrl;

          // フォールバック: Google Maps Web
          setTimeout(() => {
            window.location.href = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`;
          }, 2000);
        }
      } else if (
        typeof navigator !== 'undefined' &&
        /Android/i.test(navigator.userAgent)
      ) {
        // Android: Google Maps Navigation
        const mapUrl = `google.navigation:q=${latitude},${longitude}&mode=d`;

        if (isInAppBrowser()) {
          safeWindowOpen(mapUrl, '_self');
        } else {
          window.location.href = mapUrl;
        }
      } else {
        // Desktop or other: Open in new tab
        const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`;
        safeWindowOpen(url, '_blank');
      }
    } catch (error) {
      console.error('Error opening route:', error);

      // 最終フォールバック: Google Maps Web
      const fallbackUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`;
      safeWindowOpen(fallbackUrl, '_blank');

      toast({
        title: '注意',
        description: 'ルート検索を外部ブラウザで開きます',
      });
    }
  };

  const showOnMap = () => {
    if (!isValidCoordinate(spot.coordinates)) {
      toast({
        title: 'エラー',
        description:
          '座標情報が正しく設定されていないため、地図を表示できません。',
        variant: 'destructive',
      });
      return;
    }

    const [longitude, latitude] = spot.coordinates;
    const url = `https://www.google.com/maps/place/${latitude},${longitude}`;
    safeWindowOpen(url, '_blank');
  };

  const handleShare = async () => {
    const url = window.location.href;
    const title = `${spot.name} - 車中泊スポット`;

    // In-App Browserの警告表示（Facebook等）
    if (isFacebookBrowser()) {
      toast({
        title: 'ブラウザ環境について',
        description:
          'Facebook内ブラウザでは一部機能が制限されます。外部ブラウザでの閲覧を推奨します。',
        duration: 5000,
      });
    }

    // 安全なソーシャル共有を試行
    const shareSuccess = await safeSocialShare({ title, url });

    if (shareSuccess) {
      // 共有成功
      return;
    }

    // Web Share API非対応またはエラーの場合はクリップボードにコピー
    const clipboardSuccess = await safeClipboardWrite(url);

    if (clipboardSuccess) {
      toast({
        title: '共有リンクをコピーしました',
        description: 'URLがクリップボードにコピーされました',
      });
    } else {
      // 最終フォールバック: 手動コピー用のアラート
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
        {/* 戻るボタン */}
        <div>
          <Link href={isFromList ? '/shachu-haku?tab=list' : '/shachu-haku'}>
            <Button variant='outline' size='sm'>
              <ArrowLeft className='w-4 h-4 mr-2' />
              {isFromList ? '一覧に戻る' : '地図に戻る'}
            </Button>
          </Link>
        </div>

        {/* タイトルとボタン */}
        <div className='flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4'>
          <div>
            <h1 className='text-3xl font-bold text-gray-900 dark:text-gray-100'>
              {spot.name}
            </h1>
            <p className='text-gray-600 dark:text-gray-400'>{spot.address}</p>
          </div>
          <div className='flex flex-wrap gap-2'>
            <Button
              onClick={openCurrentLocationRoute}
              variant='outline'
              size='sm'
            >
              <Navigation className='w-4 h-4 mr-2' />
              ルート検索
            </Button>
            <Button onClick={showOnMap} variant='outline' size='sm'>
              <Map className='w-4 h-4 mr-2' />
              地図で表示
            </Button>
            <Button onClick={handleShare} variant='outline' size='sm'>
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
            : `¥${spot.pricing.pricePerNight || '未設定'}`}
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
          {/* 施設地図 */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <MapPin className='w-5 h-5' />
                施設マップ
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FacilityMap spot={spot} />
            </CardContent>
          </Card>

          {/* 詳細情報 */}
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
                  <h3 className='text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2'>
                    あなたの車中泊スポットを教えてください
                  </h3>
                  <p className='text-sm text-blue-700 dark:text-blue-300 mb-4'>
                    旅のしおりに掲載されていないあなたの好きな車中泊場所を教えてください。
                    <br />
                    みんなで情報を共有して、より快適な車中泊を楽しみましょう。
                  </p>
                </div>
                <Link href='/shachu-haku/submit'>
                  <Button className='bg-blue-600 hover:bg-blue-700 text-white'>
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
          {/* 基本情報 */}
          <Card>
            <CardHeader>
              <CardTitle>基本情報</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid grid-cols-2 gap-4 text-sm'>
                <div>
                  <div className='font-semibold text-gray-900 dark:text-gray-100'>
                    都道府県
                  </div>
                  <div className='text-gray-700 dark:text-gray-300'>
                    {spot.prefecture}
                  </div>
                </div>
                <div>
                  <div className='font-semibold text-gray-900 dark:text-gray-100'>
                    種別
                  </div>
                  <div className='text-gray-700 dark:text-gray-300'>
                    {CampingSpotTypeLabels[spot.type]}
                  </div>
                </div>
                <div>
                  <div className='font-semibold text-gray-900 dark:text-gray-100'>
                    料金
                  </div>
                  <div className='text-gray-700 dark:text-gray-300'>
                    {spot.pricing.isFree
                      ? '無料'
                      : `¥${spot.pricing.pricePerNight || '未設定'}/泊`}
                  </div>
                </div>
                {spot.capacity && (
                  <div>
                    <div className='font-semibold text-gray-900 dark:text-gray-100'>
                      収容台数
                    </div>
                    <div className='text-gray-700 dark:text-gray-300'>
                      {spot.capacity}台
                    </div>
                  </div>
                )}
                {spot.elevation && (
                  <div>
                    <div className='font-semibold text-gray-900 dark:text-gray-100'>
                      標高
                    </div>
                    <div className='text-gray-700 dark:text-gray-300'>
                      {spot.elevation}m
                    </div>
                  </div>
                )}
              </div>
              {spot.url && (
                <div className='pt-2 border-t border-gray-200 dark:border-gray-700'>
                  <div className='font-semibold text-gray-900 dark:text-gray-100 mb-1'>
                    参考URL
                  </div>
                  <a
                    href={spot.url}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm break-all'
                  >
                    <ExternalLink className='w-3 h-3 flex-shrink-0' />
                    公式サイト・詳細情報
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 周辺施設 */}
          <Card>
            <CardHeader>
              <CardTitle>周辺施設</CardTitle>
            </CardHeader>
            <CardContent className='space-y-3'>
              {spot.distanceToToilet != null && (
                <div className='flex justify-between items-center'>
                  <span className='text-gray-700 dark:text-gray-300'>
                    トイレまで
                  </span>
                  <span className='font-semibold text-gray-900 dark:text-gray-100'>
                    {formatDistance(spot.distanceToToilet)}
                  </span>
                </div>
              )}
              {spot.distanceToBath != null && (
                <div className='flex justify-between items-center'>
                  <span className='text-gray-700 dark:text-gray-300'>
                    入浴施設まで
                  </span>
                  <span className='font-semibold text-gray-900 dark:text-gray-100'>
                    {formatDistance(spot.distanceToBath)}
                  </span>
                </div>
              )}
              {spot.distanceToConvenience != null && (
                <div className='flex justify-between items-center'>
                  <span className='text-gray-700 dark:text-gray-300'>
                    コンビニまで
                  </span>
                  <span className='font-semibold text-gray-900 dark:text-gray-100'>
                    {formatDistance(spot.distanceToConvenience)}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* セキュリティ情報 */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Shield className='w-5 h-5' />
                セキュリティ情報
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-3'>
                <div className='flex items-center justify-between'>
                  <span className='text-gray-700 dark:text-gray-300'>
                    総合治安レベル
                  </span>
                  <Badge
                    className={`${getRatingColor(securityLevel)} text-white`}
                  >
                    {securityLevel}/5
                  </Badge>
                </div>

                {spot.security && (
                  <div className='space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700'>
                    <div className='text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2'>
                      セキュリティ設備
                    </div>
                    <div className='grid grid-cols-1 gap-2 text-sm'>
                      <div className='flex items-center gap-2'>
                        <div
                          className={`w-2 h-2 rounded-full ${
                            spot.security.hasGate
                              ? 'bg-green-500'
                              : 'bg-gray-400'
                          }`}
                        ></div>
                        <span className='text-gray-700 dark:text-gray-300'>
                          ゲート・門扉:{' '}
                          {spot.security.hasGate ? 'あり' : 'なし'}
                        </span>
                      </div>
                      <div className='flex items-center gap-2'>
                        <div
                          className={`w-2 h-2 rounded-full ${
                            spot.security.hasLighting
                              ? 'bg-green-500'
                              : 'bg-gray-400'
                          }`}
                        ></div>
                        <span className='text-gray-700 dark:text-gray-300'>
                          照明設備:{' '}
                          {spot.security.hasLighting ? '十分' : '暗め'}
                        </span>
                      </div>
                      <div className='flex items-center gap-2'>
                        <div
                          className={`w-2 h-2 rounded-full ${
                            spot.security.hasStaff
                              ? 'bg-green-500'
                              : 'bg-gray-400'
                          }`}
                        ></div>
                        <span className='text-gray-700 dark:text-gray-300'>
                          スタッフ常駐:{' '}
                          {spot.security.hasStaff ? 'あり' : 'なし'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 夜間環境情報 */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Volume2 className='w-5 h-5' />
                夜間環境情報
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-3'>
                <div className='flex items-center justify-between'>
                  <span className='text-gray-700 dark:text-gray-300'>
                    静けさレベル
                  </span>
                  <Badge
                    className={`${getRatingColor(quietnessLevel)} text-white`}
                  >
                    {quietnessLevel}/5
                  </Badge>
                </div>

                {spot.nightNoise && (
                  <div className='space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700'>
                    <div className='text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2'>
                      騒音環境
                    </div>
                    <div className='grid grid-cols-1 gap-2 text-sm'>
                      <div className='flex items-center gap-2'>
                        <div
                          className={`w-2 h-2 rounded-full ${
                            spot.nightNoise.hasNoiseIssues
                              ? 'bg-red-500'
                              : 'bg-green-500'
                          }`}
                        ></div>
                        <span className='text-gray-700 dark:text-gray-300'>
                          騒音問題:{' '}
                          {spot.nightNoise.hasNoiseIssues ? 'あり' : 'なし'}
                        </span>
                      </div>
                      <div className='flex items-center gap-2'>
                        <div
                          className={`w-2 h-2 rounded-full ${
                            spot.nightNoise.nearBusyRoad
                              ? 'bg-orange-500'
                              : 'bg-green-500'
                          }`}
                        ></div>
                        <span className='text-gray-700 dark:text-gray-300'>
                          交通量の多い道路:{' '}
                          {spot.nightNoise.nearBusyRoad ? '近い' : '離れている'}
                        </span>
                      </div>
                      <div className='flex items-center gap-2'>
                        <div
                          className={`w-2 h-2 rounded-full ${
                            spot.nightNoise.isQuietArea
                              ? 'bg-green-500'
                              : 'bg-gray-400'
                          }`}
                        ></div>
                        <span className='text-gray-700 dark:text-gray-300'>
                          静かなエリア:{' '}
                          {spot.nightNoise.isQuietArea ? 'はい' : 'いいえ'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 設備 */}
          <Card>
            <CardHeader>
              <CardTitle>設備</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-2 gap-3 text-sm'>
                <div className='flex items-center gap-2'>
                  <Car
                    className={`w-4 h-4 ${
                      spot.hasRoof ? 'text-green-600' : 'text-gray-400'
                    }`}
                  />
                  <span
                    className={
                      spot.hasRoof
                        ? 'text-green-700 dark:text-green-400'
                        : 'text-gray-500 dark:text-gray-400'
                    }
                  >
                    屋根{spot.hasRoof ? 'あり' : 'なし'}
                  </span>
                </div>
                <div className='flex items-center gap-2'>
                  <Zap
                    className={`w-4 h-4 ${
                      spot.hasPowerOutlet ? 'text-green-600' : 'text-gray-400'
                    }`}
                  />
                  <span
                    className={
                      spot.hasPowerOutlet
                        ? 'text-green-700 dark:text-green-400'
                        : 'text-gray-500 dark:text-gray-400'
                    }
                  >
                    電源{spot.hasPowerOutlet ? 'あり' : 'なし'}
                  </span>
                </div>
              </div>

              {spot.amenities && spot.amenities.length > 0 && (
                <div className='mt-3'>
                  <div className='font-semibold text-gray-900 dark:text-gray-100 mb-2'>
                    その他設備
                  </div>
                  <div className='text-sm text-gray-700 dark:text-gray-300'>
                    {spot.amenities.join('、')}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 制限事項 */}
          {spot.restrictions && spot.restrictions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>制限事項</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-1'>
                  {spot.restrictions.map((restriction, index) => (
                    <div
                      key={index}
                      className='text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2'
                    >
                      <span className='text-red-500 mt-1'>•</span>
                      <span>{restriction}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
