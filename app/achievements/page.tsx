'use client'

import { useState, useEffect } from 'react'
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react'
import LoadingSpinner from '@/components/LoadingSpinner'

type Achievement = {
  id: number
  title: string
  description: string
  icon: string
  earned: boolean
}

export default function AchievementsPage() {
  const user = useUser()
  const supabase = useSupabaseClient()
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchAchievements()
    }
  }, [user])

  async function fetchAchievements() {
    const { data, error } = await supabase
      .from('achievements')
      .select('*')
      .eq('user_id', user?.id)

    if (error) {
      console.error('Erreur lors de la récupération des succès:', error)
    } else {
      setAchievements(data || [])
    }
    setIsLoading(false)
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">Tous les Badges</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {achievements.map(achievement => (
          <div 
            key={achievement.id} 
            className={`text-center p-6 rounded-lg ${achievement.earned ? 'bg-indigo-100' : 'bg-gray-100'}`}
          >
            <div className="text-6xl mb-4">{achievement.icon}</div>
            <h3 className="font-medium text-xl mb-2">{achievement.title}</h3>
            <p className="text-gray-600 mb-4">{achievement.description}</p>
            {achievement.earned ? (
              <p className="text-indigo-600 font-semibold">Obtenu</p>
            ) : (
              <p className="text-gray-500">Non obtenu</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}