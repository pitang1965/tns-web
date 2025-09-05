import { TabBar } from '@/components/layout/TabBar';

export function Footer() {
  return (
    <footer className='flex flex-col items-center justify-center bg-background text-foreground p-2'>
      <div className='md:hidden'>
        <TabBar />
      </div>
      <div className='hidden md:block'>
        <a
          className='text-foreground'
          href='https://over40web.club'
          target='_blank'
          rel='noopener noreferrer'
        >
          Powered by Over 40 Web Club
        </a>
      </div>
    </footer>
  );
}
