import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'aqrxiv - arXiv QR Code Generator',
  description: 'Generate stylish QR codes for arXiv papers without using arXiv logos',
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