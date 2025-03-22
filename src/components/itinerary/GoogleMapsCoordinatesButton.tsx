'use client';

import React from 'react';
import { MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { extractCoordinatesFromGoogleMapsUrl } from '@/lib/maps';

interface GoogleMapsCoordinatesButtonProps {
  onCoordinatesExtracted: (latitude: string, longitude: string) => void;
  className?: string;
}

export const GoogleMapsCoordinatesButton: React.FC<
  GoogleMapsCoordinatesButtonProps
> = ({ onCoordinatesExtracted, className = '' }) => {
  const { toast } = useToast();

  const handleGoogleMapsUrl = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      const coords = extractCoordinatesFromGoogleMapsUrl(clipboardText);

      if (coords) {
        console.log(coords);
        onCoordinatesExtracted(
          coords.latitude.toString(),
          coords.longitude.toString()
        );
      } else {
        console.error('クリップボードのテキストに有効な座標が見つかりません。');
        toast({
          title: 'Google Mapsから取得',
          description: 'クリップボードのテキストに有効な座標が見つかりません。',
          variant: 'destructive',
        });
        onCoordinatesExtracted('', '');
      }
    } catch (error) {
      console.error('クリップボードの読み取りに失敗しました:', error);
      toast({
        title: 'Google Mapsから取得',
        description: 'クリップボードの読み取りに失敗しました',
        variant: 'destructive',
      });
      onCoordinatesExtracted('', '');
    }
  };

  return (
    <Button
      type='button'
      variant='outline'
      size='sm'
      className='flex items-center gap-2 text-sm h-8'
      onClick={handleGoogleMapsUrl}
    >
      <MapPin className='w-4 h-4' />
      Google Mapsから取得
    </Button>
  );
};
