'use client';

import { useState, useEffect } from 'react';
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
  lat: string;
  lng: string;
  prefecture: string;
  address?: string;
  type: CampingSpotType;
  distanceToToilet?: string;
  distanceToBath?: string;
  distanceToConvenience?: string;
  elevation?: string;
  quietnessLevel?: string;
  securityLevel?: string;
  overallRating?: string;
  hasRoof: boolean;
  hasPowerOutlet: boolean;
  hasGate: boolean;
  isFree: boolean;
  pricePerNight?: string;
  priceNote?: string;
  capacity?: string;
  restrictions: string;
  amenities: string;
  notes?: string;
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
    reset,
    formState: { errors },
  } = useForm<CampingSpotFormData>({
    // resolver: zodResolver(...), // Disabled for now to fix build issues
    defaultValues: {
      name: '',
      lat: '35.6895',
      lng: '139.6917',
      prefecture: '',
      address: '',
      type: 'other' as CampingSpotType,
      distanceToToilet: '',
      distanceToBath: '',
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

  // コンポーネントマウント時とspotが変わった時にフォームの値を設定
  useEffect(() => {
    if (spot) {
      const formValues = {
        name: spot.name,
        lat: spot.coordinates[1].toString(),
        lng: spot.coordinates[0].toString(),
        prefecture: spot.prefecture,
        address: spot.address || '',
        type: spot.type,
        distanceToToilet: spot.distanceToToilet?.toString() || '',
        distanceToBath: spot.distanceToBath?.toString() || '',
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
        notes: spot.notes || '',
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
        lat: '35.6895',
        lng: '139.6917',
        prefecture: '',
        address: '',
        type: 'other' as CampingSpotType,
        distanceToToilet: '',
        distanceToBath: '',
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
                  type='text'
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

            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <div>
                <Label htmlFor='distanceToToilet'>トイレまでの距離 (m)</Label>
                <Input
                  id='distanceToToilet'
                  type='text'
                  placeholder='距離(m)または空欄'
                  {...register('distanceToToilet')}
                />
                {errors.distanceToToilet && (
                  <p className='text-sm text-red-500'>
                    {errors.distanceToToilet.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor='distanceToConvenience'>
                  コンビニまでの距離 (m)
                </Label>
                <Input
                  id='distanceToConvenience'
                  type='text'
                  {...register('distanceToConvenience')}
                  placeholder='距離(m)または空欄'
                />
              </div>
              <div>
                <Label htmlFor='distanceToBath'>入浴施設までの距離 (m)</Label>
                <Input
                  id='distanceToBath'
                  type='text'
                  {...register('distanceToBath')}
                  placeholder='距離(m)または空欄'
                />
              </div>
            </div>
            <div>
              <Label htmlFor='elevation'>標高 (m)</Label>
              <Input
                id='elevation'
                type='text'
                {...register('elevation')}
                placeholder='標高(m)または空欄'
              />
            </div>

            {/* Ratings */}
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <div>
                <Label htmlFor='quietnessLevel'>静けさレベル (1-5)</Label>
                <Input
                  id='quietnessLevel'
                  type='text'
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
                  type='text'
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
                  type='text'
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
