'use client'

import Link from 'next/link'
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react'
import { useRouter } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { Bars3Icon as MenuIcon, XMarkIcon, ChevronDownIcon } from '@heroicons/react/24/outline'

export default function Navbar() {
  const supabase = useSupabaseClient()
  const router = useRouter()
  const user = useUser()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [username, setUsername] = useState<string>('Profil')

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

  return (
    <nav className="bg-white border-b border-gray-200 bg-cyan-15">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link href="/dashboard" className="flex-shrink-0 flex items-center">
              <span className="font-bold text-xl text-gray-800 hover:text-indigo-600 transition duration-300">Lvl'Up</span>
            </Link>
          </div>
          
          {/* Desktop menu */}
          <div className="hidden md:flex md:items-center md:space-x-1">
            <NavLink href="/dashboard">Tableau de bord</NavLink>
            
            <DropdownMenu 
              title="Objectifs" 
              items={[
                { href: '/goals', label: 'Objectifs' },
                { href: '/habits', label: 'Habitudes' },
              ]}
            />
            
            <DropdownMenu 
              title="Outils" 
              items={[
                { href: '/timers', label: 'Timers' },
                { href: '/journaling', label: 'Journaling' },
                { href: '/suggestions', label: 'Suggestions' },
              ]}
            />
            
            <NavLink href="/social">Social</NavLink>
            
            <DropdownMenu 
              title={username}
              items={[
                { href: '/profile', label: 'Voir le profil' },
                { href: '#', label: 'Déconnexion', onClick: handleLogout },
              ]}
            />
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
            >
              {isMobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <MenuIcon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <MobileNavLink href="/dashboard">Tableau de bord</MobileNavLink>
            <MobileDropdownMenu 
              title="Objectifs" 
              items={[
                { href: '/goals', label: 'Objectifs' },
                { href: '/habits', label: 'Habitudes' },
              ]}
            />
            <MobileDropdownMenu 
              title="Outils" 
              items={[
                { href: '/timers', label: 'Timers' },
                { href: '/journaling', label: 'Journaling' },
                { href: '/suggestions', label: 'Suggestions' },
              ]}
            />
            <MobileNavLink href="/social">Social</MobileNavLink>
            <MobileNavLink href="/profile">Voir le profil</MobileNavLink>
            <button 
              onClick={handleLogout}
              className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
            >
              Déconnexion
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}

function NavLink({ href, children }: { href: string, children: React.ReactNode }) {
  return (
    <Link 
      href={href} 
      className="text-gray-800 hover:text-indigo-600 transition duration-300 px-3 py-2 rounded-md text-sm font-medium"
    >
      {children}
    </Link>
  )
}

function DropdownMenu({ title, items }: { title: string, items: { href: string, label: string, onClick?: () => void }[] }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div 
      className="relative inline-block text-left"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button 
        className="flex items-center space-x-1 text-gray-800 hover:text-indigo-600 transition duration-300 px-3 py-2 rounded-md text-sm font-medium"
      >
        <span>{title}</span>
        <ChevronDownIcon className="h-4 w-4" />
      </button>
      {isOpen && (
        <div 
          className="absolute left-0 w-48 bg-white rounded-md shadow-lg py-1 z-10"
          style={{ top: 'calc(100% - 0.25rem)' }} // Reduce the gap
        >
          {items.map((item, index) => (
            item.onClick ? (
              <button
                key={index}
                onClick={item.onClick}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-indigo-100"
              >
                {item.label}
              </button>
            ) : (
              <Link 
                key={index}
                href={item.href} 
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-100"
              >
                {item.label}
              </Link>
            )
          ))}
        </div>
      )}
    </div>
  )
}

function MobileNavLink({ href, children }: { href: string, children: React.ReactNode }) {
  return (
    <Link 
      href={href} 
      className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
    >
      {children}
    </Link>
  )
}

function MobileDropdownMenu({ title, items }: { title: string, items: { href: string, label: string }[] }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
      >
        <span>{title}</span>
        <ChevronDownIcon className={`h-4 w-4 transform ${isOpen ? 'rotate-180' : ''} transition-transform duration-200`} />
      </button>
      {isOpen && (
        <div className="pl-4">
          {items.map((item, index) => (
            <MobileNavLink key={index} href={item.href}>
              {item.label}
            </MobileNavLink>
          ))}
        </div>
      )}
    </div>
  )
}