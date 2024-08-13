import { Itinerary } from '@/data/types/itinerary';
import { PlaceTypeBadge, PlaceType } from '@/components/PlaceTypeBadge';
import { ActivityTimeDisplay } from '@/components/ActivityTimeDisplay';

type ActivityItemProps = {
  activity: Itinerary['dayPlans'][0]['activities'][0];
}

export const ActivityItem: React.FC<ActivityItemProps> = ({ activity }) => (
  <li className='bg-white p-3 rounded shadow'>
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
