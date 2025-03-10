import React from 'react';
import styles from '../styles/ItineraryToc.module.css';
import { ClientItineraryInput } from '@/data/schemas';
type DayType = ClientItineraryInput['dayPlans'][number];

type Props = {
  days: DayType[];
  selectedDay: number;
  setSelectedDay: (day: number) => void;
};

const ItineraryToc: React.FC<Props> = ({
  days,
  selectedDay,
  setSelectedDay,
}) => {
  const getDayOfWeek = (date: Date): string => {
    const dayOfWeekStr = ['日', '月', '火', '水', '木', '金', '土'][
      date.getDay()
    ];
    return dayOfWeekStr;
  };

  return (
    <div className={styles.container}>
      <h2>旅程</h2>
      <ul>
        {days.map((day, index) => (
          <li key={index}>
            <button
              className={`${styles.dayButton} ${
                selectedDay === index ? styles.selected : ''
              }`}
              onClick={() => setSelectedDay(index)}
            >
              {index + 1}日目
              {day.date
                ? `: ${day.date.toLocaleDateString()} (${getDayOfWeek(
                    day.date
                  )})`
                : ''}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ItineraryToc;
