'use client';

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { formatDistance } from '@/lib/formatDistance';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MapPin, Filter, Search, Info, Plus } from 'lucide-react';
import { getPublicCampingSpots } from '../actions/campingSpots';
import {
  CampingSpotWithId,
  CampingSpotTypeLabels,
  PrefectureOptions,
} from '@/data/schemas/campingSpot';
import {
  calculateSecurityLevel,
  calculateQuietnessLevel,
} from '@/lib/campingSpotUtils';

// Dynamically import the map component to avoid SSR issues
const ShachuHakuMap = dynamic(
  () => import('@/components/shachu-haku/ShachuHakuMap'),
  {
    ssr: false,
    loading: () => (
      <div className='h-[600px] bg-gray-100 animate-pulse rounded-lg' />
    ),
  }
);

// スポットタイプごとの色分け関数
const getTypeColor = (type: string) => {
  switch (type) {
    case 'roadside_station':
      return 'bg-blue-600 hover:bg-blue-700';
    case 'sa_pa':
      return 'bg-purple-600 hover:bg-purple-700';
    case 'rv_park':
      return 'bg-emerald-600 hover:bg-emerald-700';
    case 'convenience_store':
      return 'bg-cyan-600 hover:bg-cyan-700';
    case 'parking_lot':
      return 'bg-slate-600 hover:bg-slate-700';
    case 'other':
      return 'bg-gray-600 hover:bg-gray-700';
    default:
      return 'bg-gray-500 hover:bg-gray-600';
  }
};

// 評価レベルごとの色分け関数
const getRatingColor = (rating: number) => {
  if (rating >= 5) return 'bg-green-600 hover:bg-green-700';
  if (rating >= 4) return 'bg-blue-600 hover:bg-blue-700';
  if (rating >= 3) return 'bg-yellow-600 hover:bg-yellow-700';
  if (rating >= 2) return 'bg-orange-600 hover:bg-orange-700';
  return 'bg-red-600 hover:bg-red-700';
};

// 料金レベルごとの色分け関数
const getPricingColor = (isFree: boolean, pricePerNight?: number) => {
  if (isFree) return 'bg-green-500 hover:bg-green-600'; // 無料：緑色
  if (!pricePerNight) return 'bg-gray-500 hover:bg-gray-600'; // 料金未設定：グレー
  if (pricePerNight <= 1000) return 'bg-yellow-500 hover:bg-yellow-600'; // 1000円以下：黄色
  if (pricePerNight <= 2000) return 'bg-orange-500 hover:bg-orange-600'; // 1001-2000円：オレンジ色
  return 'bg-red-500 hover:bg-red-600'; // 2001円以上：赤色
};

