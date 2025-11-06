'use client';

import React from 'react';
import { ClipboardPaste } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { extractCoordinatesFromGoogleMapsUrl } from '@/lib/maps';

interface CoordinatesFromClipboardButtonProps {
  onCoordinatesExtracted: (
    latitude: number | string,
    longitude: number | string
  ) => void;
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
        // 数値として渡す
        onCoordinatesExtracted(coords.latitude, coords.longitude);
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
      className={`cursor-pointer ${className}`}
      onClick={handleGoogleMapsUrl}
    >
      <ClipboardPaste className='w-4 h-4' />
      クリップボードから取得
    </Button>
  );
};
