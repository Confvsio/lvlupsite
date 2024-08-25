'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@supabase/auth-helpers-react'
import Link from 'next/link'

export default function Dashboard() {
  const user = useUser()
  const [username, setUsername] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      setUsername(user.user_metadata.username || null)
    }
  }, [user])

  if (!user) {
    return <div>Chargement...</div>
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Tableau de Bord</h1>
      
      {!username && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6" role="alert">
          <p className="font-bold">Attention</p>
          <p>Vous n'avez pas encore défini votre nom d'utilisateur. <Link href="/set-username" className="underline">Cliquez ici pour le définir</Link>.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DashboardCard title="Objectifs">
          <p>Vous n'avez pas encore défini d'objectifs.</p>
          <Link href="/goals" className="text-indigo-600 hover:underline">Définir des objectifs</Link>
        </DashboardCard>

        <DashboardCard title="Habitudes">
          <p>Vous n'avez pas encore créé d'habitudes.</p>
          <Link href="/habits" className="text-indigo-600 hover:underline">Créer des habitudes</Link>
        </DashboardCard>

        <DashboardCard title="Progrès">
          <p>Commencez à travailler sur vos objectifs pour voir votre progrès.</p>
        </DashboardCard>

        <DashboardCard title="Niveau">
          <p>Niveau 1</p>
          <p>0 XP / 100 XP pour le prochain niveau</p>
        </DashboardCard>
      </div>
    </div>
  )
}

function DashboardCard({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      {children}
    </div>
  )
}