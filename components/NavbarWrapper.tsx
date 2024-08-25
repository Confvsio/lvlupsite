'use client'

import { useSession } from '@supabase/auth-helpers-react'
import Navbar from './Navbar'

export default function NavbarWrapper() {
  const session = useSession()

  if (!session) {
    return null
  }

  return <Navbar />
}