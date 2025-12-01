import { useState } from 'react';
import { ShachuHakuFormData } from '@/components/admin/validationSchemas';
import { CampingSpotWithId } from '@/data/schemas/campingSpot';
import {
  createCampingSpot,
  updateCampingSpot,
} from '../app/actions/campingSpots/admin';
import { clearShachuHakuCache } from '@/lib/cacheUtils';
import { AUTO_SAVE_KEY } from '@/constants/formDefaults';
import { getErrorDetails } from '@/lib/utils/spotFormUtils';

type UseFormSubmitProps = {
  isEdit: boolean;
  spot?: CampingSpotWithId | null;
  toast: (props: {
    title: string;
    description: React.ReactNode;
    variant?: 'default' | 'destructive';
    duration?: number;
  }) => void;
  onSuccess: (createdId?: string) => void;
  setShowConfirmDialog: (show: boolean) => void;
};

/**
 * フォーム送信処理を提供するカスタムフック
 */
export function useFormSubmit({
  isEdit,
  spot,
  toast,
  onSuccess,
  setShowConfirmDialog,
}: UseFormSubmitProps): {
  submitForm: (data: ShachuHakuFormData) => Promise<void>;
  loading: boolean;
} {
  const [loading, setLoading] = useState(false);

  /**
   * フォーム送信処理
   */
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

      if (isEdit && spot?._id) {
        await updateCampingSpot(spot._id, formData);
      } else {
        const result = await createCampingSpot(formData);
        if (result.success && result.id) {
          createdId = result.id;
        }
      }

      // スポット作成/更新成功後にキャッシュをクリア
      await clearShachuHakuCache();

      // 送信成功時にLocalStorageの下書きデータをクリア
      if (!isEdit) {
        localStorage.removeItem(AUTO_SAVE_KEY);
      }

      onSuccess(createdId);
    } catch (error) {
      console.error('Save error:', error);

      // エラーの種類を判定して適切なメッセージを表示
      const { errorTitle, errorMessage, errorDetails } = getErrorDetails(
        error,
        isEdit
      );

      toast({
        title: errorTitle,
        description: (
          <div className='space-y-2'>
            <p className='font-semibold'>{errorMessage}</p>
            {errorDetails && (
              <p className='text-sm whitespace-pre-wrap'>{errorDetails}</p>
            )}
          </div>
        ),
        variant: 'destructive',
        duration: 10000, // エラーメッセージは長めに表示（10秒）
      });
    } finally {
      setLoading(false);
    }
  };

  return { submitForm, loading };
}
