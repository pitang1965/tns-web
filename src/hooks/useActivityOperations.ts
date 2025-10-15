import { UseFormWatch, UseFormSetValue } from 'react-hook-form';
import { ClientItineraryInput } from '@/data/schemas/itinerarySchema';

type UseActivityOperationsProps = {
  watch: UseFormWatch<ClientItineraryInput>;
  setValue: UseFormSetValue<ClientItineraryInput>;
  setFormModified: (modified: boolean) => void;
};

export function useActivityOperations({
  watch,
  setValue,
  setFormModified,
}: UseActivityOperationsProps) {
  // アクティビティの追加
  const addActivity = (dayIndex: number) => {
    const currentActivities = watch(`dayPlans.${dayIndex}.activities`) || [];
    setValue(
      `dayPlans.${dayIndex}.activities`,
      [
        ...currentActivities,
        {
          id: crypto.randomUUID(),
          title: '',
          place: {
            type: 'ATTRACTION' as const,
            name: '',
            address: null,
            location: {
              latitude: undefined,
              longitude: undefined,
            },
          },
          description: '',
          startTime: '',
          endTime: '',
          cost: 0,
          url: null,
        },
      ],
      { shouldValidate: true, shouldDirty: true }
    );
  };

  // アクティビティの削除
  const removeActivity = (dayIndex: number, activityIndex: number) => {
    const currentActivities = watch(`dayPlans.${dayIndex}.activities`) || [];
    setValue(
      `dayPlans.${dayIndex}.activities`,
      currentActivities.filter((_, index) => index !== activityIndex)
    );
  };

  // 前日への移動
  const moveToPreviousDay = (dayIndex: number, activityIndex: number) => {
    if (dayIndex <= 0) return;

    const activities = watch(`dayPlans.${dayIndex}.activities`);
    if (!activities) return;

    // 移動するアクティビティを取得し、時刻情報をクリア
    const movedActivity = { ...activities[activityIndex] };
    movedActivity.startTime = null;
    movedActivity.endTime = null;

    // 現在の日からアクティビティを削除
    const newActivities = [...activities];
    newActivities.splice(activityIndex, 1);

    // 前日のアクティビティを取得
    const prevDayActivities =
      watch(`dayPlans.${dayIndex - 1}.activities`) || [];

    // 前日の末尾にアクティビティを追加
    const newPrevDayActivities = [...prevDayActivities, movedActivity];

    // フォームの値を更新
    setValue(`dayPlans.${dayIndex}.activities`, newActivities, {
      shouldValidate: true,
    });

    setValue(`dayPlans.${dayIndex - 1}.activities`, newPrevDayActivities, {
      shouldValidate: true,
    });

    setFormModified(true);
  };

  // 翌日への移動
  const moveToNextDay = (dayIndex: number, activityIndex: number) => {
    const numberOfDays = watch('numberOfDays') || 0;
    if (dayIndex >= numberOfDays - 1) return;

    const activities = watch(`dayPlans.${dayIndex}.activities`);
    if (!activities) return;

    // 移動するアクティビティを取得し、時刻情報をクリア
    const movedActivity = { ...activities[activityIndex] };
    movedActivity.startTime = null;
    movedActivity.endTime = null;

    // 現在の日からアクティビティを削除
    const newActivities = [...activities];
    newActivities.splice(activityIndex, 1);

    // 翌日のアクティビティを取得
    const nextDayActivities =
      watch(`dayPlans.${dayIndex + 1}.activities`) || [];

    // 翌日の先頭にアクティビティを追加
    const newNextDayActivities = [movedActivity, ...nextDayActivities];

    // フォームの値を更新
    setValue(`dayPlans.${dayIndex}.activities`, newActivities, {
      shouldValidate: true,
    });

    setValue(`dayPlans.${dayIndex + 1}.activities`, newNextDayActivities, {
      shouldValidate: true,
    });

    setFormModified(true);
  };

  return {
    addActivity,
    removeActivity,
    moveToPreviousDay,
    moveToNextDay,
  };
}
