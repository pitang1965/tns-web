'use client';

import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

type SpotSearchButtonsProps = {
  name: string;
  address: string;
};

export function SpotSearchButtons({ name, address }: SpotSearchButtonsProps) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-row sm:items-center">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={!name}
        onClick={() => {
          const url = `http://search.ipos-land.jp/p/parklist.aspx?q=${encodeURIComponent(name)}`;
          window.open(url, '_blank');
        }}
        className="flex items-center gap-1 cursor-pointer"
        title="iPosNetで名称を検索"
      >
        <Search className="w-4 h-4" />
        iPosNet
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={!name}
        onClick={() => {
          const url = `https://www.kurumatabi.com/park/search.php?q=${encodeURIComponent(name)}`;
          window.open(url, '_blank');
        }}
        className="flex items-center gap-1 cursor-pointer"
        title="くるま旅で名称を検索"
      >
        <Search className="w-4 h-4" />
        くるま旅
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={!name || !address}
        onClick={() => {
          const searchQuery = `${name} ${address}`;
          const url = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}&udm=50`;
          window.open(url, '_blank');
        }}
        className="flex items-center gap-1 cursor-pointer"
        title="名称と住所で Google AI モード検索"
      >
        <Search className="w-4 h-4" />
        AI(基本)
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={!name}
        onClick={() => {
          const searchQuery = `${name} 車中泊 周辺観光スポット`;
          const url = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}&udm=50`;
          window.open(url, '_blank');
        }}
        className="flex items-center gap-1 cursor-pointer"
        title="周辺観光スポットをGoogle AI モード検索（notes記入用）"
      >
        <Search className="w-4 h-4" />
        AI(観光)
      </Button>
    </div>
  );
}
