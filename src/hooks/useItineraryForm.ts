import { useEffect, useState } from 'react';
import {
  useForm,
  useWatch,
  type FieldErrors,
  type Resolver,
} from 'react-hook-form';
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
import { capture } from '@/lib/analytics';

// onInvalidでエラー構造を辿るための簡易型（react-hook-formのFieldErrorsは深いネストの型解決が複雑なため）
type ActivityFieldError = {
  title?: unknown;
  url?: unknown;
  place?: { location?: { latitude?: unknown } };
};

type DayPlanFieldError = {
  activities?: Record<string, ActivityFieldError | undefined>;
};

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
    data: ClientItineraryInput,
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

  // フォーム初期化（startDateのISO形式をYYYY-MM-DDに正規化）
  const defaultValues = initialData
    ? {
        ...initialData,
        startDate: initialData.startDate?.includes('T')
          ? initialData.startDate.split('T')[0]
          : initialData.startDate,
      }
    : DEFAULT_ITINERARY;

  // zod 4 + @hookform/resolvers 5 では default 等によりスキーマの入力型と出力型が
  // 分離する。本フォームはコンポーネントツリー全体でフィールド値の型として出力型
  // (ClientItineraryInput) を前提としているため、resolver を出力型へキャストして
  // 既存の型注釈との整合を保つ（defaultValues で全フィールドを与えるため実行時は安全）。
  const methods = useForm<ClientItineraryInput>({
    resolver: zodResolver(
      clientItinerarySchema,
    ) as unknown as Resolver<ClientItineraryInput>,
    defaultValues,
    mode: 'onSubmit',
  });

  const {
    formState: { errors },
    watch,
    setValue,
    getValues,
    trigger,
    handleSubmit,
  } = methods;

  const startDateValue = useWatch({
    control: methods.control,
    name: 'startDate',
  });
  const numberOfDaysValue = useWatch({
    control: methods.control,
    name: 'numberOfDays',
  });

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
    const dayCount = numberOfDaysValue || 0;

    trigger(['startDate', 'numberOfDays']);

    // 現在のフォーム状態を取得してアクティビティ等を保持する
    const currentDayPlans = getValues('dayPlans') || [];

    const newDayPlans = Array.from({ length: dayCount }, (_, index) => {
      // フォームの既存データを優先し、なければ initialData にフォールバック
      const currentDayPlan = currentDayPlans[index];
      const fallbackDayPlan = initialData?.dayPlans?.[index];
      const activities =
        currentDayPlan?.activities ?? fallbackDayPlan?.activities ?? [];
      const notes = currentDayPlan?.notes ?? fallbackDayPlan?.notes ?? '';

      if (startDateValue) {
        const currentDate = new Date(startDateValue);
        currentDate.setDate(currentDate.getDate() + index);
        return {
          dayIndex: index,
          date: currentDate.toISOString().split('T')[0],
          activities,
          notes,
        };
      }
      return {
        date: null,
        dayIndex: index,
        activities,
        notes,
      };
    });

    setValue('dayPlans', newDayPlans);
  }, [
    startDateValue,
    numberOfDaysValue,
    setValue,
    initialData,
    trigger,
    getValues,
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

        if (isCreating) {
          capture('itinerary_created');
        } else if (values.isPublic && !initialData?.isPublic) {
          // 非公開→公開への切り替え時のみ計測
          capture('itinerary_published');
        }

        if (isCreating && result.id) {
          router.push(`/itineraries/${result.id}/edit`);
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

  const onInvalid = (errors: FieldErrors<ClientItineraryInput>) => {
    const messages: string[] = [];

    // dayPlans のエラーを解析して分かりやすいメッセージに変換
    if (errors.dayPlans) {
      const dayPlanErrors = errors.dayPlans as unknown as Record<
        string,
        DayPlanFieldError | undefined
      >;
      Object.entries(dayPlanErrors).forEach(
        ([dayIdx, dayError]) => {
          const day = Number(dayIdx) + 1;
          if (dayError?.activities) {
            Object.entries(dayError.activities).forEach(
              ([actIdx, actError]) => {
                const act = Number(actIdx) + 1;
                const field = actError?.title
                  ? 'タイトル'
                  : actError?.url
                    ? 'URL'
                    : actError?.place?.location?.latitude
                      ? '座標'
                      : '入力値';
                messages.push(
                  `${day}日目 アクティビティ${act}: ${field}に問題があります`,
                );
              },
            );
          }
        },
      );
    }

    // dayPlans 以外のトップレベルエラー
    Object.keys(errors).forEach((key) => {
      if (key !== 'dayPlans') {
        const label: Record<string, string> = {
          title: 'タイトル',
          numberOfDays: '日数',
          startDate: '開始日',
          owner: '所有者情報',
        };
        messages.push(`「${label[key] ?? key}」に問題があります`);
      }
    });

    toast({
      title: '入力内容を確認してください',
      description:
        messages.length > 0
          ? messages.join('\n')
          : '必須項目が入力されているかご確認ください。',
      variant: 'destructive',
    });
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
      }, onInvalid)();
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
      }, onInvalid)();
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
