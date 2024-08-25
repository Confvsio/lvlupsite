'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useState } from 'react'

export default function Navbar() {
  const supabase = useSupabaseClient()
  const router = useRouter()
  const user = useUser()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <motion.nav 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex justify-between items-center p-4 bg-white shadow-md"
    >
      <Link href="/dashboard" className="font-bold text-xl text-gray-800 hover:text-indigo-600 transition duration-300">Lvl'Up</Link>
      <div className="flex items-center space-x-4">
        <NavLink href="/dashboard">Tableau de bord</NavLink>
        <NavLink href="/goals">Objectifs</NavLink>
        <NavLink href="/habits">Habitudes</NavLink>
        <div className="relative">
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center space-x-2 text-gray-800 hover:text-indigo-600 transition duration-300"
          >
            {user?.user_metadata?.avatar_url && (
              <Image 
                src={user.user_metadata.avatar_url} 
                alt="Profile" 
                width={24} 
                height={24} 
                className="rounded-full"
              />
            )}
            <span>Profil</span>
          </button>
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
              <Link 
                href="/profile" 
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-100"
              >
                Voir le profil
              </Link>
              <button 
                onClick={handleLogout}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-indigo-100"
              >
                Déconnexion
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="border-b border-gray-300 w-full mt-2"></div>
    </motion.nav>
  )
}

function NavLink({ href, children }: { href: string, children: React.ReactNode }) {
  return (
    <Link 
      href={href} 
      className="text-gray-800 hover:text-indigo-600 transition duration-300 px-3 py-2 rounded-full"
    >
      {children}
    </Link>
  )
}