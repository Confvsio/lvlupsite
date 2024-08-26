'use client'

import { useEffect, useState } from 'react'
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react'
import Link from 'next/link'
import LoadingSpinner from '@/components/LoadingSpinner'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { FaTrophy, FaChartLine, FaCalendarCheck, FaDiscord } from 'react-icons/fa'

type Goal = {
  id: number
  title: string
  progress: number
}

type Habit = {
  id: number
  title: string
  current_streak: number
  longest_streak: number
  last_completed: string | null
}

const COLORS = ['#4F46E5', '#10B981', '#F59E0B']

export default function Dashboard() {
  const user = useUser()
  const supabase = useSupabaseClient()
  const [username, setUsername] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [goals, setGoals] = useState<Goal[]>([])
  const [habits, setHabits] = useState<Habit[]>([])
  
  useEffect(() => {
    if (user) {
      setUsername(user.user_metadata.username || null)
      fetchGoals()
      fetchHabits()
    }
  }, [user])

  async function fetchGoals() {
    const { data, error } = await supabase
      .from('goals')
      .select('id, title, progress')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false })
      .limit(5)

    if (error) {
      console.error('Error fetching goals:', error)
    } else {
      setGoals(data || [])
    }
  }

  async function fetchHabits() {
    const { data, error } = await supabase
      .from('habits')
      .select('id, title, current_streak, longest_streak, last_completed')
      .eq('user_id', user?.id)
      .order('current_streak', { ascending: false })
      .limit(5)

    if (error) {
      console.error('Error fetching habits:', error)
    } else {
      setHabits(data || [])
    }
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  const habitData = [
    { name: 'Complétées', value: habits.filter(h => h.current_streak > 0).length },
    { name: 'En cours', value: habits.filter(h => h.current_streak === 0 && h.last_completed).length },
    { name: 'Non commencées', value: habits.filter(h => !h.last_completed).length },
  ]

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50">
      <h1 className="text-4xl font-bold mb-8 text-gray-800 text-center">Tableau de Bord</h1>
      
      {!username && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6 rounded-md" role="alert">
          <p className="font-bold">Attention</p>
          <p>Vous n'avez pas encore défini votre nom d'utilisateur. <Link href="/set-username" className="underline text-yellow-600 hover:text-yellow-800">Cliquez ici pour le définir</Link>.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <DashboardCard title="Objectifs en cours" icon={<FaChartLine className="text-indigo-500" size={24} />}>
          <p className="text-3xl font-bold text-indigo-600">{goals.length}</p>
          <p className="text-gray-600">objectifs récents</p>
        </DashboardCard>

        <DashboardCard title="Niveau" icon={<FaTrophy className="text-yellow-500" size={24} />}>
          <div className="text-center">
            <p className="text-4xl font-bold text-indigo-600">Niveau 5</p>
            <p className="text-gray-600">450 XP / 1000 XP</p>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
              <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: '45%' }}></div>
            </div>
          </div>
        </DashboardCard>

        <DashboardCard title="Habitudes actives" icon={<FaCalendarCheck className="text-green-500" size={24} />}>
          <p className="text-3xl font-bold text-indigo-600">{habits.length}</p>
          <p className="text-gray-600">habitudes suivies</p>
        </DashboardCard>

        <DashboardCard title="Meilleure série" icon={<FaTrophy className="text-purple-500" size={24} />}>
          <p className="text-3xl font-bold text-indigo-600">
            {habits.reduce((max, habit) => Math.max(max, habit.longest_streak), 0)}
          </p>
          <p className="text-gray-600">jours consécutifs</p>
        </DashboardCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <DashboardCard title="Progrès Hebdomadaire">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={goals}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="title" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="progress" stroke="#4F46E5" />
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
        <DashboardCard title="Objectifs Récents">
          <div className="space-y-4">
            {goals.map((goal) => (
              <ProgressBar key={goal.id} label={goal.title} progress={goal.progress} />
            ))}
          </div>
          <Link href="/goals" className="text-indigo-600 hover:underline mt-4 inline-block">
            Voir tous les objectifs
          </Link>
        </DashboardCard>

        <DashboardCard title="Habitudes Récentes">
          <ul className="space-y-2">
            {habits.map((habit) => (
              <li key={habit.id} className="flex justify-between items-center">
                <span>{habit.title}</span>
                <span className="text-indigo-600 font-semibold">{habit.current_streak} jours</span>
              </li>
            ))}
          </ul>
          <Link href="/habits" className="text-indigo-600 hover:underline mt-4 inline-block">
            Voir toutes les habitudes
          </Link>
        </DashboardCard>
      </div>

      <DashboardCard title="Discord Server" icon={<FaDiscord className="text-indigo-500" size={24} />}>
        <div className="flex justify-center">
          <iframe 
            src="https://discordapp.com/widget?id=1260571847636811786&theme=dark" 
            width="350" 
            height="500" 
            allowTransparency={true} 
            frameBorder="0" 
            sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
          ></iframe>
        </div>
      </DashboardCard>
    </div>
  )
}

function DashboardCard({ title, children, icon, className = '' }: { title: string, children: React.ReactNode, icon?: React.ReactNode, className?: string }) {
  return (
    <div className={`bg-white shadow-lg rounded-lg p-6 transition-transform transform hover:scale-105 ${className}`}>
      <div className="flex items-center mb-4">
        {icon && <div className="mr-2">{icon}</div>}
        <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
      </div>
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