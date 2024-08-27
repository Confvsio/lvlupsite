'use client'

import { useState, useEffect } from 'react'
import { useForm, SubmitHandler } from 'react-hook-form'
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react'
import { PlusIcon, CalendarIcon, BookOpenIcon, TagIcon, MagnifyingGlassIcon, PencilIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline'
import LoadingSpinner from '@/components/LoadingSpinner'

type Entry = {
  id: string
  title: string
  content: string
  date: string
  tags: string[]
}

type Inputs = {
  title: string
  content: string
  tags: string
}

export default function JournalingPage() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState<'all' | 'calendar' | 'tags'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<Inputs>()
  const user = useUser()
  const supabase = useSupabaseClient()

  useEffect(() => {
    if (user) {
      fetchEntries()
    }
  }, [user])

  useEffect(() => {
    if (selectedEntry && isEditing) {
      setValue('title', selectedEntry.title)
      setValue('content', selectedEntry.content)
      setValue('tags', selectedEntry.tags.join(', '))
    }
  }, [selectedEntry, isEditing, setValue])

  async function fetchEntries() {
    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .order('date', { ascending: false })

    if (error) {
      console.error('Error fetching entries:', error)
    } else {
      setEntries(data || [])
    }
    setIsLoading(false)
  }

  const onSubmit: SubmitHandler<Inputs> = async (data) => {
    if (!user) return

    const entryData = {
      user_id: user.id,
      title: data.title,
      content: data.content,
      tags: data.tags.split(',').map(tag => tag.trim()),
      date: new Date().toISOString().split('T')[0],
    }

    if (isEditing && selectedEntry) {
      const { error } = await supabase
        .from('journal_entries')
        .update(entryData)
        .eq('id', selectedEntry.id)

      if (error) {
        console.error('Error updating entry:', error)
      } else {
        setEntries(entries.map(e => e.id === selectedEntry.id ? { ...e, ...entryData } : e))
        setSelectedEntry({ ...selectedEntry, ...entryData })
        setIsEditing(false)
      }
    } else {
      const { data: insertedData, error } = await supabase
        .from('journal_entries')
        .insert([entryData])
        .select()

      if (error) {
        console.error('Error adding entry:', error)
      } else if (insertedData) {
        setEntries([insertedData[0], ...entries])
        setSelectedEntry(insertedData[0])
      }
    }

    reset()
  }

  async function deleteEntry(id: string) {
    const { error } = await supabase
      .from('journal_entries')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting entry:', error)
    } else {
      setEntries(entries.filter(entry => entry.id !== id))
      setSelectedEntry(null)
    }
  }

  const filteredEntries = entries.filter(entry =>
    entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-full md:w-64 bg-white shadow-md p-4 overflow-y-auto">
        <h1 className="text-2xl font-bold mb-4 text-indigo-600">Mon Journal</h1>
        <button
          onClick={() => { setSelectedEntry(null); setIsEditing(true); reset(); }}
          className="w-full flex items-center justify-center px-4 py-2 mb-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition duration-300"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Nouvelle entrée
        </button>
        <div className="flex mb-4">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 py-2 text-sm font-medium ${activeTab === 'all' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500'}`}
          >
            <BookOpenIcon className="h-5 w-5 mx-auto mb-1" />
            Tous
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex-1 py-2 text-sm font-medium ${activeTab === 'calendar' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500'}`}
          >
            <CalendarIcon className="h-5 w-5 mx-auto mb-1" />
            Calendrier
          </button>
          <button
            onClick={() => setActiveTab('tags')}
            className={`flex-1 py-2 text-sm font-medium ${activeTab === 'tags' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500'}`}
          >
            <TagIcon className="h-5 w-5 mx-auto mb-1" />
            Tags
          </button>
        </div>
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-3" />
        </div>
        <div className="space-y-2">
          {filteredEntries.map(entry => (
            <div
              key={entry.id}
              onClick={() => { setSelectedEntry(entry); setIsEditing(false); }}
              className="p-3 hover:bg-gray-100 cursor-pointer rounded-md transition duration-300"
            >
              <h3 className="font-medium text-gray-800 truncate">{entry.title}</h3>
              <p className="text-sm text-gray-500">{entry.date}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 bg-white shadow-md p-6 overflow-y-auto">
        {selectedEntry && !isEditing ? (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">{selectedEntry.title}</h2>
              <div className="flex space-x-2">
                <button onClick={() => setIsEditing(true)} className="text-indigo-600 hover:text-indigo-800">
                  <PencilIcon className="h-5 w-5" />
                </button>
                <button onClick={() => deleteEntry(selectedEntry.id)} className="text-red-600 hover:text-red-800">
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
            <p className="text-gray-600 mb-4">{selectedEntry.date}</p>
            <p className="whitespace-pre-wrap text-gray-700 mb-4">{selectedEntry.content}</p>
            <div className="flex flex-wrap gap-2">
              {selectedEntry.tags.map(tag => (
                <span key={tag} className="inline-block bg-indigo-100 text-indigo-800 rounded-full px-3 py-1 text-sm font-semibold">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">{isEditing && selectedEntry ? 'Modifier l\'entrée' : 'Nouvelle entrée'}</h2>
              {isEditing && (
                <button onClick={() => setIsEditing(false)} className="text-gray-600 hover:text-gray-800">
                  <XMarkIcon className="h-5 w-5" />
                </button>
              )}
            </div>
            <div>
              <input
                type="text"
                id="title"
                {...register('title', { required: 'Le titre est requis' })}
                className="block w-full px-4 py-2 rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-xl font-bold"
                placeholder="Titre de ton entrée..."
              />
              {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
            </div>
            <div>
              <textarea
                id="content"
                rows={10}
                {...register('content', { required: 'Le contenu est requis' })}
                className="block w-full px-4 py-2 rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Raconte ta journée, tes pensées, tes rêves..."
              ></textarea>
              {errors.content && <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>}
            </div>
            <div>
              <input
                type="text"
                id="tags"
                {...register('tags')}
                className="block w-full px-4 py-2 rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Tags (séparés par des virgules)"
              />
            </div>
            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-300"
              >
                {isEditing && selectedEntry ? 'Mettre à jour l\'entrée' : 'Sauvegarder l\'entrée'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}