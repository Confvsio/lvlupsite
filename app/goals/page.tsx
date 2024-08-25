'use client'

import { useState, useEffect } from 'react'
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react'
import LoadingSpinner from '@/components/LoadingSpinner'
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'

type Goal = {
  id: number
  title: string
  description: string
  progress: number
  target_date: string
  category: string
  user_id: string
}

export default function Goals() {
  const user = useUser()
  const supabase = useSupabaseClient()
  const [goals, setGoals] = useState<Goal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newGoal, setNewGoal] = useState({ title: '', description: '', category: '', target_date: '' })
  const [isAddingGoal, setIsAddingGoal] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)

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
          user_id: user.id,
          category: newGoal.category,
          target_date: newGoal.target_date
        }
      ])
      .select()

    if (error) {
      console.error('Error adding goal:', error)
    } else if (data) {
      setGoals([...data, ...goals])
      setNewGoal({ title: '', description: '', category: '', target_date: '' })
      setIsAddingGoal(false)
    }
  }

  async function updateGoal(goal: Goal) {
    const { error } = await supabase
      .from('goals')
      .update(goal)
      .eq('id', goal.id)

    if (error) {
      console.error('Error updating goal:', error)
    } else {
      setGoals(goals.map(g => g.id === goal.id ? goal : g))
      setEditingGoal(null)
    }
  }

  async function deleteGoal(id: number) {
    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting goal:', error)
    } else {
      setGoals(goals.filter(goal => goal.id !== id))
    }
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Mes Objectifs</h1>

      <button
        onClick={() => setIsAddingGoal(true)}
        className="mb-6 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 flex items-center"
      >
        <PlusIcon className="h-5 w-5 mr-2" />
        Ajouter un nouvel objectif
      </button>

      {isAddingGoal && (
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
          <input
            type="text"
            placeholder="Catégorie"
            value={newGoal.category}
            onChange={(e) => setNewGoal({ ...newGoal, category: e.target.value })}
            className="w-full p-2 mb-4 border rounded"
          />
          <input
            type="date"
            value={newGoal.target_date}
            onChange={(e) => setNewGoal({ ...newGoal, target_date: e.target.value })}
            className="w-full p-2 mb-4 border rounded"
          />
          <div className="flex justify-end space-x-2">
            <button type="button" onClick={() => setIsAddingGoal(false)} className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400">
              Annuler
            </button>
            <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">
              Ajouter l'objectif
            </button>
          </div>
        </form>
      )}

      <div className="space-y-6">
        {goals.map((goal) => (
          <div key={goal.id} className="bg-white p-6 rounded-lg shadow">
            {editingGoal?.id === goal.id ? (
              <form onSubmit={(e) => { e.preventDefault(); updateGoal(editingGoal); }} className="space-y-4">
                <input
                  type="text"
                  value={editingGoal.title}
                  onChange={(e) => setEditingGoal({ ...editingGoal, title: e.target.value })}
                  className="w-full p-2 border rounded"
                />
                <textarea
                  value={editingGoal.description}
                  onChange={(e) => setEditingGoal({ ...editingGoal, description: e.target.value })}
                  className="w-full p-2 border rounded"
                />
                <input
                  type="text"
                  value={editingGoal.category}
                  onChange={(e) => setEditingGoal({ ...editingGoal, category: e.target.value })}
                  className="w-full p-2 border rounded"
                />
                <input
                  type="date"
                  value={editingGoal.target_date}
                  onChange={(e) => setEditingGoal({ ...editingGoal, target_date: e.target.value })}
                  className="w-full p-2 border rounded"
                />
                <div className="flex justify-end space-x-2">
                  <button type="button" onClick={() => setEditingGoal(null)} className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400">
                    Annuler
                  </button>
                  <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">
                    Sauvegarder
                  </button>
                </div>
              </form>
            ) : (
              <>
                <h3 className="text-xl font-semibold mb-2">{goal.title}</h3>
                <p className="text-gray-600 mb-4">{goal.description}</p>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm text-gray-500">Catégorie: {goal.category}</span>
                  <span className="text-sm text-gray-500">Date cible: {new Date(goal.target_date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="w-full mr-4">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={goal.progress}
                      onChange={(e) => updateGoal({ ...goal, progress: Number(e.target.value) })}
                      className="w-full"
                    />
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-500">0%</span>
                      <span className="text-xs text-gray-500">100%</span>
                    </div>
                  </div>
                  <span className="text-indigo-600 font-semibold">{goal.progress}%</span>
                </div>
                <div className="flex justify-end space-x-2 mt-4">
                  <button onClick={() => setEditingGoal(goal)} className="text-indigo-600 hover:text-indigo-800">
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button onClick={() => deleteGoal(goal.id)} className="text-red-600 hover:text-red-800">
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}