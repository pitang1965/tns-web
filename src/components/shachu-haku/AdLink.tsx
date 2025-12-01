import { ExternalLink, Zap } from 'lucide-react';

type AdLinkProps = {
  className?: string;
};

export function AdLink({ className = '' }: AdLinkProps) {
  // 環境変数で表示/非表示を制御
  if (process.env.NEXT_PUBLIC_SHOW_AD_LINK !== 'true') {
    return null;
  }

  return (
    <a
      href='https://amzn.to/48d3oj8'
      target='_blank'
      rel='noopener noreferrer'
      className={`
        group relative inline-flex items-center gap-1.5 px-3 py-1.5
        text-xs font-medium whitespace-nowrap
        bg-linear-to-r from-orange-500 to-red-500
        dark:from-orange-600 dark:to-red-600
        text-white rounded-full
        shadow-md hover:shadow-lg
        transition-all duration-300 ease-out
        hover:scale-105 hover:-translate-y-0.5
        animate-pulse-subtle
        ${className}
      `}
    >
      <Zap className='w-3.5 h-3.5 animate-bounce-subtle' />
      <span className='hidden sm:inline'>EcoFlow ブラックフライデー</span>
      <span className='sm:hidden'>ポタ電セール</span>
      <ExternalLink className='w-3 h-3 group-hover:translate-x-0.5 transition-transform' />

      {/* キラキラエフェクト */}
      <span className='absolute -top-0.5 -right-0.5 flex h-2 w-2'>
        <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-300 opacity-75'></span>
        <span className='relative inline-flex rounded-full h-2 w-2 bg-yellow-400'></span>
      </span>
    </a>
  );
}
