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
import { useFormAutoSave } from '@/hooks/useFormAutoSave';
import { useFormSubmit } from '@/hooks/useFormSubmit';
import {
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
import { deleteCampingSpot } from '../../app/actions/campingSpots/admin';
import {
  ShachuHakuFormCreateSchema,
  ShachuHakuFormEditSchema,
  ShachuHakuFormData,
} from './validationSchemas';
import { BasicInfoFields } from './BasicInfoFields';
import { PricingFields } from './PricingFields';
import { ShachuHakuDetailFields } from './ShachuHakuDetailFields';
import { NearbyFacilityFields } from './NearbyFacilityFields';
import { FacilitiesMap } from './FacilitiesMap';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import { MissingFieldsConfirmDialog } from './MissingFieldsConfirmDialog';
import { CloseConfirmDialog } from './CloseConfirmDialog';
import { DEFAULT_FORM_VALUES, AUTO_SAVE_KEY } from '@/constants/formDefaults';
import { convertSpotToFormValues } from '@/lib/utils/spotFormUtils';

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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showCloseConfirmDialog, setShowCloseConfirmDialog] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
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
    defaultValues: DEFAULT_FORM_VALUES,
  });

  // フォーム自動保存フック
  const { clearStorage, checkHasFormInput } = useFormAutoSave({
    watch,
    reset,
    setValue,
    isEdit,
    toast,
  });

  // フォーム送信フック
  const { submitForm, loading } = useFormSubmit({
    isEdit,
    spot,
    toast,
    onSuccess,
    setShowConfirmDialog,
  });

  // コンポーネントマウント時とspotが変わった時にフォームの値を設定
  useEffect(() => {
    if (spot && spot._id) {
      // 編集モード：spotの値でフォームを初期化
      // 念のためLocalStorageをクリア（親コンポーネントでもクリアしているが、防御的に）
      clearStorage();

      const formValues = convertSpotToFormValues(spot);
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
    }
    // 新規作成（ボタンクリック）の場合は、useFormAutoSaveフックで自動的に復元される
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spot]);

  // フォームの値が変更されたときの自動保存は、useFormAutoSaveフックで処理される

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

  // submitForm関数はuseFormSubmitフックで提供される

  const handleDelete = async () => {
    if (!spot?._id) return;

    try {
      setDeleteLoading(true);
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
      setDeleteLoading(false);
    }
  };

  // 「戻る」ボタンのハンドラー
  const handleClose = () => {
    // 編集モードの場合はそのまま閉じる
    if (isEdit) {
      onClose();
      return;
    }

    // 新規作成モードの場合、入力内容があるかチェック
    const hasInput = checkHasFormInput();

    if (hasInput) {
      // 入力がある場合は確認ダイアログを表示
      setShowCloseConfirmDialog(true);
    } else {
      // 入力がない場合はそのまま閉じる（下書きも削除）
      clearStorage();
      onClose();
    }
  };

  // 閉じることを確認
  const confirmClose = () => {
    // 下書きを削除して閉じる
    clearStorage();
    setShowCloseConfirmDialog(false);
    onClose();
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

            <ShachuHakuDetailFields
              register={register}
              watch={watch}
              setValue={setValue}
              errors={errors}
              spot={spot}
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
              onClick={handleClose}
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
                disabled={deleteLoading || loading}
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
          loading={deleteLoading}
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

      {/* 閉じる確認ダイアログ */}
      <CloseConfirmDialog
        open={showCloseConfirmDialog}
        onOpenChange={setShowCloseConfirmDialog}
        onConfirm={confirmClose}
      />
    </div>
  );
}
