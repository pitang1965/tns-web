export const dynamic = 'force-dynamic';
import type { Metadata } from 'next';
import Script from 'next/script';
import 'mapbox-gl/dist/mapbox-gl.css';
import './globals.css';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/common/ThemeProvider';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { AdSense } from '@/components/layout/AdSense';
import { UserProvider } from '@auth0/nextjs-auth0/client';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import ItineraryUrlTracker from '@/components/common/ItineraryUrlTracker';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: '旅のしおり',
  description:
    '旅行の計画から実行まで、あなたの旅をサポートします。効率的な旅程管理ツールで、思い出に残る旅行を。',
  openGraph: {
    title: '旅のしおり',
    description:
      '旅行の計画から実行まで、あなたの旅をサポートします。効率的な旅程管理ツールで、思い出に残る旅行を。',
    images: [
      {
        url: 'https://tabi.over40web.club/touge.webp', // 1200×628のOGP用画像
        width: 1200,
        height: 628,
        alt: '旅のしおりアプリ - 旅行計画作成ツール',
      },
    ],
    locale: 'ja_JP',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='ja'>
      <body className={inter.className}>
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
              `}
            </Script>
          </>
        )}
        {process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID && (
          <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID}`}
            crossOrigin='anonymous'
            strategy='afterInteractive'
          />
        )}
        <ErrorBoundary>
          <UserProvider>
            <ThemeProvider
              attribute='class'
              defaultTheme='system'
              enableSystem
              disableTransitionOnChange
            >
              <TooltipProvider>
                <div className='flex flex-col min-h-screen bg-background text-foreground'>
                  <ItineraryUrlTracker />
                  <Header />
                  <AdSense />
                  <main className='flex-1 relative'>
                    <div className='pt-12 pb-16'>{children}</div>
                    <Toaster />
                  </main>
                  <Footer />
                </div>
              </TooltipProvider>
            </ThemeProvider>
          </UserProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
