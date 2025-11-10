'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/components/ui/use-toast';
import { X, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  CampingSpotSubmissionWithId,
  CampingSpotType,
} from '@/data/schemas/campingSpot';
import { createCampingSpot } from '../../app/actions/campingSpots';
import { approveSubmissionWithoutCreating } from '../../app/actions/campingSpotSubmissions';
import { ShachuHakuFormEditSchema, ShachuHakuFormData } from './validationSchemas';
import { BasicInfoFields } from './BasicInfoFields';
import { PricingFields } from './PricingFields';
import { RatingFields } from './RatingFields';
import { FeatureFields } from './FeatureFields';
import { NearbyFacilityFields } from './NearbyFacilityFields';
import { FacilitiesMap } from './FacilitiesMap';

type SubmissionEditFormProps = {
  submission: CampingSpotSubmissionWithId;
  onClose: () => void;
  onSuccess: () => void;
}

export default function SubmissionEditForm({
  submission,
  onClose,
  onSuccess,
}: SubmissionEditFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ShachuHakuFormData>({
    resolver: zodResolver(ShachuHakuFormEditSchema),
    defaultValues: {
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
      securityHasGate: false,
      securityHasLighting: false,
      securityHasStaff: false,
      nightNoiseHasNoiseIssues: false,
      nightNoiseNearBusyRoad: false,
      nightNoiseIsQuietArea: false,
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

  // 投稿データをフォームに設定
  useEffect(() => {
    if (submission) {
      const formValues = {
        name: submission.name,
        lat: submission.coordinates ? submission.coordinates[1].toString() : '',
        lng: submission.coordinates ? submission.coordinates[0].toString() : '',
        prefecture: submission.prefecture,
        address: submission.address || '',
        url: submission.url || '',
        type: submission.type,
        distanceToToilet: '', // 投稿データにはないので空文字
        distanceToBath: '', // 投稿データにはないので空文字
        distanceToConvenience: '', // 投稿データにはないので空文字
        nearbyToiletLat: '',
        nearbyToiletLng: '',
        nearbyConvenienceLat: '',
        nearbyConvenienceLng: '',
        nearbyBathLat: '',
        nearbyBathLng: '',
        elevation: '',
        securityHasGate: false,
        securityHasLighting: false,
        securityHasStaff: false,
        nightNoiseHasNoiseIssues: false,
        nightNoiseNearBusyRoad: false,
        nightNoiseIsQuietArea: false,
        quietnessLevel: '3', // デフォルト値
        securityLevel: '3', // デフォルト値
        overallRating: '3', // デフォルト値
        hasRoof: submission.hasRoof,
        hasPowerOutlet: submission.hasPowerOutlet,
        isFree: submission.isFree,
        pricePerNight: submission.pricePerNight?.toString() || '',
        priceNote: submission.priceNote || '',
        capacity: '',
        capacityLarge: '',
        restrictions: '',
        amenities: '',
        notes: submission.notes || '',
      };
      reset(formValues);
    }
  }, [submission, reset]);

  const onSubmit = async (data: ShachuHakuFormData) => {
    try {
      setLoading(true);
      console.log('SubmissionEditForm: Starting submission process', data);

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

      // 1. 車中泊スポットを作成
      console.log('SubmissionEditForm: Creating camping spot...');
      await createCampingSpot(formData);
      console.log('SubmissionEditForm: Camping spot created successfully');

      // 2. 投稿を承認済みにする（スポット作成は行わない）
      console.log('SubmissionEditForm: Approving submission...');
      await approveSubmissionWithoutCreating(submission._id, `編集後に承認: ${data.name}`);
      console.log('SubmissionEditForm: Submission approved successfully');

      console.log('SubmissionEditForm: Calling onSuccess...');
      onSuccess();
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: 'エラー',
        description: '車中泊スポットの作成と承認に失敗しました',
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
          <CardTitle>投稿の編集と承認</CardTitle>
          <Button variant='outline' size='sm' onClick={onClose} className='cursor-pointer'>
            <X className='w-4 h-4' />
          </Button>
        </CardHeader>
        <CardContent>
          <div className='mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg'>
            <h3 className='font-medium text-blue-800 dark:text-blue-200 mb-2'>
              投稿情報の編集
            </h3>
            <p className='text-sm text-blue-700 dark:text-blue-300'>
              この画面では投稿された車中泊スポットの情報を確認・編集し、不足している情報を追加できます。
              「承認して作成」ボタンをクリックすると、車中泊スポットとして公開され、投稿が承認済みになります。
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
            <BasicInfoFields
              spot={null}
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

            <RatingFields register={register} errors={errors} watch={watch} />

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
              <Button
                type='submit'
                disabled={loading}
                className='bg-green-600 hover:bg-green-700 cursor-pointer'
              >
                <Save className='w-4 h-4 mr-2' />
                {loading ? '処理中...' : '承認して作成'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
