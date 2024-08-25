'use client'

import Link from 'next/link'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import { useRouter } from 'next/navigation'

export default function Navbar() {
  const supabase = useSupabaseClient()
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <nav className="bg-indigo-600 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/dashboard" className="font-bold text-xl">Lvl'Up</Link>
        <div className="space-x-4">
          <Link href="/dashboard">Tableau de bord</Link>
          <Link href="/goals">Objectifs</Link>
          <Link href="/habits">Habitudes</Link>
          <Link href="/profile">Profil</Link>
          <button onClick={handleLogout} className="bg-indigo-700 px-3 py-1 rounded">Déconnexion</button>
        </div>
      </div>
    </nav>
  )
}