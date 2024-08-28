'use client'

import { useEffect, useState } from 'react'
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react'
import Link from 'next/link'
import LoadingSpinner from '@/components/LoadingSpinner'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { FaTrophy, FaChartLine, FaCalendarCheck, FaClock, FaBook } from 'react-icons/fa'

type Goal = {
  id: number
  title: string
  metric_type: 'percentage' | 'number' | 'boolean' | 'time'
  current_value: number
  target_value: number
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
  const [username, setUsername] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [goals, setGoals] = useState<Goal[]>([])
  const [habits, setHabits] = useState<Habit[]>([])
  const [timerStats, setTimerStats] = useState({
    pomodoro: { sessions: 0, totalTime: 0 },
    deepWork: { sessions: 0, totalTime: 0 },
  })
  const [journalStats, setJournalStats] = useState({
    totalEntries: 0,
    lastEntryDate: '',
    uniqueTags: 0,
  })

  const user = useUser()
  const supabase = useSupabaseClient()

  useEffect(() => {
    if (user) {
      setUsername(user.user_metadata.username || null)
      fetchGoals()
      fetchHabits()
      fetchTimerStats()
      fetchJournalStats()
    }
  }, [user])

  async function fetchGoals() {
    try {
      const { data, error } = await supabase
        .from('goals')
        .select('id, title, metric_type, current_value, target_value')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(5)

      if (error) throw error
      setGoals(data || [])
    } catch (error) {
      console.error('Error fetching goals:', error)
      setError('Failed to fetch goals. Please try refreshing the page.')
    }
  }

  async function fetchHabits() {
    try {
      const { data, error } = await supabase
        .from('habits')
        .select('id, title, current_streak, longest_streak, last_completed')
        .eq('user_id', user?.id)
        .order('current_streak', { ascending: false })
        .limit(5)

      if (error) throw error
      setHabits(data || [])
    } catch (error) {
      console.error('Error fetching habits:', error)
      setError('Failed to fetch habits. Please try refreshing the page.')
    }
  }

  async function fetchTimerStats() {
    try {
      const { data, error } = await supabase
        .from('user_timer_data')
        .select('daily_sessions, total_focus_time')
        .eq('user_id', user?.id)
        .single()

      if (error) throw error
      if (data) {
        setTimerStats({
          pomodoro: {
            sessions: data.daily_sessions.pomodoro,
            totalTime: data.total_focus_time.pomodoro,
          },
          deepWork: {
            sessions: data.daily_sessions.deepWork,
            totalTime: data.total_focus_time.deepWork,
          },
        })
      }
    } catch (error) {
      console.error('Error fetching timer stats:', error)
      setError('Failed to fetch timer stats. Please try refreshing the page.')
    }
  }

  async function fetchJournalStats() {
    try {
      const { data, error } = await supabase
        .from('journal_entries')
        .select('id, date, tags')
        .order('date', { ascending: false })

      if (error) throw error

      if (data) {
        const totalEntries = data.length
        const lastEntryDate = data[0]?.date || ''
        const allTags = new Set(data.flatMap(entry => entry.tags))
        const uniqueTags = allTags.size

        setJournalStats({
          totalEntries,
          lastEntryDate,
          uniqueTags,
        })
      }
    } catch (error) {
      console.error('Error fetching journal stats:', error)
      setError('Failed to fetch journal stats. Please try refreshing the page.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (error) {
    return <div className="text-red-500 text-center">{error}</div>
  }

  const habitData = [
    { name: 'Complétées', value: habits.filter(h => h.current_streak > 0).length },
    { name: 'En cours', value: habits.filter(h => h.current_streak === 0 && h.last_completed).length },
    { name: 'Non commencées', value: habits.filter(h => !h.last_completed).length },
  ]

  const goalProgress = goals.map(goal => ({
    title: goal.title,
    progress: (goal.current_value / goal.target_value) * 100
  }))

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

        <DashboardCard title="Minuteries" icon={<FaClock className="text-blue-500" size={24} />}>
          <div className="space-y-2">
            <p className="text-sm">
              <span className="font-medium">Pomodoro:</span> {timerStats.pomodoro.sessions} sessions
            </p>
            <p className="text-sm">
              <span className="font-medium">Deep Work:</span> {timerStats.deepWork.sessions} sessions
            </p>
            <p className="text-sm">
              <span className="font-medium">Temps total:</span> {formatTime(timerStats.pomodoro.totalTime + timerStats.deepWork.totalTime)}
            </p>
          </div>
          <Link href="/timers" className="text-indigo-600 hover:underline mt-2 inline-block">
            Voir les minuteries
          </Link>
        </DashboardCard>

        <DashboardCard title="Journal" icon={<FaBook className="text-green-500" size={24} />}>
          <div className="space-y-2">
            <p className="text-sm">
              <span className="font-medium">Entrées totales:</span> {journalStats.totalEntries}
            </p>
            <p className="text-sm">
              <span className="font-medium">Dernière entrée:</span> {journalStats.lastEntryDate}
            </p>
            <p className="text-sm">
              <span className="font-medium">Tags uniques:</span> {journalStats.uniqueTags}
            </p>
          </div>
          <Link href="/journaling" className="text-indigo-600 hover:underline mt-2 inline-block">
            Voir le journal
          </Link>
        </DashboardCard>

        <DashboardCard title="Habitudes actives" icon={<FaCalendarCheck className="text-purple-500" size={24} />}>
          <p className="text-3xl font-bold text-indigo-600">{habits.length}</p>
          <p className="text-gray-600">habitudes suivies</p>
        </DashboardCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <DashboardCard title="Progrès Hebdomadaire">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={goalProgress}>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <DashboardCard title="Objectifs Récents">
          <div className="space-y-4">
            {goalProgress.map((goal) => (
              <ProgressBar key={goal.title} label={goal.title} progress={goal.progress} />
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

      <div className="flex justify-center">
        <iframe 
          src="https://discordapp.com/widget?id=1260571847636811786&theme=dark" 
          width="70%" 
          height="500" 
          className="max-w-[350px]"
          allowTransparency={true} 
          frameBorder="0" 
          sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
        ></iframe>
      </div>
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
        <span className="text-sm font-medium text-indigo-700">{progress.toFixed(1)}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
      </div>
    </div>
  )
}

function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours}h ${mins}m`
}