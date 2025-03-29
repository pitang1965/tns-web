import { ServerItineraryDocument } from '@/data/schemas/itinerarySchema';
import { PlaceView } from './PlaceView';
import { TimeRangeDisplay } from '@/components/common/TimeRangeDisplay';
import { H3 } from '@/components/common/Typography';

type AcitivityType =
  ServerItineraryDocument['dayPlans'][number]['activities'][number];
type ActivityProps = {
  activity: AcitivityType;
};

export const ActivityView: React.FC<ActivityProps> = ({ activity }) => (
  <li className='bg-card text-card-foreground p-3 rounded shadow-md dark:shadow-slate-500/50'>
    <div className='flex'>
      <H3>{activity.title}</H3>
      <TimeRangeDisplay
        startTime={activity.startTime ?? undefined}
        endTime={activity.endTime ?? undefined}
      />
      {activity.cost && activity.cost > 0 ? `　(${activity.cost}円)` : ''}
    </div>
    <PlaceView
      name={activity.place.name}
      type={activity.place.type}
      address={activity.place.address}
      location={activity.place.location}
    />
    {activity.description && (
      <div className='text-sm mt-1'>{activity.description}</div>
    )}
  </li>
);
