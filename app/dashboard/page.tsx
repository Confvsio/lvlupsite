'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@supabase/auth-helpers-react'
import Link from 'next/link'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const weeklyData = [
  { name: 'Lun', progress: 4 },
  { name: 'Mar', progress: 3 },
  { name: 'Mer', progress: 5 },
  { name: 'Jeu', progress: 2 },
  { name: 'Ven', progress: 6 },
  { name: 'Sam', progress: 4 },
  { name: 'Dim', progress: 3 },
]

const habitData = [
  { name: 'Complétées', value: 5 },
  { name: 'En cours', value: 3 },
  { name: 'Non commencées', value: 2 },
]

const COLORS = ['#0088FE', '#00C49F', '#FFBB28']

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
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-4xl font-bold mb-8 text-gray-800 text-center">Tableau de Bord</h1>
      
      {!username && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6 rounded-md" role="alert">
          <p className="font-bold">Attention</p>
          <p>Vous n'avez pas encore défini votre nom d'utilisateur. <Link href="/set-username" className="underline text-yellow-600 hover:text-yellow-800">Cliquez ici pour le définir</Link>.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <DashboardCard title="Objectifs en cours">
          <p className="text-3xl font-bold text-indigo-600">3</p>
          <p className="text-gray-600">sur 5 objectifs totaux</p>
        </DashboardCard>

        <DashboardCard title="Niveau">
          <div className="text-center">
            <p className="text-4xl font-bold text-indigo-600">Niveau 5</p>
            <p className="text-gray-600">450 XP / 1000 XP</p>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
              <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: '45%' }}></div>
            </div>
          </div>
        </DashboardCard>

        <DashboardCard title="Habitudes suivies">
          <p className="text-3xl font-bold text-indigo-600">8</p>
          <p className="text-gray-600">sur 10 habitudes totales</p>
        </DashboardCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <DashboardCard title="Progrès Hebdomadaire">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="progress" stroke="#8884d8" />
            </LineChart>
          </ResponsiveContainer>
        </DashboardCard>

        <DashboardCard title="Répartition des Habitudes">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={habitData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {habitData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-around mt-4">
            {habitData.map((entry, index) => (
              <div key={`legend-${index}`} className="flex items-center">
                <div className="w-3 h-3 mr-1" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                <span>{entry.name}</span>
              </div>
            ))}
          </div>
        </DashboardCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DashboardCard title="Objectifs">
          <div className="space-y-4">
            <ProgressBar label="Méditation quotidienne" progress={70} />
            <ProgressBar label="Lecture" progress={45} />
            <ProgressBar label="Exercice physique" progress={60} />
            <ProgressBar label="Apprentissage d'une langue" progress={30} />
            <ProgressBar label="Écriture créative" progress={80} />
          </div>
        </DashboardCard>

        <DashboardCard title="Habitudes Récentes">
          <ul className="space-y-2">
            <HabitItem label="Méditation matinale" status="completed" />
            <HabitItem label="Lecture avant le coucher" status="completed" />
            <HabitItem label="Exercice quotidien" status="missed" />
            <HabitItem label="Pratique de langue" status="completed" />
            <HabitItem label="Journaling" status="pending" />
            <HabitItem label="Boire 2L d'eau" status="completed" />
            <HabitItem label="Planification de la journée" status="pending" />
          </ul>
        </DashboardCard>
      </div>
    </div>
  )
}

function DashboardCard({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div className="bg-white shadow-lg rounded-lg p-6 transition-transform transform hover:scale-105">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">{title}</h2>
      <div className="text-gray-600">
        {children}
      </div>
    </div>
  )
}

function ProgressBar({ label, progress }: { label: string, progress: number }) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium text-indigo-700">{label}</span>
        <span className="text-sm font-medium text-indigo-700">{progress}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
      </div>
    </div>
  )
}

function HabitItem({ label, status }: { label: string, status: 'completed' | 'missed' | 'pending' }) {
  const statusColors = {
    completed: 'bg-green-500',
    missed: 'bg-red-500',
    pending: 'bg-yellow-500'
  }

  return (
    <li className="flex items-center justify-between">
      <span>{label}</span>
      <span className={`w-3 h-3 ${statusColors[status]} rounded-full`}></span>
    </li>
  )
}