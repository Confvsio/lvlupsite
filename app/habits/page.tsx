'use client'

import { useState, useEffect } from 'react'
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react'
import LoadingSpinner from '@/components/LoadingSpinner'
import { PlusIcon, PencilIcon, TrashIcon, CheckIcon } from '@heroicons/react/24/outline'

type Frequency = 'daily' | 'weekly' | 'monthly'

type Habit = {
  id: number
  title: string
  description: string
  frequency: Frequency
  target_count: number
  current_streak: number
  longest_streak: number
  last_completed: string | null
  category: string
  user_id: string
}

type Category = {
  id: number
  name: string
}

const frequencyOptions: { value: Frequency; label: string }[] = [
  { value: 'daily', label: 'Quotidien' },
  { value: 'weekly', label: 'Hebdomadaire' },
  { value: 'monthly', label: 'Mensuel' },
]

export default function Habits() {
  const user = useUser()
  const supabase = useSupabaseClient()
  const [habits, setHabits] = useState<Habit[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newHabit, setNewHabit] = useState<Partial<Habit>>({
    title: '',
    description: '',
    frequency: 'daily',
    target_count: 1,
    category: '',
  })
  const [isAddingHabit, setIsAddingHabit] = useState(false)
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null)
  const [filter, setFilter] = useState<string>('all')
  const [sort, setSort] = useState<string>('streak')
  const [newCategory, setNewCategory] = useState('')

  useEffect(() => {
    if (user) {
      fetchHabits()
      fetchCategories()
    }
  }, [user])

  async function fetchHabits() {
    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', user?.id)

    if (error) {
      console.error('Error fetching habits:', error)
    } else {
      setHabits(data || [])
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

  async function addHabit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return

    const { data, error } = await supabase
      .from('habits')
      .insert([{ ...newHabit, user_id: user.id, current_streak: 0, longest_streak: 0 }])
      .select()

    if (error) {
      console.error('Error adding habit:', error)
    } else if (data) {
      setHabits([...habits, ...data])
      setNewHabit({
        title: '',
        description: '',
        frequency: 'daily',
        target_count: 1,
        category: '',
      })
      setIsAddingHabit(false)
    }
  }

  async function updateHabit(habit: Habit) {
    const { error } = await supabase
      .from('habits')
      .update(habit)
      .eq('id', habit.id)

    if (error) {
      console.error('Error updating habit:', error)
    } else {
      setHabits(habits.map(h => h.id === habit.id ? habit : h))
      setEditingHabit(null)
    }
  }

  async function deleteHabit(id: number) {
    const { error } = await supabase
      .from('habits')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting habit:', error)
    } else {
      setHabits(habits.filter(habit => habit.id !== id))
    }
  }

  async function completeHabit(habit: Habit) {
    const today = new Date().toISOString().split('T')[0]
    let newStreak = habit.current_streak + 1
    let newLongestStreak = Math.max(newStreak, habit.longest_streak)

    if (habit.last_completed) {
      const lastCompleted = new Date(habit.last_completed)
      const daysSinceLastCompleted = Math.floor((new Date().getTime() - lastCompleted.getTime()) / (1000 * 3600 * 24))

      if (
        (habit.frequency === 'daily' && daysSinceLastCompleted > 1) ||
        (habit.frequency === 'weekly' && daysSinceLastCompleted > 7) ||
        (habit.frequency === 'monthly' && daysSinceLastCompleted > 30)
      ) {
        newStreak = 1
      }
    }

    const updatedHabit = {
      ...habit,
      current_streak: newStreak,
      longest_streak: newLongestStreak,
      last_completed: today,
    }

    await updateHabit(updatedHabit)
  }

  async function addCategory() {
    if (!newCategory.trim()) return

    const { data, error } = await supabase
      .from('categories')
      .insert([{ name: newCategory.trim() }])
      .select()

    if (error) {
      console.error('Error adding category:', error)
    } else if (data) {
      setCategories([...categories, ...data])
      setNewCategory('')
    }
  }

  const filteredAndSortedHabits = habits
    .filter(habit => filter === 'all' || habit.category === filter)
    .sort((a, b) => {
      if (sort === 'alphabet') {
        return a.title.localeCompare(b.title)
      } else if (sort === 'streak') {
        return b.current_streak - a.current_streak
      }
      return 0
    })

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">Mes Habitudes</h1>

      <button
        onClick={() => setIsAddingHabit(true)}
        className="mb-6 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition duration-300 ease-in-out flex items-center"
      >
        <PlusIcon className="h-5 w-5 mr-2" />
        Ajouter une nouvelle habitude
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
          <option value="streak">Trier par série actuelle</option>
          <option value="alphabet">Trier par ordre alphabétique</option>
        </select>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Ajouter une nouvelle catégorie</h2>
        <div className="flex">
          <input
            type="text"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            className="flex-grow p-2 border rounded-l-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Nom de la catégorie"
          />
          <button
            onClick={addCategory}
            className="bg-indigo-600 text-white px-4 py-2 rounded-r-lg hover:bg-indigo-700 transition duration-300 ease-in-out"
          >
            Ajouter
          </button>
        </div>
      </div>

      {isAddingHabit && (
        <form onSubmit={addHabit} className="mb-8 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Ajouter une nouvelle habitude</h2>
          <input
            type="text"
            placeholder="Titre de l'habitude"
            value={newHabit.title}
            onChange={(e) => setNewHabit({ ...newHabit, title: e.target.value })}
            className="w-full p-2 mb-4 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            required
          />
          <textarea
            placeholder="Description"
            value={newHabit.description}
            onChange={(e) => setNewHabit({ ...newHabit, description: e.target.value })}
            className="w-full p-2 mb-4 border rounded-lg resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            rows={3}
          />
          <select
            value={newHabit.category}
            onChange={(e) => setNewHabit({ ...newHabit, category: e.target.value })}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Fréquence</label>
              <select
                value={newHabit.frequency}
                onChange={(e) => setNewHabit({ ...newHabit, frequency: e.target.value as Frequency })}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {frequencyOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Objectif (nombre de fois)</label>
              <input
                type="number"
                value={newHabit.target_count}
                onChange={(e) => setNewHabit({ ...newHabit, target_count: Number(e.target.value) })}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                min="1"
                required
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <button type="button" onClick={() => setIsAddingHabit(false)} className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400 transition duration-300 ease-in-out">
              Annuler
            </button>
            <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition duration-300 ease-in-out">
              Ajouter l'habitude
            </button>
          </div>
        </form>
      )}

<div className="space-y-6">
        {filteredAndSortedHabits.map((habit) => (
          <div key={habit.id} className="bg-white p-6 rounded-lg shadow-md">
            {editingHabit?.id === habit.id ? (
              <form onSubmit={(e) => { e.preventDefault(); updateHabit(editingHabit); }} className="space-y-4">
                <input
                  type="text"
                  value={editingHabit.title}
                  onChange={(e) => setEditingHabit({ ...editingHabit, title: e.target.value })}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <textarea
                  value={editingHabit.description}
                  onChange={(e) => setEditingHabit({ ...editingHabit, description: e.target.value })}
                  className="w-full p-2 border rounded-lg resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  rows={3}
                />
                <select
                  value={editingHabit.category}
                  onChange={(e) => setEditingHabit({ ...editingHabit, category: e.target.value })}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.name}>{category.name}</option>
                  ))}
                </select>
                <div className="flex space-x-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fréquence</label>
                    <select
                      value={editingHabit.frequency}
                      onChange={(e) => setEditingHabit({ ...editingHabit, frequency: e.target.value as Frequency })}
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      {frequencyOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Objectif (nombre de fois)</label>
                    <input
                      type="number"
                      value={editingHabit.target_count}
                      onChange={(e) => setEditingHabit({ ...editingHabit, target_count: Number(e.target.value) })}
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      min="1"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <button type="button" onClick={() => setEditingHabit(null)} className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400 transition duration-300 ease-in-out">
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
                    <h3 className="text-xl font-semibold text-gray-800">{habit.title}</h3>
                    <p className="text-gray-600">{habit.description}</p>
                  </div>
                  <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{habit.category}</span>
                </div>
                <div className="flex justify-between items-center mb-4 text-sm text-gray-500">
                  <span>Fréquence: {frequencyOptions.find(f => f.value === habit.frequency)?.label}</span>
                  <span>Objectif: {habit.target_count} fois</span>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="font-semibold">Série actuelle: </span>
                    <span className="text-indigo-600 font-bold">{habit.current_streak}</span>
                  </div>
                  <div>
                    <span className="font-semibold">Meilleure série: </span>
                    <span className="text-green-600 font-bold">{habit.longest_streak}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex space-x-2">
                    <button onClick={() => setEditingHabit(habit)} className="text-indigo-600 hover:text-indigo-800 transition duration-300 ease-in-out">
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button onClick={() => deleteHabit(habit.id)} className="text-red-600 hover:text-red-800 transition duration-300 ease-in-out">
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                  <button 
                    onClick={() => completeHabit(habit)}
                    className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition duration-300 ease-in-out flex items-center"
                  >
                    <CheckIcon className="h-5 w-5 mr-2" />
                    Marquer comme complété
                  </button>
                </div>
                {habit.last_completed && (
                  <p className="text-sm text-gray-500 mt-2">
                    Dernière complétion: {new Date(habit.last_completed).toLocaleDateString()}
                  </p>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}