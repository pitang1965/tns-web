import { cn } from '@/lib/utils';

type NewLabelProps = {
  className?: string;
};

/**
 * 新着を示す赤い「New」ピル（表示のみ。点灯条件は呼び出し側が判断する）。
 * カテゴリピル（緑/青/灰）と同じピル言語に揃え、生の赤字テキストは使わない。
 */
export function NewLabel({ className }: NewLabelProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold uppercase leading-none text-white',
        className,
      )}
    >
      New
    </span>
  );
}
