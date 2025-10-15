import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import {
  clientItinerarySchema,
  ClientItineraryInput,
  ClientItineraryDocument,
} from '@/data/schemas/itinerarySchema';
import { useSyncFormWithJotai } from '@/hooks/useSyncFormWithJotai';
import { itineraryMetadataAtom } from '@/data/store/itineraryAtoms';

const DEFAULT_ITINERARY = {
  title: '',
  description: '',
  startDate: undefined,
  numberOfDays: 1,
  isPublic: false,
  dayPlans: [],
  sharedWith: [],
};

type UseItineraryFormProps = {
  initialData?: ClientItineraryDocument & { _id?: string };
  onSubmit: (
    data: ClientItineraryInput
  ) => Promise<{ success: boolean; id?: string; error?: string }>;
  submitLabel: string;
  isSubmitting: boolean;
};

export function useItineraryForm({
  initialData,
  onSubmit,
  submitLabel,
  isSubmitting,
}: UseItineraryFormProps) {
  const router = useRouter();
  const { toast } = useToast();

  // 状態管理
  const [isSaving, setIsSaving] = useState(false);
  const [formModified, setFormModified] = useState(false);

  const isCreating = submitLabel === '作成';

  // フォーム初期化
  const methods = useForm<ClientItineraryInput>({
    resolver: zodResolver(clientItinerarySchema),
    defaultValues: initialData || DEFAULT_ITINERARY,
    mode: 'onSubmit',
  });

  const {
    formState: { errors },
    watch,
    setValue,
    trigger,
    handleSubmit,
  } = methods;

  // Jotaiとの同期
  useSyncFormWithJotai(methods, itineraryMetadataAtom, initialData);

  // フォーム初期化後にダーティフラグをリセット
  useEffect(() => {
    const timer = setTimeout(() => {
      setFormModified(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  // 日付の監視と dayPlans の自動生成
  useEffect(() => {
    const startDate = watch('startDate');
    const numberOfDays = watch('numberOfDays');
    const dayCount = numberOfDays || 0;

    trigger(['startDate', 'numberOfDays']);

    const newDayPlans = Array.from({ length: dayCount }, (_, index) => {
      const existingDayPlan = initialData?.dayPlans?.[index];
      if (startDate) {
        const currentDate = new Date(startDate);
        currentDate.setDate(currentDate.getDate() + index);
        return {
          dayIndex: index,
          date: currentDate.toISOString().split('T')[0],
          activities: existingDayPlan?.activities || [],
          notes: existingDayPlan?.notes || '',
        };
      }
      return {
        date: null,
        dayIndex: index,
        activities: existingDayPlan?.activities || [],
        notes: existingDayPlan?.notes || '',
      };
    });

    setValue('dayPlans', newDayPlans);
  }, [
    watch('startDate'),
    watch('numberOfDays'),
    setValue,
    initialData,
    trigger,
  ]);

  // フォーム送信処理
  const handleFormSubmit = async (values: ClientItineraryInput) => {
    try {
      const result = await onSubmit(values);
      if (!result) {
        toast({
          title: '操作に失敗しました',
          description: 'サーバーからの応答がありませんでした。',
          variant: 'destructive',
        });
        return;
      }
      if (result.success) {
        toast({
          title: '操作が完了しました',
          description: '正常に保存されました',
          variant: 'default',
        });

        if (isCreating && result.id) {
          router.push(`/itineraries/${result.id}`);
        }
      } else {
        toast({
          title: '操作に失敗しました',
          description: result.error,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error in form submission:', error);
      toast({
        title: '操作に失敗しました',
        description:
          error instanceof Error ? error.message : '未知のエラーが発生しました',
        variant: 'destructive',
      });
    }
  };

  // ボタンハンドラー
  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsSaving(true);
    try {
      await handleSubmit(async (data) => {
        console.log('更新ボタンがクリックされました。データ:', data);
        setFormModified(false);
        await handleFormSubmit(data);
      })();
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreate = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsSaving(true);
    try {
      await handleSubmit(async (data) => {
        setFormModified(false);
        console.log('作成ボタンがクリックされました。データ:', data);
        await handleFormSubmit(data);
      })();
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = () => {
    setFormModified(true);
  };

  return {
    methods,
    errors,
    watch,
    setValue,
    isSaving,
    formModified,
    setFormModified,
    isCreating,
    handleSave,
    handleCreate,
    handleInputChange,
    isSubmitting: isSubmitting || isSaving,
  };
}
