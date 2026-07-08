'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ChevronDown, FilterX } from 'lucide-react';
import {
  CampingSpotTypeLabels,
  type CampingSpotType,
} from '@/data/schemas/campingSpot';
import { SPOT_TYPE_ORDER, parseSpotTypes } from '@/lib/spotTypeFilter';

type SpotTypeFilterProps = {
  /** 選択中の種別キー配列（空配列＝全種別） */
  value: string[];
  onChange: (value: string[]) => void;
  className?: string;
};

/**
 * 車中泊スポット種別の複数選択フィルタ。
 * 既存の ClientSideFilters と同系統の DropdownMenu で、チェックボックス選択にする。
 * 空選択（何もチェックしない）＝全種別。
 */
export function SpotTypeFilter({
  value,
  onChange,
  className,
}: SpotTypeFilterProps) {
  const selected = parseSpotTypes(value);
  const count = selected.length;
  const firstLabel = count > 0 ? CampingSpotTypeLabels[selected[0]] : null;
  const triggerLabel =
    count === 0 ? '全種別' : count === 1 ? firstLabel : `${firstLabel} 他`;

  const toggle = (key: CampingSpotType, checked: boolean) => {
    const next = new Set(selected);
    if (checked) next.add(key);
    else next.delete(key);
    // 常に正規化順で返す
    onChange(SPOT_TYPE_ORDER.filter((t) => next.has(t)));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={`h-9 justify-between cursor-pointer ${
            count > 0 ? 'text-blue-500 dark:text-blue-400 font-medium' : ''
          } ${className ?? ''}`}
        >
          <span className="truncate">{triggerLabel}</span>
          <span className="flex items-center gap-1 shrink-0">
            {count > 0 && (
              <span className="px-1.5 py-0.5 text-xs rounded-full bg-blue-500 text-white">
                {count}
              </span>
            )}
            <ChevronDown className="w-4 h-4 opacity-60" />
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="start">
        <div className="flex items-center justify-between px-2 py-1.5">
          <DropdownMenuLabel className="p-0">種別で絞り込み</DropdownMenuLabel>
          {count > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onChange([])}
              className="h-7 px-2 cursor-pointer"
            >
              <FilterX className="h-3.5 w-3.5 mr-1" />
              クリア
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        {SPOT_TYPE_ORDER.map((key) => (
          <DropdownMenuCheckboxItem
            key={key}
            checked={selected.includes(key)}
            onCheckedChange={(checked) => toggle(key, checked)}
            onSelect={(e) => e.preventDefault()}
            className="cursor-pointer"
          >
            {CampingSpotTypeLabels[key]}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
