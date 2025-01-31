import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Online Translation - AI Translation Assistant',
  description: 'High-quality multilingual translation powered by AI, supporting text, image, PDF, speech, and video formats.',
  alternates: {
    canonical: '/translate',
  },
  openGraph: {
    title: 'Online Translation - AI Translation Assistant',
    description: 'High-quality multilingual translation powered by AI, supporting text, image, PDF, speech, and video formats.',
    url: '/translate',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'AI Translation Assistant - Translation Page',
      },
    ],
  },
}

export default function TranslateLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 