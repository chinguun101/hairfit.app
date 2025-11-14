import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

export const metadata: Metadata = {
  title: 'Hairfit App - AI Hairstyle Generator & Virtual Try-On',
  description: 'Transform your look with AI-powered hairstyle recommendations. Upload your photo and see yourself in 10 personalized hairstyles instantly. Free hairstyle generator with realistic results.',
  keywords: ['hairstyle generator', 'AI hairstyle', 'virtual hairstyle try-on', 'hairstyle app', 'hair makeover', 'AI hair transformation', 'hairstyle recommendations'],
  authors: [{ name: 'Hairfit App' }],
  creator: 'Hairfit App',
  publisher: 'Hairfit App',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://hairfit.app'),
  openGraph: {
    title: 'Hairfit App - AI Hairstyle Generator',
    description: 'See yourself in 10 different hairstyles with AI. Upload your photo and get instant, personalized hair recommendations.',
    url: '/',
    siteName: 'Hairfit App',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Hairfit App - AI Hairstyle Generator',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hairfit App - AI Hairstyle Generator',
    description: 'See yourself in 10 different hairstyles with AI. Upload your photo and get instant results.',
    images: ['/og-image.png'],
    creator: '@hairfitapp',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add your verification tokens here when you have them
    // google: 'your-google-site-verification',
    // yandex: 'your-yandex-verification',
    // bing: 'your-bing-verification',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body style={{ margin: 0, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}

