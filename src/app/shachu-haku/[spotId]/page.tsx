'use client';

import { useState, useEffect } from 'react';
import { notFound } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
  ArrowLeft,
  Share2,
  MapPin,
  Clock,
  Wifi,
  Car,
  Zap,
  Shield,
  Volume2,
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
import { getCampingSpotById } from '../../actions/campingSpots';

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

interface SpotDetailPageProps {
  params: { spotId: string };
}

export default function SpotDetailPage({ params }: SpotDetailPageProps) {
  const { toast } = useToast();
  const [spot, setSpot] = useState<CampingSpotWithId | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSpot = async () => {
      try {
        setLoading(true);
        const spotData = await getCampingSpotById(params.spotId);
        setSpot(spotData);
      } catch (error) {
        console.error('Error loading spot:', error);
        toast({
          title: 'エラー',
          description: 'スポット情報の読み込みに失敗しました',
          variant: 'destructive',
        });
        notFound();
      } finally {
        setLoading(false);
      }
    };

    loadSpot();
  }, [params.spotId, toast]);

  const handleShare = async () => {
    const url = window.location.href;
    const title = spot ? `${spot.name} - 車中泊スポット` : '車中泊スポット';

    if (navigator.share) {
      try {
        await navigator.share({
          title,
          url,
        });
      } catch (error) {
        // ユーザーがキャンセルした場合などはエラーを無視
        console.log('Share cancelled');
      }
    } else {
      // Web Share API非対応の場合はクリップボードにコピー
      try {
        await navigator.clipboard.writeText(url);
        toast({
          title: '共有リンクをコピーしました',
          description: 'URLがクリップボードにコピーされました',
        });
      } catch (error) {
        toast({
          title: 'エラー',
          description: 'URLのコピーに失敗しました',
          variant: 'destructive',
        });
      }
    }
  };

  // 不要な関数を削除

  if (loading) {
    return (
      <div className='container mx-auto p-6 space-y-6'>
        <div className='animate-pulse space-y-4'>
          <div className='h-8 bg-gray-200 rounded w-1/4'></div>
          <div className='h-12 bg-gray-200 rounded'></div>
          <div className='h-96 bg-gray-200 rounded'></div>
        </div>
      </div>
    );
  }

  if (!spot) {
    notFound();
  }

  const securityLevel = calculateSecurityLevel(spot);
  const quietnessLevel = calculateQuietnessLevel(spot);

  return (
    <div className='container mx-auto p-6 space-y-6'>
      {/* ヘッダー */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-4'>
          <Link href='/shachu-haku'>
            <Button variant='outline' size='sm'>
              <ArrowLeft className='w-4 h-4 mr-2' />
              地図に戻る
            </Button>
          </Link>
          <div>
            <h1 className='text-3xl font-bold text-gray-900 dark:text-gray-100'>
              {spot.name}
            </h1>
            <p className='text-gray-600 dark:text-gray-400'>{spot.address}</p>
          </div>
        </div>
        <Button onClick={handleShare} variant='outline'>
          <Share2 className='w-4 h-4 mr-2' />
          共有
        </Button>
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
            </CardContent>
          </Card>

          {/* 周辺施設 */}
          <Card>
            <CardHeader>
              <CardTitle>周辺施設</CardTitle>
            </CardHeader>
            <CardContent className='space-y-3'>
              {spot.distanceToToilet && (
                <div className='flex justify-between items-center'>
                  <span className='text-gray-700 dark:text-gray-300'>
                    トイレまで
                  </span>
                  <span className='font-semibold text-gray-900 dark:text-gray-100'>
                    {spot.distanceToToilet}m
                  </span>
                </div>
              )}
              {spot.distanceToBath && (
                <div className='flex justify-between items-center'>
                  <span className='text-gray-700 dark:text-gray-300'>
                    入浴施設まで
                  </span>
                  <span className='font-semibold text-gray-900 dark:text-gray-100'>
                    {spot.distanceToBath}m
                  </span>
                </div>
              )}
              {spot.distanceToConvenience && (
                <div className='flex justify-between items-center'>
                  <span className='text-gray-700 dark:text-gray-300'>
                    コンビニまで
                  </span>
                  <span className='font-semibold text-gray-900 dark:text-gray-100'>
                    {spot.distanceToConvenience}m
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
