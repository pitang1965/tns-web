'use client';

import React from 'react';
import { MapPin } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { extractCoordinatesFromGoogleMapsUrl } from '@/lib/maps';

interface CoordinatesFromClipboardButtonProps {
  onCoordinatesExtracted: (latitude: string, longitude: string) => void;
  className?: string;
}

export const CoordinatesFromClipboardButton: React.FC<
  CoordinatesFromClipboardButtonProps
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
    <button
      type='button'
      className={`flex items-center justify-center gap-2 text-sm px-3 border bg-background hover:bg-accent hover:text-accent-foreground rounded-md h-8 text-foreground w-full ${className}`}
      onClick={handleGoogleMapsUrl}
    >
      <MapPin className='w-4 h-4' />
      クリップボードから取得
    </button>
  );
};
