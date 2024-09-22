export const dynamic = 'force-dynamic';
import type { Metadata } from 'next';
import 'mapbox-gl/dist/mapbox-gl.css';
import './globals.css';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { UserProvider } from '@auth0/nextjs-auth0/client';
import ErrorBoundary from '../components/ErrorBoundary';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: '旅のしおり',
  description: 'Auth0による認証・認可の実験',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='ja'>
      <ErrorBoundary>
        <UserProvider>
          <body className={inter.className}>
            <ThemeProvider
              attribute='class'
              defaultTheme='system'
              enableSystem
              disableTransitionOnChange
            >
              <div className='flex flex-col min-h-screen bg-background text-foreground'>
                <Header />
                <main className='flex-1'>{children}</main>
                <Footer />
              </div>
            </ThemeProvider>
          </body>
        </UserProvider>
      </ErrorBoundary>
    </html>
  );
}
