import './globals.css'
import type { Metadata } from 'next'
import { Roboto_Slab } from 'next/font/google'
import SupabaseProvider from './supabase-provider'
import NavbarWrapper from '../components/NavbarWrapper'
import { Analytics } from "@vercel/analytics/react"

export const metadata: Metadata = {
  title: "Lvl'Up",
  description: 'Plateforme de développement personnel et professionnel',
  icons: {
    icon: '/favicon.svg', 
  },
}

const robotoSlab = Roboto_Slab({ 
  subsets: ['latin'],
  variable: '--font-roboto-slab',
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className={robotoSlab.variable}>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body className="bg-gray-50 font-sans">
        <SupabaseProvider>
          <NavbarWrapper />
          {children}
          <Analytics/>
        </SupabaseProvider>
      </body>
    </html>
  )
}