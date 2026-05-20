import type { Metadata } from 'next'
import { Orbitron, Rajdhani } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from 'sonner'
import './globals.css'

const orbitron = Orbitron({
  subsets: ['latin'],
  variable: '--font-orbitron',
  weight: ['400', '500', '600', '700', '800', '900'],
})

const rajdhani = Rajdhani({
  subsets: ['latin'],
  variable: '--font-rajdhani',
  weight: ['300', '400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: 'MaRoKiPlay — Cloud Gaming Reservation Platform',
  description: 'Reserve premium cloud gaming machines for the ultimate gaming experience. Choose your rig, book your slot, play at max settings.',
  keywords: ['cloud gaming', 'gaming PC rental', 'reservation', 'online gaming', 'high-performance gaming', 'marokiplay'],
}

export const viewport = {
  themeColor: '#000814',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${orbitron.variable} ${rajdhani.variable} bg-background`}>
      <body className="font-sans antialiased" style={{ fontFamily: 'var(--font-rajdhani), sans-serif' }}>
        {children}
        <Toaster richColors theme="dark" position="top-right" closeButton />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
