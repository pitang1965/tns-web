import React from 'react';
import { Text } from '@/components/common/Typography';

type TimeRangeDisplayProps = {
  startTime?: string;
  endTime?: string;
  className?: string;
};

export const TimeRangeDisplay: React.FC<TimeRangeDisplayProps> = ({
  startTime,
  endTime,
  className = '',
}) => {
  const formatTime = (time: string) => {
    // TODO: ここで時間のフォーマットを調整。例: "14:30" -> "14:30"
    return time;
  };

  if (!startTime && !endTime) {
    return null;
  }

  let timeText = '';

  if (startTime && endTime) {
    timeText = `${formatTime(startTime)} ～ ${formatTime(endTime)}`;
  } else if (startTime) {
    timeText = `開始: ${formatTime(startTime)}`;
  } else if (endTime) {
    timeText = `終了: ${formatTime(endTime)}`;
  }

  return (
    <Text className={`text-gray-600 dark:text-gray-400 ml-2 ${className}`}>
      {timeText}
    </Text>
  );
};
