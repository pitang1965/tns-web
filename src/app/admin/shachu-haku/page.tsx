'use client';

import { useState, useEffect, useMemo } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import dynamic from 'next/dynamic';
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
import {
  Upload,
  Download,
  MapPin,
  Filter,
  Plus,
  Search,
  Edit,
} from 'lucide-react';
import { getCampingSpots } from '../../actions/campingSpots';
import {
  CampingSpotWithId,
  CampingSpotTypeLabels,
  PrefectureOptions,
} from '@/data/schemas/campingSpot';

// Dynamically import the map component to avoid SSR issues
const ShachuHakuMap = dynamic(
  () => import('@/components/admin/ShachuHakuMap'),
  {
    ssr: false,
    loading: () => (
      <div className='h-[600px] bg-gray-100 animate-pulse rounded-lg' />
    ),
  }
);

const CSVImportDialog = dynamic(
  () => import('@/components/admin/CSVImportDialog'),
  {
    ssr: false,
  }
);

const ShachuHakuForm = dynamic(
  () => import('@/components/admin/ShachuHakuForm'),
  {
    ssr: false,
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

export default function ShachuHakuAdminPage() {
  const { user, isLoading } = useUser();
  const { toast } = useToast();

  // Check if user is admin
  const isAdmin =
    user?.email &&
    process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',')
      .map((email) => email.trim())
      .includes(user.email);
  const [spots, setSpots] = useState<CampingSpotWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSpot, setSelectedSpot] = useState<CampingSpotWithId | null>(
    null
  );
  const [showForm, setShowForm] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<'map' | 'list'>('map');
  const [searchTerm, setSearchTerm] = useState('');
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
      const data = await getCampingSpots();
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
    setSelectedSpot(spot);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setSelectedSpot(null);
  };

  const handleFormSuccess = () => {
    loadSpots();
    handleFormClose();
    toast({
      title: '成功',
      description: selectedSpot
        ? '車中泊スポットを更新しました'
        : '車中泊スポットを作成しました',
    });
  };

  const handleImportSuccess = (result: { success: number; errors: any[] }) => {
    loadSpots();
    toast({
      title: 'インポート完了',
      description: `${result.success}件の車中泊スポットをインポートしました`,
    });
    if (result.errors.length > 0) {
      toast({
        title: '警告',
        description: `${result.errors.length}件のエラーがありました`,
        variant: 'destructive',
      });
    }
  };

  const exportToCSV = async () => {
    try {
      const { getCampingSpotsForExport } = await import(
        '../../actions/campingSpots'
      );
      const exportSpots = await getCampingSpotsForExport();

      const headers = [
        'name',
        'lat',
        'lng',
        'prefecture',
        'address',
        'type',
        'distanceToToilet',
        'distanceToBath',
        'distanceToConvenience',
        'nearbyToiletLat',
        'nearbyToiletLng',
        'nearbyConvenienceLat',
        'nearbyConvenienceLng',
        'nearbyBathLat',
        'nearbyBathLng',
        'elevation',
        'quietnessLevel',
        'securityLevel',
        'overallRating',
        'hasRoof',
        'hasPowerOutlet',
        'hasGate',
        'isFree',
        'pricePerNight',
        'priceNote',
        'capacity',
        'restrictions',
        'amenities',
        'notes',
      ];

      const csvContent = [
        headers.join(','),
        ...exportSpots.map((spot: CampingSpotWithId) =>
          [
            spot.name,
            spot.coordinates[1], // lat
            spot.coordinates[0], // lng
            spot.prefecture,
            spot.address || '',
            spot.type,
            spot.distanceToToilet || '',
            spot.distanceToBath || '',
            spot.distanceToConvenience || '',
            spot.nearbyToiletCoordinates ? spot.nearbyToiletCoordinates[1] : '', // nearbyToiletLat
            spot.nearbyToiletCoordinates ? spot.nearbyToiletCoordinates[0] : '', // nearbyToiletLng
            spot.nearbyConvenienceCoordinates
              ? spot.nearbyConvenienceCoordinates[1]
              : '', // nearbyConvenienceLat
            spot.nearbyConvenienceCoordinates
              ? spot.nearbyConvenienceCoordinates[0]
              : '', // nearbyConvenienceLng
            spot.nearbyBathCoordinates ? spot.nearbyBathCoordinates[1] : '', // nearbyBathLat
            spot.nearbyBathCoordinates ? spot.nearbyBathCoordinates[0] : '', // nearbyBathLng
            spot.elevation || '',
            spot.quietnessLevel || '',
            spot.securityLevel || '',
            spot.overallRating || '',
            spot.hasRoof,
            spot.hasPowerOutlet,
            spot.hasGate,
            spot.pricing.isFree,
            spot.pricing.pricePerNight || '',
            spot.pricing.priceNote || '',
            spot.capacity || '',
            spot.restrictions.join(','),
            spot.amenities.join(','),
            spot.notes || '',
          ]
            .map((field) => {
              // Handle fields that might contain commas by quoting them
              const stringField = String(field);
              if (
                stringField.includes(',') ||
                stringField.includes('"') ||
                stringField.includes('\n')
              ) {
                return `"${stringField.replace(/"/g, '""')}"`;
              }
              return stringField;
            })
            .join(',')
        ),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `shachu-haku-spots-${
        new Date().toISOString().split('T')[0]
      }.csv`;
      link.click();
    } catch (error) {
      toast({
        title: 'エラー',
        description: 'エクスポートに失敗しました',
        variant: 'destructive',
      });
      console.error('Export error:', error);
    }
  };

  if (isLoading) {
    return (
      <div className='flex justify-center items-center h-screen'>
        Loading...
      </div>
    );
  }

  if (!user) {
    return (
      <div className='flex justify-center items-center h-screen'>
        Loading...
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className='flex flex-col justify-center items-center h-screen space-y-4'>
        <h1 className='text-2xl font-bold text-red-600'>アクセス拒否</h1>
        <p className='text-gray-600'>この機能は管理者のみ利用可能です。</p>
        <p className='text-sm text-gray-500'>
          管理者権限が必要な場合は、システム管理者にお問い合わせください。
        </p>
      </div>
    );
  }

  return (
    <div className='container mx-auto p-6 space-y-6'>
      <div className='space-y-4'>
        <div className='flex justify-between items-center'>
          <h1 className='text-3xl font-bold'>車中泊スポット管理</h1>
          <div className='flex gap-2'>
            <Button
              onClick={() => setShowImportDialog(true)}
              variant='outline'
              className='hidden md:flex'
            >
              <Upload className='w-4 h-4 mr-2' />
              CSVインポート
            </Button>
            <Button
              onClick={exportToCSV}
              variant='outline'
              className='hidden md:flex'
            >
              <Download className='w-4 h-4 mr-2' />
              CSVエクスポート
            </Button>
            <Button
              onClick={() => setShowForm(true)}
              className='hidden md:flex'
            >
              <Plus className='w-4 h-4 mr-2' />
              新規追加
            </Button>
          </div>
        </div>
        <Button onClick={() => setShowForm(true)} className='md:hidden w-full'>
          <Plus className='w-4 h-4 mr-2' />
          新規追加
        </Button>
      </div>

      <div className='w-full'>
        {/* Tab Navigation */}
        <div className='flex space-x-2 mb-6 border-b border-gray-200 dark:border-gray-700'>
          <Button
            variant={activeTab === 'map' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('map')}
            className='rounded-b-none'
          >
            <MapPin className='w-4 h-4 mr-2' />
            地図表示
          </Button>
          <Button
            variant={activeTab === 'list' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('list')}
            className='rounded-b-none'
          >
            一覧表示
          </Button>
        </div>

        {/* Map Tab Content */}
        {activeTab === 'map' && (
          <div className='space-y-4'>
            {/* Filters for Map View */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Filter className='w-5 h-5' />
                  フィルター
                </CardTitle>
              </CardHeader>
              <CardContent>
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
                      {Object.entries(CampingSpotTypeLabels).map(
                        ([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <MapPin className='w-5 h-5' />
                  地図から編集 ({filteredSpots.length}件)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ShachuHakuMap
                  spots={filteredSpots}
                  onSpotSelect={handleSpotSelect}
                  onCreateSpot={(coordinates) => {
                    setSelectedSpot({
                      coordinates,
                      name: '',
                      prefecture: '',
                      type: 'other',
                      distanceToToilet: 0,
                      quietnessLevel: 3,
                      securityLevel: 3,
                      overallRating: 3,
                      hasRoof: false,
                      hasPowerOutlet: false,
                      hasGate: false,
                      pricing: { isFree: true },
                      capacity: 1,
                      restrictions: [],
                      amenities: [],
                      notes: '',
                      isVerified: false,
                    } as any);
                    setShowForm(true);
                  }}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {/* List Tab Content */}
        {activeTab === 'list' && (
          <div className='space-y-4'>
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Filter className='w-5 h-5' />
                  フィルター
                </CardTitle>
              </CardHeader>
              <CardContent>
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
                      {Object.entries(CampingSpotTypeLabels).map(
                        ([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Stats */}
            <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
              <Card>
                <CardContent className='p-4'>
                  <div className='text-2xl font-bold text-blue-600'>
                    {spots.length}
                  </div>
                  <div className='text-sm text-gray-600'>総スポット数</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className='p-4'>
                  <div className='text-2xl font-bold text-green-600'>
                    {spots.filter((s) => s.pricing.isFree).length}
                  </div>
                  <div className='text-sm text-gray-600'>無料スポット</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className='p-4'>
                  <div className='text-2xl font-bold text-yellow-600'>
                    {spots.filter((s) => s.isVerified).length}
                  </div>
                  <div className='text-sm text-gray-600'>確認済み</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className='p-4'>
                  <div className='text-2xl font-bold text-purple-600'>
                    {new Set(spots.map((s) => s.prefecture)).size}
                  </div>
                  <div className='text-sm text-gray-600'>都道府県数</div>
                </CardContent>
              </Card>
            </div>

            {/* Spots List */}
            <Card>
              <CardHeader>
                <CardTitle>
                  車中泊スポット一覧 ({filteredSpots.length}件)
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
                        onClick={() => handleSpotSelect(spot)}
                      >
                        <div className='flex justify-between items-start'>
                          <div className='flex-1'>
                            <h3 className='font-semibold text-lg'>
                              {spot.name}
                            </h3>
                            <p className='text-gray-600'>{spot.address}</p>
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
                              {spot.overallRating && (
                                <Badge
                                  className={`${getRatingColor(
                                    spot.overallRating
                                  )} text-white`}
                                >
                                  評価 {spot.overallRating}/5 ⭐
                                </Badge>
                              )}
                              {spot.isVerified && (
                                <Badge className='bg-blue-500 text-white hover:bg-blue-600'>
                                  ✓ 確認済み
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className='flex gap-2'>
                            <Button
                              size='sm'
                              variant='outline'
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSpotSelect(spot);
                              }}
                            >
                              <Edit className='w-4 h-4' />
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

      {showForm && (
        <ShachuHakuForm
          key={selectedSpot?._id || 'new'}
          spot={selectedSpot}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}

      {showImportDialog && (
        <CSVImportDialog
          onClose={() => setShowImportDialog(false)}
          onSuccess={handleImportSuccess}
        />
      )}
    </div>
  );
}
