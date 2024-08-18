import { Itinerary } from '@/data/types/itinerary';
import { PlaceTypeBadge, PlaceType } from '@/components/PlaceTypeBadge';
import { TimeRangeDisplay } from '@/components/TimeRangeDisplay';

type AcitivityType = Itinerary['dayPlans'][number]['activities'][number];
type ActivityProps = {
  activity: AcitivityType;
};

export const Activity: React.FC<ActivityProps> = ({ activity }) => (
  <li className='bg-card text-card-foreground p-3 rounded shadow-md dark:shadow-slate-500/50'>
    <div className='flex'>
      <p className='font-medium'>{activity.title}</p>
      <TimeRangeDisplay
        startTime={activity.startTime}
        endTime={activity.endTime}
      />
    </div>
    <div className='flex items-center gap-2 mt-1'>
      <PlaceTypeBadge type={activity.place.type as PlaceType} />
      {activity.place.name}
    </div>
    {activity.description && (
      <div className='text-sm mt-1'>{activity.description}</div>
    )}
  </li>
);
