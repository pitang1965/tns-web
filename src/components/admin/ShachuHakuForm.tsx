'use client';


import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/components/ui/use-toast';
import { X, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  CampingSpotWithId,
  CampingSpotType,
} from '@/data/schemas/campingSpot';
import {
  createCampingSpot,
  updateCampingSpot,
  deleteCampingSpot,
} from '../../app/actions/campingSpots';
import { ShachuHakuFormCreateSchema, ShachuHakuFormEditSchema, ShachuHakuFormData } from './validationSchemas';
import { BasicInfoFields } from './BasicInfoFields';
import { PricingFields } from './PricingFields';
import { RatingFields } from './RatingFields';
import { FeatureFields } from './FeatureFields';
import { NearbyFacilityFields } from './NearbyFacilityFields';
import { FacilitiesMap } from './FacilitiesMap';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';

type ShachuHakuFormProps = {
  spot?: CampingSpotWithId | null;
  onClose: () => void;
  onSuccess: () => void;
}


export default function ShachuHakuForm({
  spot,
  onClose,
  onSuccess,
}: ShachuHakuFormProps) {
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
  } = useForm<ShachuHakuFormData>({
    resolver: zodResolver(isEdit ? ShachuHakuFormEditSchema : ShachuHakuFormCreateSchema),
    defaultValues: {
      name: '',
      lat: '',
      lng: '',
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
      // 新評価システム（客観的データ）
      securityHasGate: false,
      securityHasLighting: false,
      securityHasStaff: false,
      nightNoiseHasNoiseIssues: false,
      nightNoiseNearBusyRoad: false,
      nightNoiseIsQuietArea: false,
      // 旧評価システム（段階的廃止予定）
      quietnessLevel: '',
      securityLevel: '',
      overallRating: '',
      hasRoof: false,
      hasPowerOutlet: false,
      isFree: undefined,
      pricePerNight: '',
      priceNote: '',
      capacity: '',
      capacityLarge: '',
      restrictions: '',
      amenities: '',
      notes: '',
    },
  });

  // コンポーネントマウント時とspotが変わった時にフォームの値を設定
  useEffect(() => {
    if (spot && spot._id) {
      // 編集モード：spotの値でフォームを初期化
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
        // 新評価システム（客観的データ）
        securityHasGate: spot.security?.hasGate || false,
        securityHasLighting: spot.security?.hasLighting || false,
        securityHasStaff: spot.security?.hasStaff || false,
        nightNoiseHasNoiseIssues: spot.nightNoise?.hasNoiseIssues || false,
        nightNoiseNearBusyRoad: spot.nightNoise?.nearBusyRoad || false,
        nightNoiseIsQuietArea: spot.nightNoise?.isQuietArea || false,
        // 旧評価システム（段階的廃止予定） - レガシーデータとの互換性のため
        quietnessLevel: (spot as any).quietnessLevel?.toString() || '',
        securityLevel: (spot as any).securityLevel?.toString() || '',
        overallRating: (spot as any).overallRating?.toString() || '',
        hasRoof: spot.hasRoof,
        hasPowerOutlet: spot.hasPowerOutlet,
        isFree: spot.pricing.isFree,
        pricePerNight: spot.pricing.pricePerNight?.toString() || '',
        priceNote: spot.pricing.priceNote || '',
        capacity: spot.capacity?.toString() || '',
        capacityLarge: spot.capacityLarge?.toString() || '',
        restrictions: spot.restrictions.join(', '),
        amenities: spot.amenities.join(', '),
        notes: spot.notes || ''
      };
      console.log('Setting form values:', {
        name: formValues.name,
        type: formValues.type,
        prefecture: formValues.prefecture,
        quietnessLevel: formValues.quietnessLevel,
        securityLevel: formValues.securityLevel,
        overallRating: formValues.overallRating,
        capacity: formValues.capacity,
        distanceToToilet: formValues.distanceToToilet,
        notes: formValues.notes,
      });
      reset(formValues);

      // reset後に明示的にSelectフィールドの値を設定
      // これによりSelectコンポーネントが確実に値を受け取る
      setTimeout(() => {
        setValue('type', formValues.type, { shouldValidate: true });
        setValue('prefecture', formValues.prefecture, { shouldValidate: true });
      }, 0);
    } else if (spot && !spot._id) {
      // 新規作成（地図クリック）：座標のみ設定、他はデフォルト値のまま（自動設定を妨げない）
      setValue('lat', spot.coordinates[1].toString());
      setValue('lng', spot.coordinates[0].toString());
      // type は defaultValues の 'other' のまま（useAutoSetSpotTypeが動作できるように）
    } else {
      // 新規作成（ボタンクリック）の場合はデフォルト値にリセット
      reset({
        name: '',
        lat: '',
        lng: '',
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
        // 新評価システム（客観的データ）
        securityHasGate: false,
        securityHasLighting: false,
        securityHasStaff: false,
        nightNoiseHasNoiseIssues: false,
        nightNoiseNearBusyRoad: false,
        nightNoiseIsQuietArea: false,
        // 旧評価システム（段階的廃止予定）
        quietnessLevel: '',
        securityLevel: '',
        overallRating: '',
        hasRoof: false,
        hasPowerOutlet: false,
        isFree: undefined,
        pricePerNight: '',
        priceNote: '',
        capacity: '',
        capacityLarge: '',
        restrictions: '',
        amenities: '',
        notes: ''
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spot]);


  const onSubmit = async (data: ShachuHakuFormData) => {
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

      // 新評価システム（客観的データ）
      formData.append('securityHasGate', data.securityHasGate.toString());
      formData.append('securityHasLighting', data.securityHasLighting.toString());
      formData.append('securityHasStaff', data.securityHasStaff.toString());
      formData.append('nightNoiseHasNoiseIssues', data.nightNoiseHasNoiseIssues.toString());
      formData.append('nightNoiseNearBusyRoad', data.nightNoiseNearBusyRoad.toString());
      formData.append('nightNoiseIsQuietArea', data.nightNoiseIsQuietArea.toString());

      // 旧評価システム（段階的廃止予定）
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
      if (data.capacityLarge && data.capacityLarge.trim() !== '') {
        formData.append('capacityLarge', data.capacityLarge);
      }
      if (data.pricePerNight && data.pricePerNight.trim() !== '') {
        formData.append('pricePerNight', data.pricePerNight);
      }

      // Handle boolean fields
      formData.append('hasRoof', data.hasRoof.toString());
      formData.append('hasPowerOutlet', data.hasPowerOutlet.toString());
      if (data.isFree !== undefined) {
        formData.append('isFree', data.isFree.toString());
      }

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

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
      <Card className='w-full max-w-4xl max-h-[90vh] overflow-auto'>
        <CardHeader className='flex flex-row items-center justify-between'>
          <CardTitle>{isEdit ? '車中泊スポット編集' : '車中泊スポット作成'}</CardTitle>
          <div className='flex gap-2'>
            {isEdit && (
              <Button
                variant='destructive'
                size='sm'
                onClick={() => setShowDeleteConfirm(true)}
                disabled={loading}
                className='cursor-pointer'
              >
                <Trash2 className='w-4 h-4' />
              </Button>
            )}
            <Button variant='outline' size='sm' onClick={onClose} className='cursor-pointer'>
              <X className='w-4 h-4' />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit(onSubmit)}
            onKeyDown={(e) => {
              // Enterキーでの送信を無効化（textareaでの改行は許可）
              if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
                e.preventDefault();
              }
            }}
            className='space-y-6'
          >
            <BasicInfoFields
              spot={spot}
              register={register}
              watch={watch}
              setValue={setValue}
              errors={errors}
            />

            <PricingFields
              register={register}
              watch={watch}
              setValue={setValue}
              errors={errors}
            />

            <RatingFields
              register={register}
              errors={errors}
              watch={watch}
              spot={spot}
            />

            <FeatureFields
              register={register}
              watch={watch}
              setValue={setValue}
              errors={errors}
            />

            <NearbyFacilityFields
              register={register}
              watch={watch}
              setValue={setValue}
              errors={errors}
            />

            <FacilitiesMap watch={watch} />

            {/* Submit Buttons */}
            <div className='flex justify-end gap-2'>
              <Button type='button' variant='outline' onClick={onClose} className='cursor-pointer'>
                キャンセル
              </Button>
              <Button type='submit' disabled={loading} className='cursor-pointer'>
                <Save className='w-4 h-4 mr-2' />
                {loading ? '保存中...' : isEdit ? '更新' : '作成'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {showDeleteConfirm && (
        <DeleteConfirmDialog
          spot={spot}
          loading={loading}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  );
}
