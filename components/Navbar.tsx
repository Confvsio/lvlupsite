'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react'
import { useRouter } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'

export default function Navbar() {
  const supabase = useSupabaseClient()
  const router = useRouter()
  const user = useUser()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

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
    <nav className="flex justify-between items-center p-4 bg-white border-b border-gray-200">
      <Link href="/dashboard" className="font-bold text-xl text-gray-800 hover:text-indigo-600 transition duration-300">Lvl'Up</Link>
      <div className="flex items-center space-x-4">
        <NavLink href="/dashboard">Tableau de bord</NavLink>
        <NavLink href="/goals">Objectifs</NavLink>
        <NavLink href="/habits">Habitudes</NavLink>
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center space-x-2 text-gray-800 hover:text-indigo-600 transition duration-300"
          >
            {user?.user_metadata?.avatar_url && (
              <Image 
                src={`https://wizqmmmrnjgbiismfswx.supabase.co/storage/v1/object/public/avatars/${user.user_metadata.avatar_url}`}
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
    </nav>
  )
}

function NavLink({ href, children }: { href: string, children: React.ReactNode }) {
  return (
    <Link 
      href={href} 
      className="text-gray-800 hover:text-indigo-600 transition duration-300"
    >
      {children}
    </Link>
  )
}