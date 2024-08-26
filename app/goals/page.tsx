'use client'

import { useState, useEffect } from 'react'
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react'
import LoadingSpinner from '@/components/LoadingSpinner'
import { PlusIcon, PencilIcon, TrashIcon, CheckIcon, XMarkIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline'

type MetricType = 'percentage' | 'number' | 'boolean' | 'time'

type Goal = {
  id: number
  title: string
  description: string
  metric_type: MetricType
  current_value: number
  target_value: number
  target_date: string
  category: string
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
    metric_type: 'percentage',
    current_value: 0,
    target_value: 100,
    target_date: '',
    category: '',
  })
  const [isAddingGoal, setIsAddingGoal] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [filter, setFilter] = useState<string>('all')
  const [sort, setSort] = useState<string>('target_date')
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [newCategory, setNewCategory] = useState('')
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)

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
        metric_type: 'percentage',
        current_value: 0,
        target_value: 100,
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

  async function updateCategory(category: Category) {
    const { error } = await supabase
      .from('categories')
      .update(category)
      .eq('id', category.id)

    if (error) {
      console.error('Error updating category:', error)
    } else {
      setCategories(categories.map(c => c.id === category.id ? category : c))
      setEditingCategory(null)
    }
  }

  async function deleteCategory(id: number) {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting category:', error)
    } else {
      setCategories(categories.filter(category => category.id !== id))
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
        return (b.current_value / b.target_value) - (a.current_value / a.target_value)
      }
      return 0
    })

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

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">Mes Objectifs</h1>

      <div className="flex justify-between mb-6">
        <button
          onClick={() => setIsAddingGoal(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition duration-300 ease-in-out flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Ajouter un nouvel objectif
        </button>

        <button
          onClick={() => setIsCategoryModalOpen(true)}
          className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition duration-300 ease-in-out flex items-center"
        >
          <AdjustmentsHorizontalIcon className="h-5 w-5 mr-2" />
          Gérer les catégories
        </button>
      </div>

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
              <label className="block text-sm font-medium text-gray-700 mb-1">Type de métrique</label>
              <select
                value={newGoal.metric_type}
                onChange={(e) => setNewGoal({ ...newGoal, metric_type: e.target.value as MetricType })}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {metricTypeOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex space-x-4 mb-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Valeur actuelle</label>
              <input
                type="number"
                value={newGoal.current_value}
                onChange={(e) => setNewGoal({ ...newGoal, current_value: Number(e.target.value) })}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Valeur cible</label>
              <input
                type="number"
                value={newGoal.target_value}
                onChange={(e) => setNewGoal({ ...newGoal, target_value: Number(e.target.value) })}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type de métrique</label>
                    <select
                      value={editingGoal.metric_type}
                      onChange={(e) => setEditingGoal({ ...editingGoal, metric_type: e.target.value as MetricType })}
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      {metricTypeOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex space-x-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Valeur actuelle</label>
                    <input
                      type="number"
                      value={editingGoal.current_value}
                      onChange={(e) => setEditingGoal({ ...editingGoal, current_value: Number(e.target.value) })}
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Valeur cible</label>
                    <input
                      type="number"
                      value={editingGoal.target_value}
                      onChange={(e) => setEditingGoal({ ...editingGoal, target_value: Number(e.target.value) })}
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
                  <span>Type: {metricTypeOptions.find(o => o.value === goal.metric_type)?.label}</span>
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
                    <button onClick={() => setEditingGoal(goal)} className="text-indigo-600 hover:text-indigo-800 transition duration-300 ease-in-out">
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button onClick={() => deleteGoal(goal.id)} className="text-red-600 hover:text-red-800 transition duration-300 ease-in-out">
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                  <button 
                    onClick={() => updateGoal({ ...goal, current_value: goal.target_value })}
                    className={`flex items-center space-x-1 px-3 py-1 rounded-lg transition duration-300 ease-in-out ${
                      goal.current_value === goal.target_value 
                        ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    {goal.current_value === goal.target_value ? (
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

      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full" id="my-modal">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Gérer les catégories</h3>
              <div className="mt-2 px-7 py-3">
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Nouvelle catégorie"
                />
                <button
                  onClick={addCategory}
                  className="mt-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition duration-300 ease-in-out w-full"
                >
                  Ajouter une catégorie
                </button>
                <div className="mt-4 space-y-2">
                  {categories.map((category) => (
                    <div key={category.id} className="flex justify-between items-center">
                      {editingCategory?.id === category.id ? (
                        <input
                          type="text"
                          value={editingCategory.name}
                          onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                          className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      ) : (
                        <span>{category.name}</span>
                      )}
                      <div className="flex space-x-2">
                        {editingCategory?.id === category.id ? (
                          <>
                            <button onClick={() => updateCategory(editingCategory)} className="text-green-600 hover:text-green-800">
                              <CheckIcon className="h-5 w-5" />
                            </button>
                            <button onClick={() => setEditingCategory(null)} className="text-red-600 hover:text-red-800">
                              <XMarkIcon className="h-5 w-5" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => setEditingCategory(category)} className="text-indigo-600 hover:text-indigo-800">
                              <PencilIcon className="h-5 w-5" />
                            </button>
                            <button onClick={() => deleteCategory(category.id)} className="text-red-600 hover:text-red-800">
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="items-center px-4 py-3">
                <button
                  id="ok-btn"
                  className="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  onClick={() => setIsCategoryModalOpen(false)}
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}