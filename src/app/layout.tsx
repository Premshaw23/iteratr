import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    template: '%s | iteratr',
    default: 'iteratr — The Elite Adaptive AI Coding Mentor',
  },
  description: 'Master technical interviews with a FAANG-level AI mentor that pairs with you in real-time. Never just be told you are wrong; learn why you are wrong.',
  metadataBase: new URL('https://iteratr.vercel.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'iteratr — Master Technical Interviews with AI',
    description: 'The world\'s highest-rated adaptive coding platform. Join 2,000+ engineers solving logic and algorithm challenges with real-time mentor feedback.',
    url: 'https://iteratr.vercel.app',
    siteName: 'iteratr',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'iteratr Dashboard with AI Mastery Radar',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'iteratr — The Future of Technical Interview Prep',
    description: 'Pair-program with a senior engineer AI. Get hints, live code evaluation, and performance analytics.',
    images: ['/og-image.png'],
    creator: '@iteratr_dev',
  },
  category: 'education',
  keywords: ['coding', 'interviews', 'leetcode', 'algorithms', 'AI mentor', 'nextjs', 'technical recruitment', 'FAANG prep'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
