import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'aqrxiv - arXiv QR Code Generator',
  description: 'Generate stylish QR codes for arXiv papers with custom center labels and high-quality output',
  keywords: ['arXiv', 'QR code', 'generator', 'academic', 'papers', 'research'],
  authors: [{ name: 'orangekame3', url: 'https://github.com/orangekame3' }],
  creator: 'orangekame3',
  publisher: 'aqrxiv.org',
  robots: 'index, follow',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://aqrxiv.org',
    siteName: 'aqrxiv',
    title: 'aqrxiv - arXiv QR Code Generator',
    description: 'Generate stylish QR codes for arXiv papers with custom center labels and high-quality output',
    images: [
      {
        url: '/og-image.svg',
        width: 1200,
        height: 630,
        alt: 'aqrxiv - arXiv QR Code Generator',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@aqrxiv',
    creator: '@orangekame3',
    title: 'aqrxiv - arXiv QR Code Generator',
    description: 'Generate stylish QR codes for arXiv papers with custom center labels and high-quality output',
    images: ['/og-image.svg'],
  },
  alternates: {
    canonical: 'https://aqrxiv.org',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <footer className="fixed bottom-4 left-0 right-0 text-center text-xs text-gray-400">
          Not affiliated with arXiv.
        </footer>
      </body>
    </html>
  )
}