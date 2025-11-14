import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Hairfit App - AI Hairstyle Generator',
    short_name: 'Hairfit',
    description: 'Transform your look with AI-powered hairstyle recommendations',
    start_url: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#A47864',
    icons: [
      {
        src: '/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  }
}

