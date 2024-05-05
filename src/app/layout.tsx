import type { Metadata } from 'next';
import './globals.css';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { UserProvider } from '@auth0/nextjs-auth0/client';
const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Next-Auth-App',
  description: 'Auth0による認証・認可の実験',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='ja'>
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
    </html>
  );
}
