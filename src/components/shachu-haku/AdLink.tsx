import { ExternalLink } from 'lucide-react';

type AdLinkProps = {
  className?: string;
};

export function AdLink({ className = '' }: AdLinkProps) {
  return (
    <a
      href='https://amzn.to/48d3oj8'
      target='_blank'
      rel='noopener noreferrer'
      className={`flex items-center gap-1 text-xs text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors whitespace-nowrap ${className}`}
    >
      <span className='hidden sm:inline'>EcoFlow ブラックフライデー</span>
      <span className='sm:hidden'>BFセール</span>
      <ExternalLink className='w-3 h-3' />
    </a>
  );
}
