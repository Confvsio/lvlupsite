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
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (user) {
      const fetchAvatar = async () => {
        const { data, error } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', user.id)
          .single()

        if (data?.avatar_url) {
          setAvatarUrl(data.avatar_url)
        } else if (user.user_metadata?.avatar_url) {
          setAvatarUrl(user.user_metadata.avatar_url)
        }

        if (error) {
          console.error('Error fetching avatar:', error)
        }
      }

      fetchAvatar()
    }
  }, [user, supabase])

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
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center space-x-2 text-gray-800 hover:text-indigo-600 transition duration-300"
          >
            {avatarUrl && (
              <Image 
                src={avatarUrl}
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