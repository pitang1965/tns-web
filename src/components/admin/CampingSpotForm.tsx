'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
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

interface CampingSpotFormProps {
  spot?: CampingSpotWithId | null;
  onClose: () => void;
  onSuccess: () => void;
}

type CampingSpotFormData = {
  name: string;
  lat: number;
  lng: number;
  prefecture: string;
  address?: string;
  type: CampingSpotType;
  distanceToToilet: number;
  distanceToBath?: number;
  quietnessLevel: number;
  securityLevel: number;
  overallRating: number;
  hasRoof: boolean;
  hasPowerOutlet: boolean;
  isGatedPaid: boolean;
  isFree: boolean;
  pricePerNight?: number;
  priceNote?: string;
  capacity: number;
  restrictions: string;
  amenities: string;
  notes: string;
};

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
    formState: { errors },
  } = useForm<CampingSpotFormData>({
    // resolver: zodResolver(...), // Disabled for now to fix build issues
    defaultValues: spot
      ? {
          name: spot.name,
          lat: spot.coordinates[1],
          lng: spot.coordinates[0],
          prefecture: spot.prefecture,
          address: spot.address || '',
          type: spot.type,
          distanceToToilet: spot.distanceToToilet,
          distanceToBath: spot.distanceToBath,
          quietnessLevel: spot.quietnessLevel,
          securityLevel: spot.securityLevel,
          overallRating: spot.overallRating,
          hasRoof: spot.hasRoof,
          hasPowerOutlet: spot.hasPowerOutlet,
          isGatedPaid: spot.isGatedPaid,
          isFree: spot.pricing.isFree,
          pricePerNight: spot.pricing.pricePerNight,
          priceNote: spot.pricing.priceNote || '',
          capacity: spot.capacity,
          restrictions: spot.restrictions.join(', '),
          amenities: spot.amenities.join(', '),
          notes: spot.notes,
        }
      : {
          name: '',
          lat: 35.6895,
          lng: 139.6917,
          prefecture: '',
          address: '',
          type: 'other' as CampingSpotType,
          distanceToToilet: 0,
          quietnessLevel: 3,
          securityLevel: 3,
          overallRating: 3,
          hasRoof: false,
          hasPowerOutlet: false,
          isGatedPaid: false,
          isFree: true,
          capacity: 1,
          restrictions: '',
          amenities: '',
          notes: '',
        },
  });

  const isFree = watch('isFree');

  const onSubmit = async (data: CampingSpotFormData) => {
    try {
      setLoading(true);

      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value.toString());
        }
      });

      if (isEdit) {
        await updateCampingSpot(spot._id, formData);
      } else {
        await createCampingSpot(formData);
      }

      onSuccess();
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: 'エラー',
        description: isEdit
          ? 'スポットの更新に失敗しました'
          : 'スポットの作成に失敗しました',
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

            <div>
              <Label htmlFor='address'>住所</Label>
              <Input
                id='address'
                {...register('address')}
                placeholder='住所（任意）'
              />
            </div>

            {/* Coordinates */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <Label htmlFor='lat'>緯度 *</Label>
                <Input
                  id='lat'
                  type='number'
                  step='any'
                  {...register('lat', { valueAsNumber: true })}
                />
                {errors.lat && (
                  <p className='text-sm text-red-500'>{errors.lat.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor='lng'>経度 *</Label>
                <Input
                  id='lng'
                  type='number'
                  step='any'
                  {...register('lng', { valueAsNumber: true })}
                />
                {errors.lng && (
                  <p className='text-sm text-red-500'>{errors.lng.message}</p>
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
                <Label htmlFor='capacity'>収容台数 *</Label>
                <Input
                  id='capacity'
                  type='number'
                  min='1'
                  {...register('capacity', { valueAsNumber: true })}
                />
                {errors.capacity && (
                  <p className='text-sm text-red-500'>
                    {errors.capacity.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor='distanceToToilet'>トイレまでの距離 (m) *</Label>
                <Input
                  id='distanceToToilet'
                  type='number'
                  min='0'
                  {...register('distanceToToilet', { valueAsNumber: true })}
                />
                {errors.distanceToToilet && (
                  <p className='text-sm text-red-500'>
                    {errors.distanceToToilet.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor='distanceToBath'>入浴施設まで距離 (m)</Label>
              <Input
                id='distanceToBath'
                type='number'
                min='0'
                {...register('distanceToBath', { valueAsNumber: true })}
                placeholder='入浴施設がない場合は空欄'
              />
            </div>

            {/* Ratings */}
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <div>
                <Label htmlFor='quietnessLevel'>静けさレベル (1-5) *</Label>
                <Input
                  id='quietnessLevel'
                  type='number'
                  min='1'
                  max='5'
                  {...register('quietnessLevel', { valueAsNumber: true })}
                />
                {errors.quietnessLevel && (
                  <p className='text-sm text-red-500'>
                    {errors.quietnessLevel.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor='securityLevel'>治安レベル (1-5) *</Label>
                <Input
                  id='securityLevel'
                  type='number'
                  min='1'
                  max='5'
                  {...register('securityLevel', { valueAsNumber: true })}
                />
                {errors.securityLevel && (
                  <p className='text-sm text-red-500'>
                    {errors.securityLevel.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor='overallRating'>総合評価 (1-5) *</Label>
                <Input
                  id='overallRating'
                  type='number'
                  min='1'
                  max='5'
                  {...register('overallRating', { valueAsNumber: true })}
                />
                {errors.overallRating && (
                  <p className='text-sm text-red-500'>
                    {errors.overallRating.message}
                  </p>
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
                    id='isGatedPaid'
                    checked={watch('isGatedPaid')}
                    onCheckedChange={(checked) =>
                      setValue('isGatedPaid', !!checked)
                    }
                  />
                  <label htmlFor='isGatedPaid'>ゲート付き有料</label>
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className='space-y-4'>
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
                      {...register('pricePerNight', { valueAsNumber: true })}
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

            {/* Additional Info */}
            <div>
              <Label htmlFor='restrictions'>制限事項</Label>
              <Input
                id='restrictions'
                {...register('restrictions')}
                placeholder='制限事項をカンマ区切りで入力'
              />
            </div>

            <div>
              <Label htmlFor='amenities'>その他設備</Label>
              <Input
                id='amenities'
                {...register('amenities')}
                placeholder='その他設備をカンマ区切りで入力'
              />
            </div>

            <div>
              <Label htmlFor='notes'>備考 *</Label>
              <Textarea
                id='notes'
                {...register('notes')}
                placeholder='詳細な情報、アクセス方法、注意点など'
                rows={4}
              />
              {errors.notes && (
                <p className='text-sm text-red-500'>{errors.notes.message}</p>
              )}
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
