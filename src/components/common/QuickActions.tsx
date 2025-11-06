'use client';

import Link from 'next/link';
import { Plus, Search, MapPin, Zap, BookHeart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function QuickActions() {
  const actions = [
    {
      title: '新しい旅程を作成',
      description: 'あなたの次の旅行を計画しましょう',
      href: '/itineraries/new',
      icon: Plus,
      color: 'bg-blue-500 hover:bg-blue-600',
      textColor: 'text-white',
    },
    {
      title: '旅程を探す',
      description: '他のユーザーの公開旅程を探索',
      href: '/search',
      icon: Search,
      color: 'bg-emerald-500 hover:bg-emerald-600',
      textColor: 'text-white',
    },
    {
      title: '車中泊スポット',
      description: '全国の車中泊スポットを探す',
      href: '/shachu-haku',
      icon: MapPin,
      color: 'bg-purple-500 hover:bg-purple-600',
      textColor: 'text-white',
    },
    {
      title: 'あなたの旅程',
      description: 'あなたの旅程一覧を見る',
      href: '/itineraries',
      icon: BookHeart,
      color: 'bg-orange-500 hover:bg-orange-600',
      textColor: 'text-white',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Zap size={20} />
          クイックアクション
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.href} href={action.href}>
                <Button
                  variant='ghost'
                  className={`w-full h-auto p-4 flex flex-col items-start space-y-2 ${action.color} ${action.textColor} hover:scale-105 transition-all duration-200 cursor-pointer`}
                >
                  <div className='flex items-center gap-2 w-full'>
                    <Icon size={20} />
                    <span className='font-medium'>{action.title}</span>
                  </div>
                  <p className='text-sm opacity-90 text-left'>
                    {action.description}
                  </p>
                </Button>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
