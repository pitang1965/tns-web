import { useFormContext } from 'react-hook-form';
import { ClientItineraryInput } from '@/data/schemas/itinerarySchema';

export const useActivityForm = (dayIndex: number, activityIndex: number) => {
  const {
    register,
    formState: { errors },
  } = useFormContext<ClientItineraryInput>();

  const basePath = `dayPlans.${dayIndex}.activities.${activityIndex}`;

  const getFieldError = (
    fieldName: keyof ClientItineraryInput['dayPlans'][number]['activities'][number]
  ) => {
    return errors?.dayPlans?.[dayIndex]?.activities?.[activityIndex]?.[
      fieldName
    ]?.message;
  };

  const getFieldRegister = (
    fieldName: keyof ClientItineraryInput['dayPlans'][number]['activities'][number]
  ) => {
    return register(
      `dayPlans.${dayIndex}.activities.${activityIndex}.${fieldName}` as any
    );
  };

  return {
    basePath,
    getFieldError,
    getFieldRegister,
    register,
    errors,
  };
};
