import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pricing Plans - AI Translation Assistant',
  description: 'Affordable pricing plans for AI-powered translation services. Choose from Free, Pro, and Enterprise plans with various features and usage limits.',
  alternates: {
    canonical: '/pricing',
  },
  openGraph: {
    title: 'Pricing Plans - AI Translation Assistant',
    description: 'Affordable pricing plans for AI-powered translation services. Choose from Free, Pro, and Enterprise plans with various features and usage limits.',
    url: '/pricing',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'AI Translation Assistant - Pricing Page',
      },
    ],
  },
}

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
