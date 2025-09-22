'use client';

import { BarChart, MapPin, Calendar, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { ClientItineraryDocument } from '@/data/schemas/itinerarySchema';

type UserStatsProps = {
  itineraries: ClientItineraryDocument[];
};

export default function UserStats({ itineraries }: UserStatsProps) {
  // 統計計算
  const totalItineraries = itineraries.length;
  const publicItineraries = itineraries.filter((i) => i.isPublic).length;
  const totalDays = itineraries.reduce((sum, i) => sum + i.numberOfDays, 0);
  const totalActivities = itineraries.reduce(
    (sum, i) =>
      sum +
      i.dayPlans.reduce((daySum, day) => daySum + day.activities.length, 0),
    0
  );

  const stats = [
    {
      title: '作成した旅程',
      value: totalItineraries,
      icon: BarChart,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      title: '公開中の旅程',
      value: publicItineraries,
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      title: '総旅行日数',
      value: totalDays,
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    },
    {
      title: '登録スポット',
      value: totalActivities,
      icon: MapPin,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    },
  ];

  return (
    <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title}>
            <CardContent className='p-4'>
              <div className='flex items-center space-x-2'>
                <div className={`p-2 rounded-md ${stat.bgColor}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
                <div>
                  <p className='text-2xl font-bold'>{stat.value}</p>
                  <p className='text-xs text-muted-foreground'>{stat.title}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
