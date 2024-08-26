'use client'

import Link from 'next/link'
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react'
import { useRouter } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { Bars3Icon as MenuIcon, XMarkIcon } from '@heroicons/react/24/outline'

export default function Navbar() {
  const supabase = useSupabaseClient()
  const router = useRouter()
  const user = useUser()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [username, setUsername] = useState<string>('Profil')
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (user) {
      const discordUsername = user.user_metadata?.username || 'Profil'
      setUsername(discordUsername)
    }
  }, [user])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [dropdownRef])

  return (
    <nav className="flex justify-between items-center p-4 bg-white border-b border-gray-200 bg-cyan-15">
      <Link href="/dashboard" className="font-bold text-xl text-gray-800 hover:text-indigo-600 transition duration-300">Lvl'Up</Link>
      
      {/* Mobile menu button */}
      <div className="md:hidden">
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? (
            <XMarkIcon className="h-6 w-6 text-gray-800" />
          ) : (
            <MenuIcon className="h-6 w-6 text-gray-800" />
          )}
        </button>
      </div>

      {/* Desktop menu */}
      <div className="hidden md:flex items-center space-x-4">
        <NavLink href="/dashboard">Tableau de bord</NavLink>
        <NavLink href="/goals">Objectifs</NavLink>
        <NavLink href="/habits">Habitudes</NavLink>
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center space-x-2 text-gray-800 hover:text-indigo-600 transition duration-300"
          >
            <span>{username}</span>
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

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-white shadow-md z-20">
          <NavLink href="/dashboard">Tableau de bord</NavLink>
          <NavLink href="/goals">Objectifs</NavLink>
          <NavLink href="/habits">Habitudes</NavLink>
          <NavLink href="/profile">Voir le profil</NavLink>
          <button 
            onClick={handleLogout}
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-indigo-100"
          >
            Déconnexion
          </button>
        </div>
      )}
    </nav>
  )
}

function NavLink({ href, children }: { href: string, children: React.ReactNode }) {
  return (
    <Link 
      href={href} 
      className="block px-4 py-2 text-gray-800 hover:text-indigo-600 transition duration-300"
    >
      {children}
    </Link>
  )
}