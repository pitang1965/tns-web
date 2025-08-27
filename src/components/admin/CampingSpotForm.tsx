'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/components/ui/use-toast';
import { X, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CampingSpotWithId,
  CampingSpotTypeLabels,
  PrefectureOptions,
  CampingSpotType,
} from '@/data/schemas/campingSpot';
import {
  createCampingSpot,
  updateCampingSpot,
  deleteCampingSpot,
} from '../../app/actions/campingSpots';
import { CoordinatesFromClipboardButton } from '../itinerary/CoordinatesFromClipboardButton';
import { Map, Calculator } from 'lucide-react';
import { calculateDistanceFromStrings } from '@/lib/utils/distance';

interface CampingSpotFormProps {
  spot?: CampingSpotWithId | null;
  onClose: () => void;
  onSuccess: () => void;
}

const CampingSpotFormSchema = z.object({
  name: z.string().min(1, '名称を入力してください'),
  lat: z.string().min(1, '緯度を入力してください').refine(
    (val) => !isNaN(Number(val)) && Number(val) >= -90 && Number(val) <= 90,
    { message: '有効な緯度を入力してください（-90〜90）' }
  ),
  lng: z.string().min(1, '経度を入力してください').refine(
    (val) => !isNaN(Number(val)) && Number(val) >= -180 && Number(val) <= 180,
    { message: '有効な経度を入力してください（-180〜180）' }
  ),
  prefecture: z.string().min(1, '都道府県を選択してください'),
  address: z.string().optional(),
  url: z.string().optional().refine(
    (val) => !val || /^https?:\/\/.+/.test(val),
    { message: '有効なURLを入力してください' }
  ),
  type: z.enum(['roadside_station', 'paid_parking', 'sa_pa', 'park', 'beach', 'mountain', 'rv_park', 'convenience_store', 'other'] as const),
  distanceToToilet: z.string().optional().refine(
    (val) => !val || val === '' || (!isNaN(Number(val)) && Number(val) >= 0),
    { message: '有効な数値を入力してください（0以上）' }
  ),
  distanceToBath: z.string().optional().refine(
    (val) => !val || val === '' || (!isNaN(Number(val)) && Number(val) >= 0),
    { message: '有効な数値を入力してください（0以上）' }
  ),
  distanceToConvenience: z.string().optional().refine(
    (val) => !val || val === '' || (!isNaN(Number(val)) && Number(val) >= 0),
    { message: '有効な数値を入力してください（0以上）' }
  ),
  nearbyToiletLat: z.string().optional().refine(
    (val) => !val || val === '' || (!isNaN(Number(val)) && Number(val) >= -90 && Number(val) <= 90),
    { message: '有効な緯度を入力してください（-90〜90）' }
  ),
  nearbyToiletLng: z.string().optional().refine(
    (val) => !val || val === '' || (!isNaN(Number(val)) && Number(val) >= -180 && Number(val) <= 180),
    { message: '有効な経度を入力してください（-180〜180）' }
  ),
  nearbyConvenienceLat: z.string().optional().refine(
    (val) => !val || val === '' || (!isNaN(Number(val)) && Number(val) >= -90 && Number(val) <= 90),
    { message: '有効な緯度を入力してください（-90〜90）' }
  ),
  nearbyConvenienceLng: z.string().optional().refine(
    (val) => !val || val === '' || (!isNaN(Number(val)) && Number(val) >= -180 && Number(val) <= 180),
    { message: '有効な経度を入力してください（-180〜180）' }
  ),
  nearbyBathLat: z.string().optional().refine(
    (val) => !val || val === '' || (!isNaN(Number(val)) && Number(val) >= -90 && Number(val) <= 90),
    { message: '有効な緯度を入力してください（-90〜90）' }
  ),
  nearbyBathLng: z.string().optional().refine(
    (val) => !val || val === '' || (!isNaN(Number(val)) && Number(val) >= -180 && Number(val) <= 180),
    { message: '有効な経度を入力してください（-180〜180）' }
  ),
  elevation: z.string().optional().refine(
    (val) => !val || val === '' || (!isNaN(Number(val)) && Number(val) >= 0),
    { message: '有効な数値を入力してください（0以上）' }
  ),
  quietnessLevel: z.string().optional().refine(
    (val) => !val || val === '' || (!isNaN(Number(val)) && Number(val) >= 1 && Number(val) <= 5),
    { message: '1〜5の数値を入力してください' }
  ),
  securityLevel: z.string().optional().refine(
    (val) => !val || val === '' || (!isNaN(Number(val)) && Number(val) >= 1 && Number(val) <= 5),
    { message: '1〜5の数値を入力してください' }
  ),
  overallRating: z.string().optional().refine(
    (val) => !val || val === '' || (!isNaN(Number(val)) && Number(val) >= 1 && Number(val) <= 5),
    { message: '1〜5の数値を入力してください' }
  ),
  hasRoof: z.boolean(),
  hasPowerOutlet: z.boolean(),
  hasGate: z.boolean(),
  isFree: z.boolean(),
  pricePerNight: z.string().optional().refine(
    (val) => !val || val === '' || (!isNaN(Number(val)) && Number(val) >= 0),
    { message: '有効な数値を入力してください（0以上）' }
  ),
  priceNote: z.string().optional(),
  capacity: z.string().optional().refine(
    (val) => !val || val === '' || (!isNaN(Number(val)) && Number(val) >= 1),
    { message: '有効な数値を入力してください（1以上）' }
  ),
  restrictions: z.string(),
  amenities: z.string(),
  notes: z.string().optional(),
});