export default function ShachuHakuClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [spots, setSpots] = useState<CampingSpotWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSpot, setSelectedSpot] = useState<CampingSpotWithId | null>(
    null
  );
  const [activeTab, setActiveTab] = useState<'map' | 'list'>(() => {
    // URLパラメータからタブを決定
    const tabParam = searchParams.get('tab');
    return tabParam === 'list' ? 'list' : 'map';
  });
  const [searchTerm, setSearchTerm] = useState(() => {
    // URLパラメータから検索クエリを取得
    return searchParams.get('q') || '';
  });
  const [prefectureFilter, setPrefectureFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const filteredSpots = useMemo(() => {
    if (!spots || !Array.isArray(spots)) {
      return [];
    }

    return spots.filter((spot) => {
      if (
        searchTerm &&
        !spot.name.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        return false;
      }
      if (prefectureFilter !== 'all' && spot.prefecture !== prefectureFilter) {
        return false;
      }
      if (typeFilter !== 'all' && spot.type !== typeFilter) {
        return false;
      }
      return true;
    });
  }, [spots, searchTerm, prefectureFilter, typeFilter]);

  const loadSpots = async () => {
    try {
      setLoading(true);
      const data = await getPublicCampingSpots();
      setSpots(data);
    } catch (error) {
      toast({
        title: 'エラー',
        description: '車中泊スポットの読み込みに失敗しました',
        variant: 'destructive',
      });
      console.error('Error loading spots:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSpots();
  }, []);

  const handleSpotSelect = (spot: CampingSpotWithId) => {
    // マップからのスポットクリック時は何もしない（ポップアップのみ表示）
  };

  const handleListSpotSelect = (spot: CampingSpotWithId) => {
    // 一覧からのスポット選択時はダイアログを表示
    setSelectedSpot(spot);
  };

  const handleNavigateToSpotDetail = (spotId: string) => {
    // 個別ページに遷移（一覧表示からの遷移を示すパラメータを追加）
    router.push(`/shachu-haku/${spotId}?from=list`);
  };

  const handleTabChange = (tab: 'map' | 'list') => {
    setActiveTab(tab);
    // URLパラメータを更新
    const url = tab === 'list' ? '/shachu-haku?tab=list' : '/shachu-haku';
    router.replace(url);
  };

  return (
    <div className='container mx-auto p-6 space-y-6'>
      <div className='space-y-4'>
        <div className='flex flex-col md:flex-row md:justify-between md:items-center gap-4'>
          <div>
            <h1 className='text-3xl font-bold'>車中泊スポット</h1>
            <div className='text-sm text-gray-600 dark:text-gray-300 mt-1'>
              ログイン不要で車中泊スポットを検索・閲覧できます
            </div>
          </div>
          <div className='flex flex-col sm:flex-row gap-2'>
            <a
              href='https://amzn.to/4pI2i6W'
              target='_blank'
              rel='noopener noreferrer'
            >
              <Button className='bg-orange-600 hover:bg-orange-700 text-white w-full sm:w-auto'>
                Jackeryアーリーオータムセール
              </Button>
            </a>
            <Link href='/shachu-haku/submit'>
              <Button className='bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto'>
                <Plus className='w-4 h-4 mr-2' />
                スポット投稿
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className='w-full'>
        {/* Common Filters */}
        <Card className='mb-6'>
          <CardContent className='pt-6'>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <div className='relative'>
                <Search className='absolute left-3 top-3 h-4 w-4 text-gray-400' />
                <Input
                  placeholder='名前で検索...'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className='pl-10'
                />
              </div>
              <Select
                value={prefectureFilter}
                onValueChange={setPrefectureFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder='全都道府県' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>全都道府県</SelectItem>
                  {PrefectureOptions.map((prefecture) => (
                    <SelectItem key={prefecture} value={prefecture}>
                      {prefecture}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder='全種別' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>全種別</SelectItem>
                  {Object.entries(CampingSpotTypeLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tab Navigation */}
        <div className='flex space-x-2 mb-6 border-b border-gray-200 dark:border-gray-700'>
          <Button
            variant={activeTab === 'map' ? 'default' : 'ghost'}
            onClick={() => handleTabChange('map')}
            className='rounded-b-none'
          >
            <MapPin className='w-4 h-4 mr-2' />
            地図表示
          </Button>
          <Button
            variant={activeTab === 'list' ? 'default' : 'ghost'}
            onClick={() => handleTabChange('list')}
            className='rounded-b-none'
          >
            一覧表示
          </Button>
        </div>

        {/* Map Tab Content */}
        {activeTab === 'map' && (
          <div className='space-y-4'>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <MapPin className='w-5 h-5' />
                  {loading ? '車中泊スポット地図 (読み込み中...)' : `車中泊スポット地図 (${filteredSpots.length}件)`}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className='h-[600px] bg-gray-100 animate-pulse rounded-lg flex items-center justify-center'>
                    <div className='text-gray-500'>
                      地図データを読み込み中...
                    </div>
                  </div>
                ) : (
                  <ShachuHakuMap
                    spots={filteredSpots}
                    onSpotSelect={handleSpotSelect}
                    readonly={true}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* List Tab Content */}
        {activeTab === 'list' && (
          <div className='space-y-4'>
            {/* Stats */}
            <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
              <Card>
                <CardContent className='p-4'>
                  <div className='text-2xl font-bold text-blue-600'>
                    {spots?.length || 0}
                  </div>
                  <div className='text-sm text-gray-600 dark:text-gray-300'>
                    総スポット数
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className='p-4'>
                  <div className='text-2xl font-bold text-green-600'>
                    {spots?.filter((s) => s.pricing.isFree).length || 0}
                  </div>
                  <div className='text-sm text-gray-600 dark:text-gray-300'>
                    無料スポット
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className='p-4'>
                  <div className='text-2xl font-bold text-yellow-600'>
                    {spots?.filter((s) => s.isVerified).length || 0}
                  </div>
                  <div className='text-sm text-gray-600 dark:text-gray-300'>
                    確認済み
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className='p-4'>
                  <div className='text-2xl font-bold text-purple-600'>
                    {spots ? new Set(spots.map((s) => s.prefecture)).size : 0}
                  </div>
                  <div className='text-sm text-gray-600 dark:text-gray-300'>
                    都道府県数
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Spots List */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {loading ? '車中泊スポット一覧 (読み込み中...)' : `車中泊スポット一覧 (${filteredSpots.length}件)`}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className='text-center py-8'>読み込み中...</div>
                ) : filteredSpots.length === 0 ? (
                  <div className='text-center py-8 text-gray-500'>
                    条件に一致する車中泊スポットがありません
                  </div>
                ) : (
                  <div className='space-y-4'>
                    {filteredSpots.map((spot) => (
                      <div
                        key={spot._id}
                        className='border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer'
                        onClick={() => handleListSpotSelect(spot)}
                      >
                        <div className='flex justify-between items-start'>
                          <div className='flex-1'>
                            <h3 className='font-semibold text-lg'>
                              {spot.name}
                            </h3>
                            <p className='text-gray-600 dark:text-gray-300'>
                              {spot.address}
                            </p>
                            <div className='flex gap-2 mt-2 flex-wrap'>
                              <Badge
                                className={`${getTypeColor(
                                  spot.type
                                )} text-white`}
                              >
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
                                  : `¥${
                                      spot.pricing.pricePerNight || '未設定'
                                    }`}
                              </Badge>
                              <Badge
                                className={`${getRatingColor(
                                  calculateSecurityLevel(spot)
                                )} text-white`}
                              >
                                治安 {calculateSecurityLevel(spot)}/5 🔒
                              </Badge>
                              <Badge
                                className={`${getRatingColor(
                                  calculateQuietnessLevel(spot)
                                )} text-white`}
                              >
                                静けさ {calculateQuietnessLevel(spot)}/5 🔇
                              </Badge>
                              {spot.isVerified && (
                                <Badge className='bg-blue-500 text-white hover:bg-blue-600'>
                                  ✓ 確認済み
                                </Badge>
                              )}
                            </div>
                            {spot.notes && (
                              <p className='text-sm text-gray-500 dark:text-gray-400 mt-2 line-clamp-2'>
                                {spot.notes}
                              </p>
                            )}
                          </div>
                          <div className='flex gap-2'>
                            <Button
                              size='sm'
                              variant='outline'
                              onClick={(e) => {
                                e.stopPropagation();
                                handleNavigateToSpotDetail(spot._id);
                              }}
                            >
                              <Info className='w-4 h-4' />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Selected Spot Detail Modal for List View */}
      {selectedSpot && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
          <Card className='w-full max-w-2xl max-h-[90vh] overflow-auto'>
            <CardHeader>
              <CardTitle className='flex justify-between items-center'>
                {selectedSpot.name}
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setSelectedSpot(null)}
                >
                  ✕
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                <div>
                  <h4 className='font-semibold'>基本情報</h4>
                  <p className='text-sm text-gray-600 dark:text-gray-300'>
                    {selectedSpot.address}
                  </p>
                  <div className='flex gap-2 mt-2'>
                    <Badge
                      className={`${getTypeColor(
                        selectedSpot.type
                      )} text-white`}
                    >
                      {CampingSpotTypeLabels[selectedSpot.type]}
                    </Badge>
                    <Badge
                      className={`${getPricingColor(
                        selectedSpot.pricing.isFree,
                        selectedSpot.pricing.pricePerNight
                      )} text-white`}
                    >
                      {selectedSpot.pricing.isFree
                        ? '無料'
                        : `¥${selectedSpot.pricing.pricePerNight || '未設定'}`}
                    </Badge>
                    <Badge
                      className={`${getRatingColor(
                        calculateSecurityLevel(selectedSpot)
                      )} text-white`}
                    >
                      治安 {calculateSecurityLevel(selectedSpot)}/5 🔒
                    </Badge>
                    <Badge
                      className={`${getRatingColor(
                        calculateQuietnessLevel(selectedSpot)
                      )} text-white`}
                    >
                      静けさ {calculateQuietnessLevel(selectedSpot)}/5 🔇
                    </Badge>
                  </div>
                </div>

                {selectedSpot.notes && (
                  <div>
                    <h4 className='font-semibold'>備考</h4>
                    <p className='text-sm text-gray-700 dark:text-gray-300'>
                      {selectedSpot.notes}
                    </p>
                  </div>
                )}

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm'>
                  {selectedSpot.distanceToToilet && (
                    <div>トイレまで: {formatDistance(selectedSpot.distanceToToilet)}</div>
                  )}
                  {selectedSpot.distanceToBath && (
                    <div>入浴施設まで: {formatDistance(selectedSpot.distanceToBath)}</div>
                  )}
                  {selectedSpot.distanceToConvenience && (
                    <div>
                      コンビニまで: {formatDistance(selectedSpot.distanceToConvenience)}
                    </div>
                  )}
                  {selectedSpot.elevation && (
                    <div>標高: {selectedSpot.elevation}m</div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
