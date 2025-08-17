import { useFormContext } from 'react-hook-form';
import { ClientItineraryInput } from '@/data/schemas/itinerarySchema';
import { adjustTime } from '@/lib/utils/timeUtils';

export const useActivityTime = () => {
  const { getValues, setValue } = useFormContext<ClientItineraryInput>();

  const handleShiftSubsequentActivities = (
    dayIndex: number,
    activityIndex: number,
    delayMinutes: number
  ) => {
    const activities = getValues(`dayPlans.${dayIndex}.activities`);

    for (let i = activityIndex; i < activities.length; i++) {
      const activity = activities[i];

      if (activity.startTime) {
        const startTime = adjustTime(activity.startTime, delayMinutes);
        setValue(`dayPlans.${dayIndex}.activities.${i}.startTime`, startTime);
      }

      if (activity.endTime) {
        const endTime = adjustTime(activity.endTime, delayMinutes);
        setValue(`dayPlans.${dayIndex}.activities.${i}.endTime`, endTime);
      }
    }
  };

  return {
    handleShiftSubsequentActivities,
  };
};
