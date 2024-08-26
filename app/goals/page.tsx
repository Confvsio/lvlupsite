'use client'

import { useState, useEffect } from 'react'
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react'
import LoadingSpinner from '@/components/LoadingSpinner'
import { PlusIcon, PencilIcon, TrashIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'

type Goal = {
  id: number
  title: string
  description: string
  progress: number
  target_date: string
  category: string
  user_id: string
}

type Category = {
  id: number
  name: string
}

export default function Goals() {
  const user = useUser()
  const supabase = useSupabaseClient()
  const [goals, setGoals] = useState<Goal[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newGoal, setNewGoal] = useState<Partial<Goal>>({
    title: '',
    description: '',
    progress: 0,
    target_date: '',
    category: '',
  })
  const [isAddingGoal, setIsAddingGoal] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [filter, setFilter] = useState<string>('all')
  const [sort, setSort] = useState<string>('target_date')

  useEffect(() => {
    if (user) {
      fetchGoals()
      fetchCategories()
    }
  }, [user])

  async function fetchGoals() {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', user?.id)

    if (error) {
      console.error('Error fetching goals:', error)
    } else {
      setGoals(data || [])
    }
    setIsLoading(false)
  }

  async function fetchCategories() {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching categories:', error)
    } else {
      setCategories(data || [])
    }
  }

  async function addGoal(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return

    const { data, error } = await supabase
      .from('goals')
      .insert([{ ...newGoal, user_id: user.id }])
      .select()

    if (error) {
      console.error('Error adding goal:', error)
    } else if (data) {
      setGoals([...goals, ...data])
      setNewGoal({
        title: '',
        description: '',
        progress: 0,
        target_date: '',
        category: '',
      })
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

const filteredAndSortedGoals = goals
  .filter(goal => filter === 'all' || goal.category === filter)
  .sort((a, b) => {
    if (sort === 'alphabet') {
      return a.title.localeCompare(b.title)
    } else if (sort === 'target_date') {
      return new Date(a.target_date).getTime() - new Date(b.target_date).getTime()
    } else if (sort === 'progress') {
      return b.progress - a.progress
    }
    return 0
  })

if (isLoading) {
  return <LoadingSpinner />
}

return (
  <div className="max-w-4xl mx-auto p-4">
    <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">Mes Objectifs</h1>

    <button
      onClick={() => setIsAddingGoal(true)}
      className="mb-6 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition duration-300 ease-in-out flex items-center"
    >
      <PlusIcon className="h-5 w-5 mr-2" />
      Ajouter un nouvel objectif
    </button>

    <div className="mb-6 flex flex-wrap gap-4">
      <select
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="p-2 border rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
      >
        <option value="all">Toutes les catégories</option>
        {categories.map((category) => (
          <option key={category.id} value={category.name}>{category.name}</option>
        ))}
      </select>
      <select
        value={sort}
        onChange={(e) => setSort(e.target.value)}
        className="p-2 border rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
      >
        <option value="target_date">Trier par date cible</option>
        <option value="alphabet">Trier par ordre alphabétique</option>
        <option value="progress">Trier par progrès</option>
      </select>
    </div>

    {isAddingGoal && (
      <form onSubmit={addGoal} className="mb-8 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Ajouter un nouvel objectif</h2>
        <input
          type="text"
          placeholder="Titre de l'objectif"
          value={newGoal.title}
          onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
          className="w-full p-2 mb-4 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          required
        />
        <textarea
          placeholder="Description"
          value={newGoal.description}
          onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
          className="w-full p-2 mb-4 border rounded-lg resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          rows={3}
        />
        <select
          value={newGoal.category}
          onChange={(e) => setNewGoal({ ...newGoal, category: e.target.value })}
          className="w-full p-2 mb-4 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          required
        >
          <option value="">Sélectionnez une catégorie</option>
          {categories.map((category) => (
            <option key={category.id} value={category.name}>{category.name}</option>
          ))}
        </select>
        <div className="flex space-x-4 mb-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Date cible</label>
            <input
              type="date"
              value={newGoal.target_date}
              onChange={(e) => setNewGoal({ ...newGoal, target_date: e.target.value })}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Progrès initial (%)</label>
            <input
              type="number"
              value={newGoal.progress}
              onChange={(e) => setNewGoal({ ...newGoal, progress: Number(e.target.value) })}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              min="0"
              max="100"
              required
            />
          </div>
        </div>
        <div className="flex justify-end space-x-2">
          <button type="button" onClick={() => setIsAddingGoal(false)} className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400 transition duration-300 ease-in-out">
            Annuler
          </button>
          <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition duration-300 ease-in-out">
            Ajouter l'objectif
          </button>
        </div>
      </form>
    )}

    <div className="space-y-6">
      {filteredAndSortedGoals.map((goal) => (
        <div key={goal.id} className="bg-white p-6 rounded-lg shadow-md">
          {editingGoal?.id === goal.id ? (
            <form onSubmit={(e) => { e.preventDefault(); updateGoal(editingGoal); }} className="space-y-4">
              <input
                type="text"
                value={editingGoal.title}
                onChange={(e) => setEditingGoal({ ...editingGoal, title: e.target.value })}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <textarea
                value={editingGoal.description}
                onChange={(e) => setEditingGoal({ ...editingGoal, description: e.target.value })}
                className="w-full p-2 border rounded-lg resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                rows={3}
              />
              <select
                value={editingGoal.category}
                onChange={(e) => setEditingGoal({ ...editingGoal, category: e.target.value })}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.name}>{category.name}</option>
                ))}
              </select>
              <div className="flex space-x-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date cible</label>
                  <input
                    type="date"
                    value={editingGoal.target_date}
                    onChange={(e) => setEditingGoal({ ...editingGoal, target_date: e.target.value })}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Progrès (%)</label>
                  <input
                    type="number"
                    value={editingGoal.progress}
                    onChange={(e) => setEditingGoal({ ...editingGoal, progress: Number(e.target.value) })}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    min="0"
                    max="100"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <button type="button" onClick={() => setEditingGoal(null)} className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400 transition duration-300 ease-in-out">
                  Annuler
                </button>
                <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition duration-300 ease-in-out">
                  Sauvegarder
                </button>
              </div>
            </form>
          ) : (
            <>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-800">{goal.title}</h3>
                  <p className="text-gray-600">{goal.description}</p>
                </div>
                <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{goal.category}</span>
              </div>
              <div className="flex justify-between items-center mb-4 text-sm text-gray-500">
                <span>Date cible: {new Date(goal.target_date).toLocaleDateString()}</span>
                <span>Progrès: {goal.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                <div 
                  className="bg-indigo-600 h-2.5 rounded-full" 
                  style={{ width: `${goal.progress}%` }}
                ></div>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex space-x-2">
                  <button onClick={() => setEditingGoal(goal)} className="text-indigo-600 hover:text-indigo-800 transition duration-300 ease-in-out">
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button onClick={() => deleteGoal(goal.id)} className="text-red-600 hover:text-red-800 transition duration-300 ease-in-out">
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  </div>
)
}