import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

type LoadingVariant = 'fullscreen' | 'overlay' | 'inline' | 'card';

type LoadingStateProps = {
  /** ローディング表示のバリエーション */
  variant?: LoadingVariant;
  /** カスタムメッセージ (デフォルト: "読み込み中...") */
  message?: string;
  /** カスタムクラス名 */
  className?: string;
  /** カードバリエーションの高さ (デフォルト: 400px) */
  height?: number;
}

export function LoadingState({
  variant = 'fullscreen',
  message = '読み込み中...',
  className,
  height = 400,
}: LoadingStateProps) {
  // Overlay variant - 固定オーバーレイ
  if (variant === 'overlay') {
    return (
      <div className={cn('fixed inset-0 bg-black/50 flex items-center justify-center z-50', className)}>
        <div className='flex flex-col items-center gap-4'>
          <Spinner className='size-12 text-white' />
          <p className='text-white text-sm'>{message}</p>
        </div>
      </div>
    );
  }

  // Fullscreen variant - ページ全体でセンタリング (h-screen)
  if (variant === 'fullscreen') {
    return (
      <div className={cn('flex justify-center items-center h-screen', className)}>
        <div className='flex flex-col items-center gap-3'>
          <Spinner className='size-10 text-primary' />
          <p className='text-sm text-muted-foreground'>{message}</p>
        </div>
      </div>
    );
  }

  // Inline variant - シンプルなインライン表示
  if (variant === 'inline') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Spinner className='size-4 text-primary' />
        <span className='text-sm text-muted-foreground'>{message}</span>
      </div>
    );
  }

  // Card variant - 地図などのカード内表示
  if (variant === 'card') {
    return (
      <div
        className={cn('bg-gray-100 dark:bg-gray-800 animate-pulse rounded-lg flex items-center justify-center', className)}
        style={{ height: `${height}px` }}
      >
        <div className='flex flex-col items-center gap-3'>
          <Spinner className='size-8 text-gray-500 dark:text-gray-400' />
          <div className='text-gray-500 dark:text-gray-400 text-sm'>{message}</div>
        </div>
      </div>
    );
  }

  return null;
}
