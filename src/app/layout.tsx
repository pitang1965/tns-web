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
import { Auth0Provider } from '@auth0/nextjs-auth0/client';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import ItineraryUrlTracker from '@/components/common/ItineraryUrlTracker';
import { EnvironmentWrapper } from '@/components/layout/EnvironmentWrapper';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: '車旅のしおり',
  description:
    '旅行の計画から実行まで、あなたの旅をサポートします。効率的な旅程管理ツールで、思い出に残る旅行を。',
  keywords: '車旅,車中泊,車中泊スポット,旅程作成,旅行計画,道の駅,RVパーク',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      {
        rel: 'android-chrome-192x192',
        url: '/android-chrome-192x192.png',
      },
      {
        rel: 'android-chrome-512x512',
        url: '/android-chrome-512x512.png',
      },
    ],
  },
  openGraph: {
    title: '車旅のしおり',
    description:
      '旅行の計画から実行まで、あなたの旅をサポートします。効率的な旅程管理ツールで、思い出に残る旅行を。',
    images: [
      {
        url: 'https://tabi.over40web.club/touge.webp', // 1200×628のOGP用画像
        width: 1200,
        height: 628,
        alt: '車旅のしおりアプリ - 旅行計画作成ツール',
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
              strategy='afterInteractive'
            />
            <Script id='google-analytics' strategy='afterInteractive'>
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
          <Auth0Provider>
            <ThemeProvider
              attribute='class'
              defaultTheme='system'
              enableSystem
              disableTransitionOnChange
            >
              <TooltipProvider>
                <EnvironmentWrapper>
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
                </EnvironmentWrapper>
              </TooltipProvider>
            </ThemeProvider>
          </Auth0Provider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
