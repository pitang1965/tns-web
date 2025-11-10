'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { formatDistance } from '@/lib/formatDistance';

export type LegendItem = {
  type: string;
  label: string;
  icon: string;
  color: string;
}

type FacilityLegendProps = {
  legendItems: LegendItem[];
  facilityExists: (type: string) => boolean;
  getDistance?: (type: string) => number | undefined;
  className?: string;
  /** PC表示で常時展開するかどうか（デフォルト: true） */
  expandOnDesktop?: boolean;
}

/**
 * 車中泊マップの施設凡例コンポーネント
 * - モバイル: 折りたたみ可能
 * - PC (md以上): 常時1行表示（expandOnDesktop=trueの場合）
 */
export function FacilityLegend({
  legendItems,
  facilityExists,
  getDistance,
  className = '',
  expandOnDesktop = true,
}: FacilityLegendProps) {
  const [isLegendOpen, setIsLegendOpen] = useState(true);

  return (
    <>
      {/* モバイル・タブレット表示: 折りたたみ */}
      <div
        className={`lg:hidden bg-white dark:bg-gray-800 rounded-lg shadow-md border dark:border-gray-600 ${className}`}
      >
        <Collapsible open={isLegendOpen} onOpenChange={setIsLegendOpen}>
          <CollapsibleTrigger className='flex items-center justify-between w-full p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors'>
            <h4 className='font-semibold text-gray-900 dark:text-gray-100'>
              凡例
            </h4>
            {isLegendOpen ? (
              <ChevronUp className='w-4 h-4 text-gray-600 dark:text-gray-400' />
            ) : (
              <ChevronDown className='w-4 h-4 text-gray-600 dark:text-gray-400' />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent className='px-3 pb-3'>
            <div className='space-y-2'>
              {legendItems.map((item) => {
                const exists = facilityExists(item.type);
                const distance = getDistance?.(item.type);

                return (
                  <div
                    key={item.type}
                    className={`flex items-center gap-2 text-sm ${
                      exists
                        ? 'text-gray-700 dark:text-gray-300'
                        : 'text-gray-400 dark:text-gray-500'
                    }`}
                  >
                    <div
                      className='w-4 h-4 rounded-full border border-gray-300 flex items-center justify-center text-xs'
                      style={{
                        backgroundColor: exists ? item.color : '#e5e7eb',
                      }}
                    >
                      <span style={{ fontSize: '10px' }}>{item.icon}</span>
                    </div>
                    <span>{item.label}</span>
                    {item.type !== 'camping' && distance != null && (
                      <span className='text-xs text-gray-500 dark:text-gray-400'>
                        ({formatDistance(distance)})
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* PC表示 (1024px以上): 常時1行表示 */}
      {expandOnDesktop && (
        <div
          className={`hidden lg:flex items-center gap-3 bg-white dark:bg-gray-800 rounded-lg shadow-md border dark:border-gray-600 px-4 py-2 ${className}`}
        >
          {legendItems.map((item, index) => {
            const exists = facilityExists(item.type);
            const distance = getDistance?.(item.type);

            return (
              <div key={item.type} className='flex items-center gap-2'>
                {index > 0 && (
                  <div className='w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1' />
                )}
                <div
                  className={`flex items-center gap-1.5 text-sm ${
                    exists
                      ? 'text-gray-700 dark:text-gray-300'
                      : 'text-gray-400 dark:text-gray-500'
                  }`}
                >
                  <div
                    className='w-4 h-4 rounded-full border border-gray-300 flex items-center justify-center text-xs'
                    style={{
                      backgroundColor: exists ? item.color : '#e5e7eb',
                    }}
                  >
                    <span style={{ fontSize: '10px' }}>{item.icon}</span>
                  </div>
                  <span className='whitespace-nowrap'>{item.label}</span>
                  {item.type !== 'camping' && distance != null && (
                    <span className='text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap'>
                      ({formatDistance(distance)})
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
