'use client'

import { useState, useEffect } from 'react'
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react'
import LoadingSpinner from '@/components/LoadingSpinner'

type Goal = {
  id: number
  title: string
  description: string
  progress: number
  user_id: string
}

export default function Goals() {
  const user = useUser()
  const supabase = useSupabaseClient()
  const [goals, setGoals] = useState<Goal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newGoal, setNewGoal] = useState({ title: '', description: '' })

  useEffect(() => {
    if (user) {
      fetchGoals()
    }
  }, [user])

  async function fetchGoals() {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching goals:', error)
    } else {
      setGoals(data || [])
    }
    setIsLoading(false)
  }

  async function addGoal(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return

    const { data, error } = await supabase
      .from('goals')
      .insert([
        { 
          title: newGoal.title, 
          description: newGoal.description, 
          progress: 0, 
          user_id: user.id 
        }
      ])
      .select()

    if (error) {
      console.error('Error adding goal:', error)
    } else if (data) {
      setGoals([...goals, ...data])
      setNewGoal({ title: '', description: '' })
    }
  }

  async function updateGoalProgress(goalId: number, newProgress: number) {
    const { error } = await supabase
      .from('goals')
      .update({ progress: newProgress })
      .eq('id', goalId)

    if (error) {
      console.error('Error updating goal progress:', error)
    } else {
      setGoals(goals.map(goal => 
        goal.id === goalId ? { ...goal, progress: newProgress } : goal
      ))
    }
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Mes Objectifs</h1>

      <form onSubmit={addGoal} className="mb-8 bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Ajouter un nouvel objectif</h2>
        <input
          type="text"
          placeholder="Titre de l'objectif"
          value={newGoal.title}
          onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
          className="w-full p-2 mb-4 border rounded"
          required
        />
        <textarea
          placeholder="Description"
          value={newGoal.description}
          onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
          className="w-full p-2 mb-4 border rounded"
          required
        />
        <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">
          Ajouter l'objectif
        </button>
      </form>

      <div className="space-y-6">
        {goals.map((goal) => (
          <div key={goal.id} className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-2">{goal.title}</h3>
            <p className="text-gray-600 mb-4">{goal.description}</p>
            <div className="flex items-center">
              <input
                type="range"
                min="0"
                max="100"
                value={goal.progress}
                onChange={(e) => updateGoalProgress(goal.id, Number(e.target.value))}
                className="w-full mr-4"
              />
              <span className="text-indigo-600 font-semibold">{goal.progress}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}