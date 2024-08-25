import React, { useState, useEffect } from 'react'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline'

type Category = {
  id: number
  name: string
}

export default function CategoryManager({ onCategoriesChange }: { onCategoriesChange: () => void }) {
  const supabase = useSupabaseClient()
  const [categories, setCategories] = useState<Category[]>([])
  const [newCategory, setNewCategory] = useState('')

  useEffect(() => {
    fetchCategories()
  }, [])

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

  async function addCategory() {
    if (!newCategory.trim()) return

    const { data, error } = await supabase
      .from('categories')
      .insert({ name: newCategory.trim() })
      .select()

    if (error) {
      console.error('Error adding category:', error)
    } else if (data) {
      setCategories([...categories, ...data])
      setNewCategory('')
      onCategoriesChange()
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
      onCategoriesChange()
    }
  }

  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold mb-4">Gérer les Catégories</h2>
      <div className="flex space-x-2 mb-4">
        <input
          type="text"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          placeholder="Nouvelle catégorie"
          className="flex-grow p-2 border rounded"
        />
        <button
          onClick={addCategory}
          className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-1" />
          Ajouter
        </button>
      </div>
      <ul className="space-y-2">
        {categories.map((category) => (
          <li key={category.id} className="flex justify-between items-center bg-gray-100 p-2 rounded">
            <span>{category.name}</span>
            <button
              onClick={() => deleteCategory(category.id)}
              className="text-red-600 hover:text-red-800"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}