type CampingSpotFormData = z.infer<typeof CampingSpotFormSchema>;

export default function CampingSpotForm({
  spot,
  onClose,
  onSuccess,
}: CampingSpotFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const isEdit = !!spot?._id;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CampingSpotFormData>({
    resolver: zodResolver(CampingSpotFormSchema),
    defaultValues: {
      name: '',
      lat: '35.3325289',　// 相模湾
      lng: '139.5631214',　// 相模湾
      prefecture: '',
      address: '',
      url: '',
      type: 'other' as CampingSpotType,
      distanceToToilet: '',
      distanceToBath: '',
      distanceToConvenience: '',
      nearbyToiletLat: '',
      nearbyToiletLng: '',
      nearbyConvenienceLat: '',
      nearbyConvenienceLng: '',
      nearbyBathLat: '',
      nearbyBathLng: '',
      elevation: '',
      quietnessLevel: '',
      securityLevel: '',
      overallRating: '',
      hasRoof: false,
      hasPowerOutlet: false,
      hasGate: false,
      isFree: true,
      pricePerNight: '',
      priceNote: '',
      capacity: '',
      restrictions: '',
      amenities: '',
      notes: '',
    },
  });

  const isFree = watch('isFree');

  // Watch coordinates for automatic distance calculation
  const spotLat = watch('lat');
  const spotLng = watch('lng');
  const toiletLat = watch('nearbyToiletLat');
  const toiletLng = watch('nearbyToiletLng');
  const convenienceLat = watch('nearbyConvenienceLat');
  const convenienceLng = watch('nearbyConvenienceLng');
  const bathLat = watch('nearbyBathLat');
  const bathLng = watch('nearbyBathLng');

  // Auto-calculate distances when coordinates change
  const calculateAndSetDistance = (facilityType: 'toilet' | 'convenience' | 'bath') => {
    if (!spotLat || !spotLng) {
      toast({
        title: '距離計算',
        description: 'スポットの座標を先に入力してください',
        variant: 'destructive',
      });
      return;
    }

    let facilityLat: string, facilityLng: string, distanceField: string;

    switch (facilityType) {
      case 'toilet':
        facilityLat = toiletLat || '';
        facilityLng = toiletLng || '';
        distanceField = 'distanceToToilet';
        break;
      case 'convenience':
        facilityLat = convenienceLat || '';
        facilityLng = convenienceLng || '';
        distanceField = 'distanceToConvenience';
        break;
      case 'bath':
        facilityLat = bathLat || '';
        facilityLng = bathLng || '';
        distanceField = 'distanceToBath';
        break;
    }

    const distance = calculateDistanceFromStrings(spotLat, spotLng, facilityLat, facilityLng);

    if (distance !== null) {
      setValue(distanceField as any, distance.toString());
      toast({
        title: '距離計算完了',
        description: `${Math.round(distance)}mで設定しました`,
      });
    } else {
      toast({
        title: '距離計算エラー',
        description: '有効な座標を入力してください',
        variant: 'destructive',
      });
    }
  };

  // コンポーネントマウント時とspotが変わった時にフォームの値を設定
  useEffect(() => {
    if (spot) {
      const formValues = {
        name: spot.name,
        lat: spot.coordinates[1].toString(),
        lng: spot.coordinates[0].toString(),
        prefecture: spot.prefecture,
        address: spot.address || '',
        url: spot.url || '',
        type: spot.type,
        distanceToToilet: spot.distanceToToilet?.toString() || '',
        distanceToBath: spot.distanceToBath?.toString() || '',
        distanceToConvenience: spot.distanceToConvenience?.toString() || '',
        nearbyToiletLat: spot.nearbyToiletCoordinates && spot.nearbyToiletCoordinates.length >= 2 ? spot.nearbyToiletCoordinates[1].toString() : '',
        nearbyToiletLng: spot.nearbyToiletCoordinates && spot.nearbyToiletCoordinates.length >= 2 ? spot.nearbyToiletCoordinates[0].toString() : '',
        nearbyConvenienceLat: spot.nearbyConvenienceCoordinates && spot.nearbyConvenienceCoordinates.length >= 2 ? spot.nearbyConvenienceCoordinates[1].toString() : '',
        nearbyConvenienceLng: spot.nearbyConvenienceCoordinates && spot.nearbyConvenienceCoordinates.length >= 2 ? spot.nearbyConvenienceCoordinates[0].toString() : '',
        nearbyBathLat: spot.nearbyBathCoordinates && spot.nearbyBathCoordinates.length >= 2 ? spot.nearbyBathCoordinates[1].toString() : '',
        nearbyBathLng: spot.nearbyBathCoordinates && spot.nearbyBathCoordinates.length >= 2 ? spot.nearbyBathCoordinates[0].toString() : '',
        elevation: spot.elevation?.toString() || '',
        quietnessLevel: spot.quietnessLevel?.toString() || '',
        securityLevel: spot.securityLevel?.toString() || '',
        overallRating: spot.overallRating?.toString() || '',
        hasRoof: spot.hasRoof,
        hasPowerOutlet: spot.hasPowerOutlet,
        hasGate: spot.hasGate,
        isFree: spot.pricing.isFree,
        pricePerNight: spot.pricing.pricePerNight?.toString() || '',
        priceNote: spot.pricing.priceNote || '',
        capacity: spot.capacity?.toString() || '',
        restrictions: spot.restrictions.join(', '),
        amenities: spot.amenities.join(', '),
        notes: spot.notes || ''
      };
      console.log('Setting form values:', {
        quietnessLevel: formValues.quietnessLevel,
        securityLevel: formValues.securityLevel,
        overallRating: formValues.overallRating,
        capacity: formValues.capacity,
        distanceToToilet: formValues.distanceToToilet,
        notes: formValues.notes,
      });
      reset(formValues);
    } else {
      // 新規作成の場合はデフォルト値にリセット
      reset({
        name: '',
        lat: '35.3325289',
        lng: '139.5631214',
        prefecture: '',
        address: '',
        url: '',
        type: 'other' as CampingSpotType,
        distanceToToilet: '',
        distanceToBath: '',
        distanceToConvenience: '',
        nearbyToiletLat: '',
        nearbyToiletLng: '',
        nearbyConvenienceLat: '',
        nearbyConvenienceLng: '',
        nearbyBathLat: '',
        nearbyBathLng: '',
        elevation: '',
        quietnessLevel: '',
        securityLevel: '',
        overallRating: '',
        hasRoof: false,
        hasPowerOutlet: false,
        hasGate: false,
        isFree: true,
        pricePerNight: '',
        priceNote: '',
        capacity: '',
        restrictions: '',
        amenities: '',
        notes: ''
      });
    }
  }, [spot, reset]);

  const onSubmit = async (data: CampingSpotFormData) => {
    try {
      setLoading(true);

      console.log('Form submission data:', {
        quietnessLevel: data.quietnessLevel,
        securityLevel: data.securityLevel,
        overallRating: data.overallRating,
        capacity: data.capacity,
        distanceToToilet: data.distanceToToilet,
        notes: data.notes,
      });

      const formData = new FormData();

      // Handle required fields
      formData.append('name', data.name);
      formData.append('lat', data.lat);
      formData.append('lng', data.lng);
      formData.append('prefecture', data.prefecture);
      formData.append('type', data.type);

      // Handle optional string fields
      if (data.address && data.address.trim() !== '') {
        formData.append('address', data.address);
      }
      if (data.url && data.url.trim() !== '') {
        formData.append('url', data.url);
      }
      if (data.priceNote && data.priceNote.trim() !== '') {
        formData.append('priceNote', data.priceNote);
      }
      if (data.notes && data.notes.trim() !== '') {
        formData.append('notes', data.notes);
      }

      // Handle optional number fields
      if (data.distanceToToilet && data.distanceToToilet.trim() !== '') {
        formData.append('distanceToToilet', data.distanceToToilet);
      }
      if (data.distanceToBath && data.distanceToBath.trim() !== '') {
        formData.append('distanceToBath', data.distanceToBath);
      }
      if (data.distanceToConvenience && data.distanceToConvenience.trim() !== '') {
        formData.append('distanceToConvenience', data.distanceToConvenience);
      }
      if (data.elevation && data.elevation.trim() !== '') {
        formData.append('elevation', data.elevation);
      }

      // Handle nearby coordinates
      if (data.nearbyToiletLat && data.nearbyToiletLng &&
          data.nearbyToiletLat.trim() !== '' && data.nearbyToiletLng.trim() !== '') {
        formData.append('nearbyToiletLat', data.nearbyToiletLat);
        formData.append('nearbyToiletLng', data.nearbyToiletLng);
      }
      if (data.nearbyConvenienceLat && data.nearbyConvenienceLng &&
          data.nearbyConvenienceLat.trim() !== '' && data.nearbyConvenienceLng.trim() !== '') {
        formData.append('nearbyConvenienceLat', data.nearbyConvenienceLat);
        formData.append('nearbyConvenienceLng', data.nearbyConvenienceLng);
      }
      if (data.nearbyBathLat && data.nearbyBathLng &&
          data.nearbyBathLat.trim() !== '' && data.nearbyBathLng.trim() !== '') {
        formData.append('nearbyBathLat', data.nearbyBathLat);
        formData.append('nearbyBathLng', data.nearbyBathLng);
      }

      if (data.quietnessLevel && data.quietnessLevel.trim() !== '') {
        formData.append('quietnessLevel', data.quietnessLevel);
      }
      if (data.securityLevel && data.securityLevel.trim() !== '') {
        formData.append('securityLevel', data.securityLevel);
      }
      if (data.overallRating && data.overallRating.trim() !== '') {
        formData.append('overallRating', data.overallRating);
      }
      if (data.capacity && data.capacity.trim() !== '') {
        formData.append('capacity', data.capacity);
      }
      if (data.pricePerNight && data.pricePerNight.trim() !== '') {
        formData.append('pricePerNight', data.pricePerNight);
      }

      // Handle boolean fields
      formData.append('hasRoof', data.hasRoof.toString());
      formData.append('hasPowerOutlet', data.hasPowerOutlet.toString());
      formData.append('hasGate', data.hasGate.toString());
      formData.append('isFree', data.isFree.toString());

      // Handle array fields
      formData.append('restrictions', data.restrictions);
      formData.append('amenities', data.amenities);

      if (isEdit) {
        await updateCampingSpot(spot._id, formData);
      } else {
        await createCampingSpot(formData);
      }

      onSuccess();
    } catch (error) {
      console.error('Save error:', error);

      const errorMessage = isEdit
        ? 'スポットの更新に失敗しました'
        : 'スポットの作成に失敗しました';

      toast({
        title: 'エラー',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!spot?._id) return;

    try {
      setLoading(true);
      await deleteCampingSpot(spot._id);
      toast({
        title: '成功',
        description: 'スポットを削除しました',
      });
      onSuccess();
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: 'エラー',
        description: 'スポットの削除に失敗しました',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const showOnMap = () => {
    const lat = watch('lat');
    const lng = watch('lng');

    if (!lat || !lng) {
      toast({
        title: '地図で表示',
        description: '緯度・経度を入力してください',
        variant: 'destructive',
      });
      return;
    }

    const url = `https://www.google.com/maps/place/${lat},${lng}`;
    window.open(url, '_blank');
  };

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
      <Card className='w-full max-w-4xl max-h-[90vh] overflow-auto'>
        <CardHeader className='flex flex-row items-center justify-between'>
          <CardTitle>{isEdit ? 'スポット編集' : '新規スポット作成'}</CardTitle>
          <div className='flex gap-2'>
            {isEdit && (
              <Button
                variant='destructive'
                size='sm'
                onClick={() => setShowDeleteConfirm(true)}
                disabled={loading}
              >
                <Trash2 className='w-4 h-4' />
              </Button>
            )}
            <Button variant='outline' size='sm' onClick={onClose}>
              <X className='w-4 h-4' />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
            {/* Basic Info */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <Label htmlFor='name'>名称 *</Label>
                <Input
                  id='name'
                  {...register('name')}
                  placeholder='スポット名を入力'
                />
                {errors.name && (
                  <p className='text-sm text-red-500'>{errors.name.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor='prefecture'>都道府県 *</Label>
                <Select
                  onValueChange={(value) => setValue('prefecture', value)}
                  defaultValue={spot?.prefecture}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='都道府県を選択' />
                  </SelectTrigger>
                  <SelectContent>
                    {PrefectureOptions.map((prefecture) => (
                      <SelectItem key={prefecture} value={prefecture}>
                        {prefecture}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.prefecture && (
                  <p className='text-sm text-red-500'>
                    {errors.prefecture.message}
                  </p>
                )}
              </div>
            </div>


            {/* Coordinates */}
            <div className='space-y-4'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <Label htmlFor='lat'>緯度 *</Label>
                  <Input id='lat' type='number' step='any' {...register('lat')} />
                  {errors.lat && (
                    <p className='text-sm text-red-500'>{errors.lat.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor='lng'>経度 *</Label>
                  <Input id='lng' type='number' step='any' {...register('lng')} />
                  {errors.lng && (
                    <p className='text-sm text-red-500'>{errors.lng.message}</p>
                  )}
                </div>
              </div>
              <div className='flex justify-start gap-2'>
                <CoordinatesFromClipboardButton
                  onCoordinatesExtracted={(latitude, longitude) => {
                    setValue('lat', latitude);
                    setValue('lng', longitude);
                  }}
                />
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  className='flex items-center gap-2 text-sm h-8'
                  onClick={showOnMap}
                >
                  <Map className='w-4 h-4' />
                  地図で表示
                </Button>
              </div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <Label htmlFor='address'>住所</Label>
                <Input
                  id='address'
                  {...register('address')}
                  placeholder='住所（任意）'
                />
                {errors.address && (
                  <p className='text-sm text-red-500'>{errors.address.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor='url'>URL</Label>
                <Input
                  id='url'
                  type='url'
                  {...register('url')}
                  placeholder='URL（任意）'
                />
                {errors.url && (
                  <p className='text-sm text-red-500'>{errors.url.message}</p>
                )}
              </div>
            </div>

            {/* Type and Basic Properties */}
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <div>
                <Label htmlFor='type'>種別 *</Label>
                <Select
                  onValueChange={(value) =>
                    setValue('type', value as CampingSpotType)
                  }
                  defaultValue={spot?.type}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='種別を選択' />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CampingSpotTypeLabels).map(
                      ([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
                {errors.type && (
                  <p className='text-sm text-red-500'>{errors.type.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor='capacity'>収容台数</Label>
                <Input
                  id='capacity'
                  type='number'
                  min='1'
                  placeholder='台数または空欄'
                  {...register('capacity')}
                />
                {errors.capacity && (
                  <p className='text-sm text-red-500'>
                    {errors.capacity.message}
                  </p>
                )}
              </div>
            </div>

            {/* Pricing */}
            <div className='space-y-3'>
              <Label>費用</Label>
              <div className='flex items-center space-x-2'>
                <Checkbox
                  id='isFree'
                  checked={isFree}
                  onCheckedChange={(checked) => setValue('isFree', !!checked)}
                />
                <label htmlFor='isFree'>無料</label>
              </div>
              {!isFree && (
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div>
                    <Label htmlFor='pricePerNight'>一泊料金 (円)</Label>
                    <Input
                      id='pricePerNight'
                      type='number'
                      min='0'
                      {...register('pricePerNight')}
                    />
                  </div>
                  <div>
                    <Label htmlFor='priceNote'>料金備考</Label>
                    <Input
                      id='priceNote'
                      {...register('priceNote')}
                      placeholder='料金に関する備考'
                    />
                  </div>
                </div>
              )}
            </div>


            {/* Ratings */}
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <div>
                <Label htmlFor='quietnessLevel'>静けさレベル (1-5)</Label>
                <Input
                  id='quietnessLevel'
                  type='number'
                  min='1'
                  max='5'
                  placeholder='1-5または空欄'
                  {...register('quietnessLevel')}
                />
                {errors.quietnessLevel && (
                  <p className='text-sm text-red-500'>
                    {errors.quietnessLevel.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor='securityLevel'>治安レベル (1-5)</Label>
                <Input
                  id='securityLevel'
                  type='number'
                  min='1'
                  max='5'
                  placeholder='1-5または空欄'
                  {...register('securityLevel')}
                />
                {errors.securityLevel && (
                  <p className='text-sm text-red-500'>
                    {errors.securityLevel.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor='overallRating'>総合評価 (1-5)</Label>
                <Input
                  id='overallRating'
                  type='number'
                  min='1'
                  max='5'
                  placeholder='1-5または空欄'
                  {...register('overallRating')}
                />
                {errors.overallRating && (
                  <p className='text-sm text-red-500'>
                    {errors.overallRating.message}
                  </p>
                )}
              </div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <div>
                <Label htmlFor='elevation'>標高 (m)</Label>
                <Input
                  id='elevation'
                  type='number'
                  min='0'
                  {...register('elevation')}
                  placeholder='標高(m)または空欄'
                />
                {errors.elevation && (
                  <p className='text-sm text-red-500'>{errors.elevation.message}</p>
                )}
              </div>
            </div>

            {/* Features */}
            <div className='space-y-3'>
              <Label>設備・特徴</Label>
              <div className='flex flex-wrap gap-4'>
                <div className='flex items-center space-x-2'>
                  <Checkbox
                    id='hasRoof'
                    checked={watch('hasRoof')}
                    onCheckedChange={(checked) =>
                      setValue('hasRoof', !!checked)
                    }
                  />
                  <label htmlFor='hasRoof'>屋根付き</label>
                </div>
                <div className='flex items-center space-x-2'>
                  <Checkbox
                    id='hasPowerOutlet'
                    checked={watch('hasPowerOutlet')}
                    onCheckedChange={(checked) =>
                      setValue('hasPowerOutlet', !!checked)
                    }
                  />
                  <label htmlFor='hasPowerOutlet'>電源あり</label>
                </div>
                <div className='flex items-center space-x-2'>
                  <Checkbox
                    id='hasGate'
                    checked={watch('hasGate')}
                    onCheckedChange={(checked) =>
                      setValue('hasGate', !!checked)
                    }
                  />
                  <label htmlFor='hasGate'>ゲート付き</label>
                </div>
              </div>
            </div>


            {/* Additional Info */}
            <div>
              <Label htmlFor='restrictions'>制限事項</Label>
              <Input
                id='restrictions'
                {...register('restrictions')}
                placeholder='制限事項をカンマ区切りで入力'
              />
              {errors.restrictions && (
                <p className='text-sm text-red-500'>{errors.restrictions.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor='amenities'>その他設備</Label>
              <Input
                id='amenities'
                {...register('amenities')}
                placeholder='その他設備をカンマ区切りで入力'
              />
              {errors.amenities && (
                <p className='text-sm text-red-500'>{errors.amenities.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor='notes'>備考</Label>
              <Textarea
                id='notes'
                {...register('notes')}
                placeholder='詳細な情報、アクセス方法、注意点など（任意）'
                rows={4}
              />
              {errors.notes && (
                <p className='text-sm text-red-500'>{errors.notes.message}</p>
              )}
            </div>

            {/* 近くの施設の情報 */}
            <div className='space-y-6'>
              <div>
                <Label className='text-lg font-semibold'>近くの施設の情報</Label>
                <div className='space-y-6 mt-4'>
                  {/* トイレ情報 */}
                  <div className='border rounded-lg p-4 bg-gray-50 dark:bg-gray-800 dark:border-gray-600'>
                    <Label className='text-md font-medium'>トイレ</Label>
                    <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mt-3'>
                      <div>
                        <Label htmlFor='distanceToToilet'>距離 (m)</Label>
                        <div className='flex gap-2'>
                          <Input
                            id='distanceToToilet'
                            type='number'
                            min='0'
                            placeholder='距離(m)または空欄'
                            {...register('distanceToToilet')}
                          />
                          <Button
                            type='button'
                            variant='outline'
                            size='sm'
                            onClick={() => calculateAndSetDistance('toilet')}
                            className='px-2'
                            title='座標から距離を自動計算'
                          >
                            <Calculator className='w-4 h-4' />
                          </Button>
                        </div>
                        {errors.distanceToToilet && (
                          <p className='text-sm text-red-500'>
                            {errors.distanceToToilet.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor='nearbyToiletLat'>緯度</Label>
                        <Input
                          id='nearbyToiletLat'
                          type='number'
                          step='any'
                          placeholder='緯度（任意）'
                          {...register('nearbyToiletLat')}
                        />
                        {errors.nearbyToiletLat && (
                          <p className='text-sm text-red-500'>{errors.nearbyToiletLat.message}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor='nearbyToiletLng'>経度</Label>
                        <Input
                          id='nearbyToiletLng'
                          type='number'
                          step='any'
                          placeholder='経度（任意）'
                          {...register('nearbyToiletLng')}
                        />
                        {errors.nearbyToiletLng && (
                          <p className='text-sm text-red-500'>{errors.nearbyToiletLng.message}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* コンビニ情報 */}
                  <div className='border rounded-lg p-4 bg-gray-50 dark:bg-gray-800 dark:border-gray-600'>
                    <Label className='text-md font-medium'>コンビニ</Label>
                    <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mt-3'>
                      <div>
                        <Label htmlFor='distanceToConvenience'>距離 (m)</Label>
                        <div className='flex gap-2'>
                          <Input
                            id='distanceToConvenience'
                            type='number'
                            min='0'
                            {...register('distanceToConvenience')}
                            placeholder='距離(m)または空欄'
                          />
                          <Button
                            type='button'
                            variant='outline'
                            size='sm'
                            onClick={() => calculateAndSetDistance('convenience')}
                            className='px-2'
                            title='座標から距離を自動計算'
                          >
                            <Calculator className='w-4 h-4' />
                          </Button>
                        </div>
                        {errors.distanceToConvenience && (
                          <p className='text-sm text-red-500'>{errors.distanceToConvenience.message}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor='nearbyConvenienceLat'>緯度</Label>
                        <Input
                          id='nearbyConvenienceLat'
                          type='number'
                          step='any'
                          placeholder='緯度（任意）'
                          {...register('nearbyConvenienceLat')}
                        />
                        {errors.nearbyConvenienceLat && (
                          <p className='text-sm text-red-500'>{errors.nearbyConvenienceLat.message}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor='nearbyConvenienceLng'>経度</Label>
                        <Input
                          id='nearbyConvenienceLng'
                          type='number'
                          step='any'
                          placeholder='経度（任意）'
                          {...register('nearbyConvenienceLng')}
                        />
                        {errors.nearbyConvenienceLng && (
                          <p className='text-sm text-red-500'>{errors.nearbyConvenienceLng.message}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 入浴施設情報 */}
                  <div className='border rounded-lg p-4 bg-gray-50 dark:bg-gray-800 dark:border-gray-600'>
                    <Label className='text-md font-medium'>入浴施設</Label>
                    <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mt-3'>
                      <div>
                        <Label htmlFor='distanceToBath'>距離 (m)</Label>
                        <div className='flex gap-2'>
                          <Input
                            id='distanceToBath'
                            type='number'
                            min='0'
                            {...register('distanceToBath')}
                            placeholder='距離(m)または空欄'
                          />
                          <Button
                            type='button'
                            variant='outline'
                            size='sm'
                            onClick={() => calculateAndSetDistance('bath')}
                            className='px-2'
                            title='座標から距離を自動計算'
                          >
                            <Calculator className='w-4 h-4' />
                          </Button>
                        </div>
                        {errors.distanceToBath && (
                          <p className='text-sm text-red-500'>{errors.distanceToBath.message}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor='nearbyBathLat'>緯度</Label>
                        <Input
                          id='nearbyBathLat'
                          type='number'
                          step='any'
                          placeholder='緯度（任意）'
                          {...register('nearbyBathLat')}
                        />
                        {errors.nearbyBathLat && (
                          <p className='text-sm text-red-500'>{errors.nearbyBathLat.message}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor='nearbyBathLng'>経度</Label>
                        <Input
                          id='nearbyBathLng'
                          type='number'
                          step='any'
                          placeholder='経度（任意）'
                          {...register('nearbyBathLng')}
                        />
                        {errors.nearbyBathLng && (
                          <p className='text-sm text-red-500'>{errors.nearbyBathLng.message}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className='flex justify-end gap-2'>
              <Button type='button' variant='outline' onClick={onClose}>
                キャンセル
              </Button>
              <Button type='submit' disabled={loading}>
                <Save className='w-4 h-4 mr-2' />
                {loading ? '保存中...' : isEdit ? '更新' : '作成'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60'>
          <Card className='w-full max-w-md'>
            <CardHeader>
              <CardTitle className='text-red-600'>削除確認</CardTitle>
            </CardHeader>
            <CardContent>
              <p className='mb-4'>
                「{spot?.name}」を削除しますか？この操作は取り消せません。
              </p>
              <div className='flex justify-end gap-2'>
                <Button
                  variant='outline'
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={loading}
                >
                  キャンセル
                </Button>
                <Button
                  variant='destructive'
                  onClick={handleDelete}
                  disabled={loading}
                >
                  削除
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
