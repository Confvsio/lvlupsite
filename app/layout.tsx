import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { PT_Sans } from 'next/font/google'
import SupabaseProvider from './supabase-provider'
import NavbarWrapper from '../components/NavbarWrapper'

export const metadata: Metadata = {
  title: "Lvl'Up",
  description: 'Plateforme de développement personnel et professionnel',
  icons: {
    icon: '/favicon.svg', 
  },
}

import { Roboto_Slab } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

const robotoSlab = Roboto_Slab({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className={robotoSlab.className}>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body className={`${inter.className} bg-cyan-50`}>
        <SupabaseProvider>
          <NavbarWrapper />
          {children}
        </SupabaseProvider>
      </body>
    </html>
  )
}