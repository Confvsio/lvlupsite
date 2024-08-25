'use client'

import Link from 'next/link'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

export default function Navbar() {
  const supabase = useSupabaseClient()
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <motion.nav 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 shadow-lg"
    >
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/dashboard" className="font-bold text-xl hover:text-indigo-200 transition duration-300">Lvl'Up</Link>
        <div className="space-x-4">
          <NavLink href="/dashboard">Tableau de bord</NavLink>
          <NavLink href="/goals">Objectifs</NavLink>
          <NavLink href="/habits">Habitudes</NavLink>
          <NavLink href="/profile">Profil</NavLink>
          <button 
            onClick={handleLogout} 
            className="bg-indigo-700 px-4 py-2 rounded-full hover:bg-indigo-800 transition duration-300 shadow-md"
          >
            Déconnexion
          </button>
        </div>
      </div>
    </motion.nav>
  )
}

function NavLink({ href, children }: { href: string, children: React.ReactNode }) {
  return (
    <Link 
      href={href} 
      className="hover:text-indigo-200 transition duration-300 px-3 py-2 rounded-full hover:bg-indigo-700"
    >
      {children}
    </Link>
  )
}