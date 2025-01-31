import './globals.css';
import { Inter } from 'next/font/google';
import { Providers } from "./providers";
import GoogleAnalytics from '@/components/google-analytics';
import { LanguageProvider } from "@/components/language-provider";
import type { Metadata, Viewport } from 'next';

const inter = Inter({ subsets: ['latin'] });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://aitranslate.site'),
  title: {
    template: '%s | AI Translation Assistant',
    default: 'AI Translation Assistant - Smart Multilingual Translation Platform',
  },
  description: 'All-in-one intelligent translation solution supporting text, image, PDF, speech, and video translation, making cross-language communication simpler.',
  keywords: ['AI Translation', 'Multilingual Translation', 'Image Translation', 'PDF Translation', 'Speech Translation', 'Video Translation', 'Machine Translation'],
  authors: [{ name: 'AI Translation Assistant Team' }],
  creator: 'AI Translation Assistant Team',
  publisher: 'AI Translation Assistant',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/site.webmanifest',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'AI Translation Assistant - Smart Multilingual Translation Platform',
    description: 'All-in-one intelligent translation solution supporting text, image, PDF, speech, and video translation, making cross-language communication simpler.',
    siteName: 'AI Translation Assistant',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'AI Translation Assistant',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Translation Assistant - Smart Multilingual Translation Platform',
    description: 'All-in-one intelligent translation solution supporting text, image, PDF, speech, and video translation, making cross-language communication simpler.',
    images: ['/og-image.png'],
  },
  verification: {
    google: 'yLQ9THm_U56rW0n0VsGzM6IXvWmlbS3fV7NGl-SZT3k',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon-16x16.png" type="image/png" sizes="16x16" />
        <link rel="icon" href="/favicon-32x32.png" type="image/png" sizes="32x32" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className={inter.className}>
        <LanguageProvider>
          <Providers>
            <GoogleAnalytics />
            {children}
          </Providers>
        </LanguageProvider>
      </body>
    </html>
  );
}