export const dynamic = 'force-dynamic';
import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import './globals.css';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/common/ThemeProvider';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { AdSense } from '@/components/layout/AdSense';
import { Auth0Provider } from '@auth0/nextjs-auth0/client';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { Toaster } from '@/components/ui/toaster';

import { EnvironmentWrapper } from '@/components/layout/EnvironmentWrapper';
import { WebsiteJsonLd } from '@/components/seo/JsonLd';

const inter = Inter({ subsets: ['latin'] });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://tabi.over40web.club'),
  title: '車旅のしおり',
  description:
    '旅行の計画から実行まで、あなたの旅をサポートします。効率的な旅程管理ツールで、思い出に残る旅行を。',
  keywords:
    '車中泊マップ,車中泊スポット,車中泊,車旅,道の駅,RVパーク,オートキャンプ場,SA,PA,旅程作成,旅行計画,車中泊地図',
  manifest: '/manifest.json',
  icons: {
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
  alternates: {
    canonical: '/',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='ja' suppressHydrationWarning>
      <head>
        <WebsiteJsonLd />
      </head>
      <body className={inter.className} suppressHydrationWarning>
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
              <EnvironmentWrapper>
                  <div className='flex flex-col min-h-screen bg-background text-foreground'>
                    <Header />
                    {/* 固定ヘッダー用のスペーサー */}
                    <div className='h-12' />
                    <AdSense />
                    <main className='flex-1 relative'>
                      <div className='pb-16'>{children}</div>
                      <Toaster />
                    </main>
                    <Footer />
                  </div>
                </EnvironmentWrapper>
            </ThemeProvider>
          </Auth0Provider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
