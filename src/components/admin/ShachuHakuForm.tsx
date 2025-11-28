'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/components/ui/use-toast';
import { useScrollRestoration } from '@/hooks/useScrollRestoration';
import { clearShachuHakuCache } from '@/lib/cacheUtils';
import {
  useCheckMissingFields,
  MissingFields,
} from '@/hooks/useCheckMissingFields';
import {
  X,
  Save,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { CampingSpotWithId } from '@/data/schemas/campingSpot';
import {
  createCampingSpot,
  updateCampingSpot,
  deleteCampingSpot,
} from '../../app/actions/campingSpots/admin';
import {
  ShachuHakuFormCreateSchema,
  ShachuHakuFormEditSchema,
  ShachuHakuFormData,
} from './validationSchemas';
import { BasicInfoFields } from './BasicInfoFields';
import { PricingFields } from './PricingFields';
import { RatingFields } from './RatingFields';
import { FeatureFields } from './FeatureFields';
import { NearbyFacilityFields } from './NearbyFacilityFields';
import { FacilitiesMap } from './FacilitiesMap';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import { MissingFieldsConfirmDialog } from './MissingFieldsConfirmDialog';

type NavigationData = {
  currentIndex: number;
  total: number;
  prevId: string | null;
  nextId: string | null;
};

type ShachuHakuFormProps = {
  spot?: CampingSpotWithId | null;
  onClose: () => void;
  onSuccess: (createdId?: string) => void;
  navigationData?: NavigationData | null;
  onNavigate?: (spotId: string) => void;
};

export default function ShachuHakuForm({
  spot,
  onClose,
  onSuccess,
  navigationData,
  onNavigate,
}: ShachuHakuFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [missingFields, setMissingFields] = useState<MissingFields>({
    empty: [],
    unchecked: [],
  });
  const isEdit = !!spot?._id;

  // カスタムフックを使用
  const { checkMissingFields } = useCheckMissingFields();

  // Ref to store scroll position
  const cardRef = useRef<HTMLDivElement>(null);

  // Use scroll restoration hook
  const { saveScrollPosition } = useScrollRestoration(
    cardRef,
    'admin-spot-scroll',
    [spot?.name, spot?.prefecture]
  );

  // Save scroll position and navigate
  const handleNavigateWithScroll = (spotId: string) => {
    saveScrollPosition();
    if (onNavigate) {
      onNavigate(spotId);
    }
  };


  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ShachuHakuFormData>({
    resolver: zodResolver(
      isEdit ? ShachuHakuFormEditSchema : ShachuHakuFormCreateSchema
    ),
    defaultValues: {
      name: '',
      lat: '',
      lng: '',
      prefecture: '',
      address: '',
      url: '',
      type: undefined,
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
        nearbyToiletLat:
          spot.nearbyToiletCoordinates &&
          spot.nearbyToiletCoordinates.length >= 2
            ? spot.nearbyToiletCoordinates[1].toString()
            : '',
        nearbyToiletLng:
          spot.nearbyToiletCoordinates &&
          spot.nearbyToiletCoordinates.length >= 2
            ? spot.nearbyToiletCoordinates[0].toString()
            : '',
        nearbyConvenienceLat:
          spot.nearbyConvenienceCoordinates &&
          spot.nearbyConvenienceCoordinates.length >= 2
            ? spot.nearbyConvenienceCoordinates[1].toString()
            : '',
        nearbyConvenienceLng:
          spot.nearbyConvenienceCoordinates &&
          spot.nearbyConvenienceCoordinates.length >= 2
            ? spot.nearbyConvenienceCoordinates[0].toString()
            : '',
        nearbyBathLat:
          spot.nearbyBathCoordinates && spot.nearbyBathCoordinates.length >= 2
            ? spot.nearbyBathCoordinates[1].toString()
            : '',
        nearbyBathLng:
          spot.nearbyBathCoordinates && spot.nearbyBathCoordinates.length >= 2
            ? spot.nearbyBathCoordinates[0].toString()
            : '',
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
        notes: spot.notes || '',
      };
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
      // type は defaultValues の undefined のまま（useAutoSetSpotTypeが動作できるように）
    } else {
      // 新規作成（ボタンクリック）の場合はデフォルト値にリセット
      reset({
        name: '',
        lat: '',
        lng: '',
        prefecture: '',
        address: '',
        url: '',
        type: undefined,
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
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spot]);

  const handleFormSubmit = async (data: ShachuHakuFormData) => {
    // 未入力項目をチェック
    const missing = checkMissingFields(data);

    // 未入力項目がある場合は確認ダイアログを表示
    if (missing.empty.length > 0 || missing.unchecked.length > 0) {
      setMissingFields(missing);
      setShowConfirmDialog(true);
      return;
    }

    // 未入力項目がない場合は直接送信
    await submitForm(data);
  };

  const submitForm = async (data: ShachuHakuFormData) => {
    try {
      setLoading(true);
      setShowConfirmDialog(false); // ダイアログを閉じる

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
      if (
        data.distanceToConvenience &&
        data.distanceToConvenience.trim() !== ''
      ) {
        formData.append('distanceToConvenience', data.distanceToConvenience);
      }
      if (data.elevation && data.elevation.trim() !== '') {
        formData.append('elevation', data.elevation);
      }

      // Handle nearby coordinates
      if (
        data.nearbyToiletLat &&
        data.nearbyToiletLng &&
        data.nearbyToiletLat.trim() !== '' &&
        data.nearbyToiletLng.trim() !== ''
      ) {
        formData.append('nearbyToiletLat', data.nearbyToiletLat);
        formData.append('nearbyToiletLng', data.nearbyToiletLng);
      }
      if (
        data.nearbyConvenienceLat &&
        data.nearbyConvenienceLng &&
        data.nearbyConvenienceLat.trim() !== '' &&
        data.nearbyConvenienceLng.trim() !== ''
      ) {
        formData.append('nearbyConvenienceLat', data.nearbyConvenienceLat);
        formData.append('nearbyConvenienceLng', data.nearbyConvenienceLng);
      }
      if (
        data.nearbyBathLat &&
        data.nearbyBathLng &&
        data.nearbyBathLat.trim() !== '' &&
        data.nearbyBathLng.trim() !== ''
      ) {
        formData.append('nearbyBathLat', data.nearbyBathLat);
        formData.append('nearbyBathLng', data.nearbyBathLng);
      }

      // 新評価システム（客観的データ）
      formData.append('securityHasGate', data.securityHasGate.toString());
      formData.append(
        'securityHasLighting',
        data.securityHasLighting.toString()
      );
      formData.append('securityHasStaff', data.securityHasStaff.toString());
      formData.append(
        'nightNoiseHasNoiseIssues',
        data.nightNoiseHasNoiseIssues.toString()
      );
      formData.append(
        'nightNoiseNearBusyRoad',
        data.nightNoiseNearBusyRoad.toString()
      );
      formData.append(
        'nightNoiseIsQuietArea',
        data.nightNoiseIsQuietArea.toString()
      );

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

      let createdId: string | undefined;

      if (isEdit) {
        await updateCampingSpot(spot._id, formData);
      } else {
        const result = await createCampingSpot(formData);
        if (result.success && result.id) {
          createdId = result.id;
        }
      }

      // スポット作成/更新成功後にキャッシュをクリア
      await clearShachuHakuCache();

      onSuccess(createdId);
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

      // スポット削除成功後にキャッシュをクリア
      await clearShachuHakuCache();

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
      <Card className='w-full max-w-4xl max-h-[90vh] flex flex-col'>
        <CardHeader className='shrink-0'>
          <CardTitle>
            {isEdit ? '車中泊スポット編集' : '車中泊スポット作成'}
          </CardTitle>
        </CardHeader>
        <CardContent ref={cardRef} className='overflow-auto flex-1'>
          <form
            onSubmit={handleSubmit(handleFormSubmit)}
            onKeyDown={(e) => {
              // Enterキーでの送信を無効化（textareaでの改行は許可）
              if (
                e.key === 'Enter' &&
                (e.target as HTMLElement).tagName !== 'TEXTAREA'
              ) {
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
          </form>
        </CardContent>

        {/* Footer with all action buttons */}
        <CardFooter className='flex flex-col gap-3 border-t pt-4 shrink-0'>
          {/* Navigation buttons */}
          {navigationData && onNavigate && (
            <div className='flex items-center justify-center gap-2 w-full'>
              <Button
                variant='outline'
                size='sm'
                disabled={!navigationData.prevId}
                onClick={() =>
                  navigationData.prevId &&
                  handleNavigateWithScroll(navigationData.prevId)
                }
                className='cursor-pointer'
              >
                <ChevronLeft className='w-4 h-4 mr-1' />
                前のスポット
              </Button>
              <span className='text-sm text-gray-600 dark:text-gray-400 px-2'>
                {navigationData.currentIndex + 1} / {navigationData.total}
              </span>
              <Button
                variant='outline'
                size='sm'
                disabled={!navigationData.nextId}
                onClick={() =>
                  navigationData.nextId &&
                  handleNavigateWithScroll(navigationData.nextId)
                }
                className='cursor-pointer'
              >
                次のスポット
                <ChevronRight className='w-4 h-4 ml-1' />
              </Button>
            </div>
          )}

          {/* Action buttons */}
          <div className='flex justify-end gap-2 w-full'>
            <Button
              type='button'
              variant='outline'
              onClick={onClose}
              className='cursor-pointer'
            >
              <ArrowLeft className='w-4 h-4 mr-2' />
              戻る
            </Button>
            {isEdit && (
              <Button
                type='button'
                variant='destructive'
                onClick={() => setShowDeleteConfirm(true)}
                disabled={loading}
                className='cursor-pointer'
              >
                <Trash2 className='w-4 h-4 mr-2' />
                削除
              </Button>
            )}
            <Button
              type='submit'
              disabled={loading}
              className='cursor-pointer'
              onClick={handleSubmit(handleFormSubmit)}
            >
              <Save className='w-4 h-4 mr-2' />
              {loading ? '保存中...' : isEdit ? '更新' : '作成'}
            </Button>
          </div>
        </CardFooter>
      </Card>

      {showDeleteConfirm && (
        <DeleteConfirmDialog
          spot={spot}
          loading={loading}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}

      {/* 未入力項目確認ダイアログ */}
      <MissingFieldsConfirmDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        missingFields={missingFields}
        loading={loading}
        onConfirm={() => {
          const data = watch();
          submitForm(data);
        }}
        isEdit={isEdit}
      />
    </div>
  );
}
