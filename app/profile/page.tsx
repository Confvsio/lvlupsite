'use client'

import { useState, useEffect } from 'react'
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react'
import LoadingSpinner from '@/components/LoadingSpinner'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts'
import { PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'

type UserProfile = {
  id: string
  username: string
  email: string
  avatar_url: string | null
  bio: string | null
  created_at: string
  xp: number
  level: number
}

type AnalyticsData = {
  totalGoals: number
  completedGoals: number
  totalHabits: number
  activeHabits: number
  longestStreak: number
  xpHistory: { date: string; xp: number }[]
  categoryCompletion: { category: string; completed: number; total: number }[]
}

type Goal = {
  id: number
  title: string
  description: string
  category: string
  current_value: number
  target_value: number
  progress: number
  target_date: string
}

type Habit = {
  id: number
  title: string
  description: string
  category: string
  frequency: 'daily' | 'weekly' | 'monthly'
  current_streak: number
  longest_streak: number
  last_completed: string | null
}

type ActivityItem = {
  id: number
  type: 'goal_created' | 'goal_completed' | 'habit_created' | 'habit_streak' | 'achievement_earned'
  content: string
  timestamp: string
}

type TimerStats = {
  pomodoro: { sessions: number, totalTime: number },
  deepWork: { sessions: number, totalTime: number },
}

type JournalStats = {
  totalEntries: number,
  lastEntryDate: string,
  uniqueTags: number,
}

export default function ProfilePage() {
  const user = useUser()
  const supabase = useSupabaseClient()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [goals, setGoals] = useState<Goal[]>([])
  const [habits, setHabits] = useState<Habit[]>([])
  const [activityFeed, setActivityFeed] = useState<ActivityItem[]>([])
  const [timerStats, setTimerStats] = useState<TimerStats | null>(null)
  const [journalStats, setJournalStats] = useState<JournalStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editedProfile, setEditedProfile] = useState<UserProfile | null>(null)

  useEffect(() => {
    if (user) {
      fetchProfile()
      fetchAnalyticsData()
      fetchGoals()
      fetchHabits()
      fetchActivityFeed()
      fetchTimerStats()
      fetchJournalStats()
    }
  }, [user])

  async function fetchProfile() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user?.id)
      .single()

    if (error) {
      console.error('Erreur lors de la récupération du profil:', error)
    } else {
      setProfile(data)
      setEditedProfile(data)
    }
    setIsLoading(false)
  }

  async function fetchAnalyticsData() {
    const { data, error } = await supabase.rpc('get_user_analytics', { user_id: user?.id })
    if (error) {
      console.error('Erreur lors de la récupération des données analytiques:', error)
    } else {
      setAnalyticsData(data)
    }
  }

  async function fetchGoals() {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', user?.id)
      .order('target_date', { ascending: true })

    if (error) {
      console.error('Erreur lors de la récupération des objectifs:', error)
    } else {
      setGoals(data.map(goal => ({
        ...goal,
        progress: (goal.current_value / goal.target_value) * 100
      })))
    }
  }

  async function fetchHabits() {
    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', user?.id)
      .order('current_streak', { ascending: false })

    if (error) {
      console.error('Erreur lors de la récupération des habitudes:', error)
    } else {
      setHabits(data)
    }
  }

  async function fetchActivityFeed() {
    const { data, error } = await supabase
      .from('activity_feed')
      .select('*')
      .eq('user_id', user?.id)
      .order('timestamp', { ascending: false })
      .limit(10)

    if (error) {
      console.error('Erreur lors de la récupération de l\'activité récente:', error)
    } else {
      setActivityFeed(data)
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
    }
  }

  async function fetchJournalStats() {
    try {
      const { data, error } = await supabase
        .from('journal_entries')
        .select('id, date, tags')
        .eq('user_id', user?.id)
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
    } finally {
      setIsLoading(false)
    }
  }

  async function updateProfile() {
    if (!editedProfile) return

    const { error } = await supabase
      .from('profiles')
      .update({
        username: editedProfile.username,
        bio: editedProfile.bio,
      })
      .eq('id', user?.id)

    if (error) {
      console.error('Erreur lors de la mise à jour du profil:', error)
    } else {
      setProfile(editedProfile)
      setIsEditing(false)
    }
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">Profil Utilisateur</h1>
      
      <UserInfoSection 
        profile={profile} 
        isEditing={isEditing} 
        editedProfile={editedProfile} 
        setEditedProfile={setEditedProfile}
        setIsEditing={setIsEditing}
        updateProfile={updateProfile}
      />

      <AnalyticsDashboard 
        analyticsData={analyticsData} 
        timerStats={timerStats}
        journalStats={journalStats}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <GoalsOverview goals={goals} />
        <HabitsOverview habits={habits} />
      </div>

      <ActivityFeed activityItems={activityFeed} />
    </div>
  )
}

