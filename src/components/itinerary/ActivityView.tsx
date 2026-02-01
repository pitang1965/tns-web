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
  // 複数経由地ルート検索用のプロパティ
  allActivities?: ActivityType[];
  isOwner?: boolean; // 所有者かどうか（自宅の座標・住所表示制御用）
};

export const ActivityView: React.FC<ActivityProps> = ({
  activity,
  index,
  total,
  allActivities,
  isOwner = false,
}) => {
  // indexとtotalが両方提供された場合のみ、番号表示を追加
  const titlePrefix =
    index !== undefined && total !== undefined ? `${index + 1}/${total}: ` : '';

  return (
    <li className='bg-card text-card-foreground p-3 rounded shadow-md dark:shadow-slate-500/50'>
      <div>
        <H3>
          {titlePrefix}
          {activity.title}
        </H3>
        <div className='flex items-baseline gap-1 mt-1'>
          <TimeRangeDisplay
            startTime={activity.startTime ?? undefined}
            endTime={activity.endTime ?? undefined}
            className='ml-0'
          />
          {activity.cost !== null && activity.cost !== undefined && (
            <span className='text-gray-600 dark:text-gray-400 text-sm'>
              ({activity.cost > 0 ? `${activity.cost}円` : '無料'})
            </span>
          )}
        </div>
      </div>
      <PlaceView
        name={activity.place.name}
        type={activity.place.type}
        address={activity.place.address}
        location={activity.place.location}
        allActivities={allActivities}
        currentActivityIndex={index}
        url={activity.url}
        isOwner={isOwner}
      />
      {activity.description && <Text>{activity.description}</Text>}
    </li>
  );
};
