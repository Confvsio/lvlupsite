'use client'

import { useState, useEffect } from 'react'
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react'
import LoadingSpinner from '@/components/LoadingSpinner'
import CategoryManager from '@/components/CategoryManager'
import { PlusIcon, PencilIcon, TrashIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'

type MetricType = 'percentage' | 'number' | 'boolean' | 'time'

type Goal = {
  id: number
  title: string
  description: string
  category: string
  start_date: string
  end_date: string
  metric_type: MetricType
  current_value: number
  target_value: number
  is_completed: boolean
  user_id: string
}

type Category = {
  id: number
  name: string
}

const metricTypeOptions: { value: MetricType; label: string }[] = [
  { value: 'percentage', label: 'Pourcentage' },
  { value: 'number', label: 'Nombre' },
  { value: 'boolean', label: 'Oui/Non' },
  { value: 'time', label: 'Temps (minutes)' },
]

export default function Goals() {
  const user = useUser()
  const supabase = useSupabaseClient()
  const [goals, setGoals] = useState<Goal[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newGoal, setNewGoal] = useState<Partial<Goal>>({
    title: '',
    description: '',
    category: '',
    start_date: '',
    end_date: '',
    metric_type: 'percentage',
    current_value: 0,
    target_value: 100,
  })
  const [isAddingGoal, setIsAddingGoal] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [filter, setFilter] = useState<string>('all')
  const [sort, setSort] = useState<string>('end_date')

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
      .insert([{ ...newGoal, user_id: user.id, is_completed: false }])
      .select()

    if (error) {
      console.error('Error adding goal:', error)
    } else if (data) {
      setGoals([...data, ...goals])
      setNewGoal({
        title: '',
        description: '',
        category: '',
        start_date: '',
        end_date: '',
        metric_type: 'percentage',
        current_value: 0,
        target_value: 100,
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

  function renderMetricInput(goal: Goal) {
    switch (goal.metric_type) {
      case 'percentage':
      case 'number':
      case 'time':
        return (
          <input
            type="number"
            value={goal.current_value}
            onChange={(e) => updateGoal({ ...goal, current_value: Number(e.target.value) })}
            className="w-20 p-1 border rounded"
          />
        )
      case 'boolean':
        return (
          <input
            type="checkbox"
            checked={goal.current_value === 1}
            onChange={(e) => updateGoal({ ...goal, current_value: e.target.checked ? 1 : 0 })}
            className="form-checkbox h-5 w-5 text-indigo-600"
          />
        )
    }
  }

  function renderProgress(goal: Goal) {
    switch (goal.metric_type) {
      case 'percentage':
        return `${goal.current_value}%`
      case 'number':
      case 'time':
        return `${goal.current_value} / ${goal.target_value}`
      case 'boolean':
        return goal.current_value === 1 ? 'Complété' : 'Non complété'
    }
  }

  const filteredAndSortedGoals = goals
    .filter(goal => filter === 'all' || goal.category === filter)
    .sort((a, b) => {
      if (sort === 'alphabet') {
        return a.title.localeCompare(b.title)
      } else if (sort === 'end_date') {
        return new Date(a.end_date).getTime() - new Date(b.end_date).getTime()
      }
      return 0
    })

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Mes Objectifs</h1>

      <CategoryManager onCategoriesChange={fetchCategories} />

      <button
        onClick={() => setIsAddingGoal(true)}
        className="mb-6 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 flex items-center"
      >
        <PlusIcon className="h-5 w-5 mr-2" />
        Ajouter un nouvel objectif
      </button>

      <div className="mb-6 flex space-x-4">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="p-2 border rounded"
        >
          <option value="all">Toutes les catégories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.name}>{category.name}</option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="p-2 border rounded"
        >
          <option value="end_date">Trier par date de fin</option>
          <option value="alphabet">Trier par ordre alphabétique</option>
        </select>
      </div>

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
            className="w-full p-2 mb-4 border rounded resize-none"
            required
          />
          <select
            value={newGoal.category}
            onChange={(e) => setNewGoal({ ...newGoal, category: e.target.value })}
            className="w-full p-2 mb-4 border rounded"
            required
          >
            <option value="">Sélectionnez une catégorie</option>
            {categories.map((category) => (
              <option key={category.id} value={category.name}>{category.name}</option>
            ))}
          </select>
          <div className="flex space-x-4 mb-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700">Date de début</label>
              <input
                type="date"
                value={newGoal.start_date}
                onChange={(e) => setNewGoal({ ...newGoal, start_date: e.target.value })}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700">Date de fin</label>
              <input
                type="date"
                value={newGoal.end_date}
                onChange={(e) => setNewGoal({ ...newGoal, end_date: e.target.value })}
                className="w-full p-2 border rounded"
                required
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Type de métrique</label>
            <select
              value={newGoal.metric_type}
              onChange={(e) => setNewGoal({ ...newGoal, metric_type: e.target.value as MetricType })}
              className="w-full p-2 border rounded"
            >
              {metricTypeOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <div className="flex space-x-4 mb-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700">Valeur actuelle</label>
              <input
                type="number"
                value={newGoal.current_value}
                onChange={(e) => setNewGoal({ ...newGoal, current_value: Number(e.target.value) })}
                className="w-full p-2 border rounded"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700">Valeur cible</label>
              <input
                type="number"
                value={newGoal.target_value}
                onChange={(e) => setNewGoal({ ...newGoal, target_value: Number(e.target.value) })}
                className="w-full p-2 border rounded"
              />
            </div>
          </div>
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
        {filteredAndSortedGoals.map((goal) => (
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
                  className="w-full p-2 border rounded resize-none"
                />
                <select
                  value={editingGoal.category}
                  onChange={(e) => setEditingGoal({ ...editingGoal, category: e.target.value })}
                  className="w-full p-2 border rounded"
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.name}>{category.name}</option>
                  ))}
                </select>
                <div className="flex space-x-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700">Date de début</label>
                    <input
                      type="date"
                      value={editingGoal.start_date}
                      onChange={(e) => setEditingGoal({ ...editingGoal, start_date: e.target.value })}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700">Date de fin</label>
                    <input
                      type="date"
                      value={editingGoal.end_date}
                      onChange={(e) => setEditingGoal({ ...editingGoal, end_date: e.target.value })}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type de métrique</label>
                  <select
                    value={editingGoal.metric_type}
                    onChange={(e) => setEditingGoal({ ...editingGoal, metric_type: e.target.value as MetricType })}
                    className="w-full p-2 border rounded"
                  >
                    {metricTypeOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex space-x-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700">Valeur actuelle</label>
                    <input
                      type="number"
                      value={editingGoal.current_value}
                      onChange={(e) => setEditingGoal({ ...editingGoal, current_value: Number(e.target.value) })}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700">Valeur cible</label>
                    <input
                      type="number"
                      value={editingGoal.target_value}
                      onChange={(e) => setEditingGoal({ ...editingGoal, target_value: Number(e.target.value) })}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                </div>
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
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold">{goal.title}</h3>
                    <p className="text-gray-600">{goal.description}</p>
                  </div>
                  <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">{goal.category}</span>
                </div>
                <div className="flex justify-between items-center mb-4 text-sm text-gray-500">
                  <span>Début: {new Date(goal.start_date).toLocaleDateString()}</span>
                  <span>Fin: {new Date(goal.end_date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold">Progrès:</span>
                    {renderMetricInput(goal)}
                  </div>
                  <span className="text-indigo-600 font-semibold">{renderProgress(goal)}</span>
                </div>
                {goal.metric_type !== 'boolean' && (
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                    <div 
                      className="bg-indigo-600 h-2.5 rounded-full" 
                      style={{ width: `${(goal.current_value / goal.target_value) * 100}%` }}
                    ></div>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <div className="flex space-x-2">
                    <button onClick={() => setEditingGoal(goal)} className="text-indigo-600 hover:text-indigo-800">
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button onClick={() => deleteGoal(goal.id)} className="text-red-600 hover:text-red-800">
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                  <button 
                    onClick={() => updateGoal({ ...goal, is_completed: !goal.is_completed })}
                    className={`flex items-center space-x-1 px-3 py-1 rounded ${
                      goal.is_completed 
                        ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    {goal.is_completed ? (
                      <>
                        <CheckIcon className="h-4 w-4" />
                        <span>Complété</span>
                      </>
                    ) : (
                      <>
                        <XMarkIcon className="h-4 w-4" />
                        <span>Non complété</span>
                      </>
                    )}
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