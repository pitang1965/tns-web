import { ServerItineraryDocument } from '@/data/schemas/itinerarySchema';
import { PlaceView } from './PlaceView';
import { TimeRangeDisplay } from '@/components/TimeRangeDisplay';

type AcitivityType =
  ServerItineraryDocument['dayPlans'][number]['activities'][number];
type ActivityProps = {
  activity: AcitivityType;
};

export const ActivityView: React.FC<ActivityProps> = ({ activity }) => (
  <li className='bg-card text-card-foreground p-3 rounded shadow-md dark:shadow-slate-500/50'>
    <div className='flex'>
      <p className='font-medium'>{activity.title}</p>
      <TimeRangeDisplay
        startTime={activity.startTime}
        endTime={activity.endTime}
      />
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
