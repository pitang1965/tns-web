'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import mapboxgl from 'mapbox-gl';
import { H1, LargeText } from '@/components/common/Typography';
import {
  suppressImageWarnings,
  handleMapError,
  preRegisterKnownIcons,
  handleMissingImage,
  setupJapaneseLabels,
  setupPOIFilters,
} from '@/lib/mapboxIcons';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

interface HeroMapSectionProps {
  initialSpots?: any[];
}

export default function HeroMapSection({
  initialSpots = [],
}: HeroMapSectionProps) {
  const router = useRouter();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const animationRef = useRef<number | null>(null);
  const currentSpotIndex = useRef(0);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current || !MAPBOX_TOKEN) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    const restoreConsoleWarn = suppressImageWarnings();

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [138.0, 37.0], // 日本中心部
      zoom: 5,
      interactive: true,
    });

    map.current.on('error', handleMapError);

    map.current.on('styledata', () => {
      if (!map.current) return;
      preRegisterKnownIcons(map.current);
    });

    map.current.on('styleimagemissing', (e) => {
      if (!map.current) return;
      handleMissingImage(map.current, e.id);
    });

    map.current.on('load', () => {
      if (!map.current) return;

      restoreConsoleWarn();
      setMapLoaded(true);

      try {
        setupJapaneseLabels(map.current);
        setupPOIFilters(map.current);
      } catch (error) {
        console.error('Error setting up map:', error);
      }
    });

    // Add controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Auto-tour animation
  useEffect(() => {
    if (!map.current || !mapLoaded || initialSpots.length === 0) return;

    const animateToNextSpot = () => {
      if (!map.current || initialSpots.length === 0) return;

      const spot = initialSpots[currentSpotIndex.current];

      map.current.flyTo({
        center: spot.geometry.coordinates,
        zoom: 11,
        duration: 3000,
        essential: true,
      });

      currentSpotIndex.current =
        (currentSpotIndex.current + 1) % initialSpots.length;

      setTimeout(() => {
        animationRef.current = requestAnimationFrame(animateToNextSpot);
      }, 5000);
    };

    // Start animation after 2 seconds
    const timeoutId = setTimeout(animateToNextSpot, 2000);

    return () => {
      clearTimeout(timeoutId);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [mapLoaded, initialSpots]);

  // Add markers when map is loaded
  useEffect(() => {
    if (!map.current || !mapLoaded || initialSpots.length === 0) return;

    initialSpots.forEach((feature) => {
      const el = document.createElement('div');
      el.className = 'hero-marker';
      el.style.cssText = `
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background-color: #3b82f6;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        cursor: pointer;
      `;

      new mapboxgl.Marker({ element: el })
        .setLngLat(feature.geometry.coordinates)
        .addTo(map.current!);
    });
  }, [mapLoaded, initialSpots]);

  if (!MAPBOX_TOKEN) {
    return (
      <div className='h-[50vh] sm:h-[70vh] bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center'>
        <div className='text-center px-6'>
          <H1 className='mb-4'>車中泊スポットを探そう</H1>
          <LargeText className='text-gray-600 dark:text-gray-400'>
            旅行計画をもっと簡単に、もっと楽しく。
          </LargeText>
        </div>
      </div>
    );
  }

  return (
    <div className='relative h-[50vh] sm:h-[70vh] w-full px-2 sm:px-0'>
      {/* Map Container */}
      <div
        ref={mapContainer}
        className='absolute inset-0 w-full h-full rounded-lg sm:rounded-none'
        style={{ left: '0.5rem', right: '0.5rem', width: 'calc(100% - 1rem)' }}
      />

      {/* Overlay Text */}
      <div className='absolute inset-0 flex items-center justify-center pointer-events-none px-4 sm:px-2'>
        <div className='text-center px-4 sm:px-6 bg-white/60 sm:bg-white/80 dark:bg-gray-900/60 dark:sm:bg-gray-900/80 backdrop-blur-sm rounded-xl sm:rounded-2xl py-3 sm:p-8 shadow-xl sm:shadow-2xl max-w-3xl w-full'>
          <H1 className='mb-3 sm:mb-4 text-gray-900 dark:text-white text-xl sm:text-3xl md:text-4xl font-bold'>
            車中泊スポットを探そう
          </H1>
          <LargeText className='hidden sm:block text-gray-700 dark:text-gray-300 mb-6 text-base'>
            旅行計画をもっと簡単に、もっと楽しく。
          </LargeText>

          {/* Search Bar */}
          <div className='pointer-events-auto mt-0 sm:mt-6'>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const params = new URLSearchParams();
                if (searchQuery.trim()) {
                  params.set('q', searchQuery.trim());
                }
                router.push(
                  `/shachu-haku${
                    params.toString() ? `?${params.toString()}` : ''
                  }`
                );
              }}
              className='flex flex-col gap-2 items-stretch w-full max-w-md mx-auto'
            >
              <input
                type='text'
                placeholder='地名・エリアで検索...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='w-full px-3 sm:px-6 py-2 sm:py-4 text-sm sm:text-lg rounded-full border-2 border-blue-500 focus:border-blue-600 focus:outline-none focus:ring-2 sm:focus:ring-4 focus:ring-blue-200 dark:bg-gray-800 dark:border-blue-400 dark:text-white transition-all'
              />
              <button
                type='submit'
                className='w-full px-4 sm:px-8 py-2 sm:py-4 text-sm sm:text-base bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full transition-colors shadow-lg hover:shadow-xl'
              >
                検索
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Gradient Overlay at bottom */}
      <div className='absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white dark:from-gray-900 to-transparent pointer-events-none' />
    </div>
  );
}
