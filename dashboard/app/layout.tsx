import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import Sidebar from '@/components/ui/Sidebar'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title:       'Oil Palm IoT System',
  description: 'Smart monitoring, automation and security for oil palm plantations',
  manifest:    '/manifest.json',
  appleWebApp: {
    capable:        true,
    statusBarStyle: 'default',
    title:          'OilPalm IoT',
  },
  icons: {
    apple: '/icons/icon-192x192.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#22c55e',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={geist.className}>
        <div className="flex flex-col md:flex-row h-screen bg-gray-950 text-white overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}