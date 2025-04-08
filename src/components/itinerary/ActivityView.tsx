import { ServerItineraryDocument } from '@/data/schemas/itinerarySchema';
import { PlaceView } from './PlaceView';
import { TimeRangeDisplay } from '@/components/common/TimeRangeDisplay';
import { H3, Text } from '@/components/common/Typography';

type ActivityType =
  ServerItineraryDocument['dayPlans'][number]['activities'][number];

type ActivityProps = {
  activity: ActivityType;
  index?: number; // 活動の順番（0から始まる）- オプショナル
  total?: number; // その日の活動の総数 - オプショナル
};

export const ActivityView: React.FC<ActivityProps> = ({
  activity,
  index,
  total,
}) => {
  // indexとtotalが両方提供された場合のみ、番号表示を追加
  const titlePrefix =
    index !== undefined && total !== undefined ? `${index + 1}/${total}: ` : '';

  return (
    <li className='bg-card text-card-foreground p-3 rounded shadow-md dark:shadow-slate-500/50'>
      <div className='flex'>
        <H3>
          {titlePrefix}
          {activity.title}
        </H3>
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
        <Text>{activity.description}</Text>
      )}
    </li>
  );
};
