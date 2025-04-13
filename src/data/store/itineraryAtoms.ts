import { atom } from 'jotai';
import { ClientItineraryInput } from '@/data/schemas/itinerarySchema';

export const itineraryAtom = atom<ClientItineraryInput>({
  title: '',
  description: '',
  numberOfDays: 1,
  dayPlans: [],
  transportation: { type: 'OTHER', details: null },
  owner: {
    id: '',
    name: '',
    email: '', // 必須フィールド
  },
  isPublic: false,
  sharedWith: [],
});

// 日程を更新するための派生アトム
export const updateDayPlanAtom = atom(
  null,
  (
    get,
    set,
    { dayIndex, updatedDayPlan }: { dayIndex: number; updatedDayPlan: any }
  ) => {
    const currentItinerary = get(itineraryAtom);
    const newDayPlans = [...currentItinerary.dayPlans];
    newDayPlans[dayIndex] = {
      ...newDayPlans[dayIndex],
      ...updatedDayPlan,
    };

    set(itineraryAtom, {
      ...currentItinerary,
      dayPlans: newDayPlans,
    });
  }
);

// アクティビティを更新するための派生アトム
export const updateActivityAtom = atom(
  null,
  (
    get,
    set,
    {
      dayIndex,
      activityIndex,
      updatedActivity,
    }: { dayIndex: number; activityIndex: number; updatedActivity: any }
  ) => {
    const currentItinerary = get(itineraryAtom);
    const newDayPlans = [...currentItinerary.dayPlans];

    if (!newDayPlans[dayIndex].activities) {
      newDayPlans[dayIndex].activities = [];
    }

    const newActivities = [...newDayPlans[dayIndex].activities];
    newActivities[activityIndex] = {
      ...newActivities[activityIndex],
      ...updatedActivity,
    };

    newDayPlans[dayIndex] = {
      ...newDayPlans[dayIndex],
      activities: newActivities,
    };

    set(itineraryAtom, {
      ...currentItinerary,
      dayPlans: newDayPlans,
    });
  }
);
