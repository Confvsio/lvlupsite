import './globals.css'
import type { Metadata } from 'next'
import { PT_Sans } from 'next/font/google'
import SupabaseProvider from './supabase-provider'
import NavbarWrapper from '../components/NavbarWrapper'

// Import PT Sans font
const ptSans = PT_Sans({ subsets: ['latin'], weight: '400' })

export const metadata: Metadata = {
  title: "Lvl'Up",
  description: 'Plateforme de développement personnel et professionnel',
  icons: {
    icon: '/favicon.svg', // Ensure the favicon is included here
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className={ptSans.className}>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body className="font-pt-sans">
        <SupabaseProvider>
          <NavbarWrapper />
          {children}
        </SupabaseProvider>
      </body>
    </html>
  )
}