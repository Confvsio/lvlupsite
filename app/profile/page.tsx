'use client'

import { useState, useEffect } from 'react'
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react'
import LoadingSpinner from '@/components/LoadingSpinner'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

type UserProfile = {
  id: string
  username: string
  email: string
  avatar_url: string | null
  bio: string | null
  created_at: string
}

type AnalyticsData = {
  totalGoals: number
  completedGoals: number
  totalHabits: number
  activeHabits: number
  longestStreak: number
}

export default function ProfilePage() {
  const user = useUser()
  const supabase = useSupabaseClient()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchProfile()
      fetchAnalyticsData()
    }
  }, [user])

  async function fetchProfile() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user?.id)
      .single()

    if (error) {
      console.error('Error fetching profile:', error)
    } else {
      setProfile(data)
    }
    setIsLoading(false)
  }

  async function fetchAnalyticsData() {
    // Fetch analytics data from Supabase
    // This is a placeholder and should be replaced with actual data fetching
    setAnalyticsData({
      totalGoals: 10,
      completedGoals: 5,
      totalHabits: 8,
      activeHabits: 6,
      longestStreak: 14,
    })
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">Profil Utilisateur</h1>
      
      {/* User Information Section */}
      <UserInfoSection profile={profile} />

      {/* Analytics Dashboard */}
      <AnalyticsDashboard analyticsData={analyticsData} />

      {/* Goals Overview */}
      <GoalsOverview />

      {/* Habits Overview */}
      <HabitsOverview />

      {/* Achievement Badges */}
      <AchievementBadges />

      {/* Activity Feed */}
      <ActivityFeed />
    </div>
  )
}

function UserInfoSection({ profile }: { profile: UserProfile | null }) {
  if (!profile) return null

  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <div className="flex items-center">
        <img 
          src={profile.avatar_url || '/default-avatar.png'} 
          alt="Profile" 
          className="w-20 h-20 rounded-full mr-4"
        />
        <div>
          <h2 className="text-2xl font-semibold">{profile.username}</h2>
          <p className="text-gray-600">{profile.email}</p>
        </div>
      </div>
      <p className="mt-4 text-gray-700">{profile.bio || "Pas de bio renseignée."}</p>
      <p className="mt-2 text-sm text-gray-500">Membre depuis {new Date(profile.created_at).toLocaleDateString()}</p>
    </div>
  )
}

function AnalyticsDashboard({ analyticsData }: { analyticsData: AnalyticsData | null }) {
  if (!analyticsData) return null

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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
      </div>
      <div className="mt-4">
        <p className="text-lg font-medium">Plus longue série : <span className="text-indigo-600">{analyticsData.longestStreak} jours</span></p>
      </div>
    </div>
  )
}

function GoalsOverview() {
  // Fetch and display recent goals or goal statistics
  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">Aperçu des Objectifs</h2>
      {/* Add goal overview content here */}
    </div>
  )
}

function HabitsOverview() {
  // Fetch and display recent habits or habit statistics
  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">Aperçu des Habitudes</h2>
      {/* Add habit overview content here */}
    </div>
  )
}

function AchievementBadges() {
  // Display user's achievement badges
  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">Badges de Réussite</h2>
      {/* Add achievement badges content here */}
    </div>
  )
}

function ActivityFeed() {
  // Display recent user activity
  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">Activité Récente</h2>
      {/* Add activity feed content here */}
    </div>
  )
}