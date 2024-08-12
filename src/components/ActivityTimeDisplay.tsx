import React from 'react';

type ActivityTimeDisplayProps = {
  startTime?: string;
  endTime?: string;
};

export const ActivityTimeDisplay: React.FC<ActivityTimeDisplayProps> = ({
  startTime,
  endTime,
}) => {
  const formatTime = (time: string) => {
    // TODO: ここで時間のフォーマットを調整。例: "14:30" -> "14:30"
    return time;
  };

  const renderTimeInfo = () => {
    if (startTime && endTime) {
      return (
        <span className='ml-2 text-sm text-gray-600'>
          {formatTime(startTime)} ～ {formatTime(endTime)}
        </span>
      );
    } else if (startTime) {
      return (
        <span className='ml-2 text-sm text-gray-600'>
          開始: {formatTime(startTime)}
        </span>
      );
    } else if (endTime) {
      return (
        <span className='ml-2 text-sm text-gray-600'>
          終了: {formatTime(endTime)}
        </span>
      );
    }
    return null;
  };

  return <p className='font-medium'>{renderTimeInfo()}</p>;
};
