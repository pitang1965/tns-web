'use client';

import { useEffect, useState } from 'react';
import { H2, LargeText } from '@/components/common/Typography';
import { MapPin, FileText, Users } from 'lucide-react';

interface Stats {
  campingSpots: number;
  itineraries: number;
  submissions: number;
}

export default function StatsSection() {
  const [stats, setStats] = useState<Stats>({
    campingSpots: 0,
    itineraries: 0,
    submissions: 0,
  });
  const [displayStats, setDisplayStats] = useState<Stats>({
    campingSpots: 0,
    itineraries: 0,
    submissions: 0,
  });
  const [isVisible, setIsVisible] = useState(false);

  // Fetch stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/stats');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    };

    fetchStats();
  }, []);

  // Intersection Observer for animation trigger
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    const element = document.getElementById('stats-section');
    if (element) {
      observer.observe(element);
    }

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, []);

  // Count-up animation
  useEffect(() => {
    if (!isVisible) return;

    const duration = 2000; // 2 seconds
    const steps = 60;
    const stepDuration = duration / steps;

    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;

      setDisplayStats({
        campingSpots: Math.floor(stats.campingSpots * progress),
        itineraries: Math.floor(stats.itineraries * progress),
        submissions: Math.floor(stats.submissions * progress),
      });

      if (currentStep >= steps) {
        setDisplayStats(stats);
        clearInterval(interval);
      }
    }, stepDuration);

    return () => clearInterval(interval);
  }, [isVisible, stats]);

  const statItems = [
    {
      icon: MapPin,
      label: '車中泊登録スポット数',
      value: displayStats.campingSpots,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900',
    },
    {
      icon: FileText,
      label: '公開旅程数',
      value: displayStats.itineraries,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900',
    },
  ];

  return (
    <section
      id='stats-section'
      className='py-16 px-6 bg-white dark:bg-gray-900'
    >
      <div className='max-w-6xl mx-auto'>
        <H2 className='text-center mb-12'>実績・統計</H2>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto'>
          {statItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className='text-center p-8 rounded-lg bg-gray-50 dark:bg-gray-800 shadow-md hover:shadow-xl transition-shadow duration-300'
              >
                <div
                  className={`inline-flex items-center justify-center w-16 h-16 ${item.bgColor} rounded-full mb-4`}
                >
                  <Icon className={`w-8 h-8 ${item.color}`} />
                </div>
                <LargeText
                  className={`font-bold mb-2 ${item.color} text-4xl tabular-nums`}
                >
                  {item.value.toLocaleString()}
                </LargeText>
                <p className='text-gray-600 dark:text-gray-400 font-medium'>
                  {item.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
