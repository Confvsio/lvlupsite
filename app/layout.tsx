import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import SupabaseProvider from './supabase-provider'
import NavbarWrapper from '../components/NavbarWrapper'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: "Lvl'Up",
  description: 'Plateforme de développement personnel et professionnel',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <SupabaseProvider>
          <NavbarWrapper />
          {children}
        </SupabaseProvider>
      </body>
    </html>
  )
}