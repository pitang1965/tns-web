import { Itinerary } from '@/data/types/itinerary';
import { PlaceTypeBadge, PlaceType } from '@/components/PlaceTypeBadge';
import { ActivityTimeDisplay } from '@/components/ActivityTimeDisplay';

type Acitivity = Itinerary['dayPlans'][number]['activities'][number];
type ActivityItemProps = {
  activity: Acitivity;
}

export const ActivityItem: React.FC<ActivityItemProps> = ({ activity }) => (
  <li className='bg-card text-card-foreground p-3 rounded shadow-md dark:shadow-slate-500/50'>
    <div className='flex'>
      <p className='font-medium'>{activity.title}</p>
      <ActivityTimeDisplay
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
