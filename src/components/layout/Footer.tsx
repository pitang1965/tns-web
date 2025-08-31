import { TabBar } from '@/components/layout/TabBar';
import Script from 'next/script';

export function Footer() {
  return (
    <footer className='flex flex-col items-center justify-center bg-background text-foreground p-2'>
      {/* Google AdSense */}
      {process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT_ID && (
        <>
          <Script
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT_ID}`}
            strategy="afterInteractive"
          />
          <div className='w-full max-w-screen-lg mb-4'>
            <ins
              className="adsbygoogle"
              style={{ display: 'block', minHeight: '280px' }}
              data-ad-client={process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT_ID}
              data-ad-format="auto"
              data-full-width-responsive="true"
            />
            <Script id="adsense-push" strategy="afterInteractive">
              {`
                try {
                  (adsbygoogle = window.adsbygoogle || []).push({});
                } catch (err) {
                  console.error('AdSense initialization error:', err);
                }
              `}
            </Script>
          </div>
        </>
      )}

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