function UserInfoSection({ profile, isEditing, editedProfile, setEditedProfile, setIsEditing, updateProfile }: { 
  profile: UserProfile | null, 
  isEditing: boolean, 
  editedProfile: UserProfile | null,
  setEditedProfile: (profile: UserProfile | null) => void,
  setIsEditing: (isEditing: boolean) => void,
  updateProfile: () => void
}) {
  if (!profile || !editedProfile) return null

  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <img 
            src={profile.avatar_url || '/default-avatar.png'} 
            alt="Profil" 
            className="w-20 h-20 rounded-full mr-4"
          />
          <div>
            {isEditing ? (
              <input
                type="text"
                value={editedProfile.username}
                onChange={(e) => setEditedProfile({ ...editedProfile, username: e.target.value })}
                className="text-2xl font-semibold mb-1 border rounded px-2 py-1"
              />
            ) : (
              <h2 className="text-2xl font-semibold">{profile.username}</h2>
            )}
            <p className="text-gray-600">{profile.email}</p>
          </div>
        </div>
        <div>
          {isEditing ? (
            <div className="flex space-x-2">
              <button onClick={updateProfile} className="text-green-600 hover:text-green-800">
                <CheckIcon className="h-6 w-6" />
              </button>
              <button onClick={() => setIsEditing(false)} className="text-red-600 hover:text-red-800">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          ) : (
            <button onClick={() => setIsEditing(true)} className="text-indigo-600 hover:text-indigo-800">
              <PencilIcon className="h-6 w-6" />
            </button>
          )}
        </div>
      </div>
      {isEditing ? (
        <textarea
          value={editedProfile.bio || ''}
          onChange={(e) => setEditedProfile({ ...editedProfile, bio: e.target.value })}
          className="w-full mt-2 p-2 border rounded"
          rows={3}
          placeholder="Ajoutez une bio..."
        />
      ) : (
        <p className="mt-2 text-gray-700">{profile.bio || "Pas de bio renseignée."}</p>
      )}
      <div className="mt-4 flex justify-between items-center">
        <p className="text-sm text-gray-500">Membre depuis {new Date(profile.created_at).toLocaleDateString()}</p>
        <div className="flex items-center">
          <span className="text-xl font-semibold text-indigo-600 mr-2">Niveau {profile.level}</span>
          <div className="bg-gray-200 rounded-full h-4 w-32">
            <div 
              className="bg-indigo-600 rounded-full h-4" 
              style={{ width: `${(profile.xp % 1000) / 10}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  )
}

function AnalyticsDashboard({ analyticsData, timerStats, journalStats }: { 
  analyticsData: AnalyticsData | null,
  timerStats: TimerStats | null,
  journalStats: JournalStats | null
}) {
  if (!analyticsData) return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">Tableau de bord analytique</h2>
      <p className="text-gray-600">Aucune donnée analytique disponible pour le moment.</p>
    </div>
  )

  const goalData = [
    { name: 'Complétés', value: analyticsData.completedGoals },
    { name: 'En cours', value: analyticsData.totalGoals - analyticsData.completedGoals },
  ]

  const habitData = [
    { name: 'Actives', value: analyticsData.activeHabits },
    { name: 'Inactives', value: analyticsData.totalHabits - analyticsData.activeHabits },
  ]

  const COLORS = ['#4F46E5', '#10B981']

  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">Tableau de bord analytique</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <h3 className="text-lg font-medium mb-2">Objectifs</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={goalData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {goalData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div>
          <h3 className="text-lg font-medium mb-2">Habitudes</h3>
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
        </div>
        <div>
          <h3 className="text-lg font-medium mb-2">Progression XP</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={analyticsData.xpHistory}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="xp" stroke="#4F46E5" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="mt-6">
        <h3 className="text-lg font-medium mb-2">Complétion par catégorie</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={analyticsData.categoryCompletion}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="category" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="completed" fill="#4F46E5" name="Complétés" />
            <Bar dataKey="total" fill="#10B981" name="Total" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <h3 className="text-lg font-medium mb-2">Statistiques des minuteries</h3>
          {timerStats ? (
            <div>
              <p>Pomodoro: {timerStats.pomodoro.sessions} sessions</p>
              <p>Deep Work: {timerStats.deepWork.sessions} sessions</p>
              <p>Temps total: {formatTime(timerStats.pomodoro.totalTime + timerStats.deepWork.totalTime)}</p>
            </div>
          ) : (
            <p>Aucune donnée de minuterie disponible.</p>
          )}
        </div>
        <div>
          <h3 className="text-lg font-medium mb-2">Statistiques du journal</h3>
          {journalStats ? (
            <div>
              <p>Entrées totales: {journalStats.totalEntries}</p>
              <p>Dernière entrée: {journalStats.lastEntryDate}</p>
              <p>Tags uniques: {journalStats.uniqueTags}</p>
            </div>
          ) : (
            <p>Aucune donnée de journal disponible.</p>
          )}
        </div>
        <div>
          <p className="text-lg font-medium">Plus longue série : <span className="text-indigo-600">{analyticsData.longestStreak} jours</span></p>
        </div>
      </div>
    </div>
  )
}

function GoalsOverview({ goals }: { goals: Goal[] }) {
  if (goals.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Aperçu des Objectifs</h2>
        <p className="text-gray-600">Vous n'avez pas encore défini d'objectifs.</p>
      </div>
    )
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Aperçu des Objectifs</h2>
      <div className="space-y-4">
        {goals.slice(0, 5).map(goal => (
          <div key={goal.id} className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">{goal.title}</h3>
              <p className="text-sm text-gray-500">{goal.category} - Échéance : {new Date(goal.target_date).toLocaleDateString()}</p>
            </div>
            <div className="w-24">
              <div className="bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-indigo-600 h-2.5 rounded-full" 
                  style={{ width: `${goal.progress}%` }}
                ></div>
              </div>
              <p className="text-xs text-right mt-1">{goal.progress.toFixed(0)}%</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function HabitsOverview({ habits }: { habits: Habit[] }) {
  if (habits.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Aperçu des Habitudes</h2>
        <p className="text-gray-600">Vous n'avez pas encore créé d'habitudes.</p>
      </div>
    )
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Aperçu des Habitudes</h2>
      <div className="space-y-4">
        {habits.slice(0, 5).map(habit => (
          <div key={habit.id} className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">{habit.title}</h3>
              <p className="text-sm text-gray-500">{habit.category} - {habit.frequency}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-indigo-600">{habit.current_streak} jours</p>
              <p className="text-xs text-gray-500">Série actuelle</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ActivityFeed({ activityItems }: { activityItems: ActivityItem[] }) {
  if (activityItems.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Activité Récente</h2>
        <p className="text-gray-600">Aucune activité récente à afficher.</p>
      </div>
    )
  }

  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">Activité Récente</h2>
      <div className="space-y-4">
        {activityItems.map(item => (
          <div key={item.id} className="flex items-start">
            <div className="flex-shrink-0 mr-3">
              {item.type === 'goal_created' && <span className="text-2xl">🎯</span>}
              {item.type === 'goal_completed' && <span className="text-2xl">✅</span>}
              {item.type === 'habit_created' && <span className="text-2xl">🔁</span>}
              {item.type === 'habit_streak' && <span className="text-2xl">🔥</span>}
              {item.type === 'achievement_earned' && <span className="text-2xl">🏆</span>}
            </div>
            <div>
              <p className="text-gray-800">{item.content}</p>
              <p className="text-xs text-gray-500">{new Date(item.timestamp).toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours}h ${mins}m`
}