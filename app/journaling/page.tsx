'use client'

import { useState, useEffect } from 'react'
import { useForm, SubmitHandler } from 'react-hook-form'
import { PlusIcon, CalendarIcon, BookOpenIcon, TagIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'

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
  const [activeTab, setActiveTab] = useState<'all' | 'calendar' | 'tags'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const { register, handleSubmit, formState: { errors }, reset } = useForm<Inputs>()

  useEffect(() => {
    // Fetch entries from API or local storage
    const fetchedEntries = [
      { id: '1', title: 'Mon premier jour', content: 'Aujourd\'hui était une journée productive...', date: '2023-05-01', tags: ['travail', 'productivité'] },
      { id: '2', title: 'Réflexions sur la gratitude', content: 'Je suis reconnaissant pour...', date: '2023-05-02', tags: ['gratitude', 'réflexion'] },
    ]
    setEntries(fetchedEntries)
  }, [])

  const onSubmit: SubmitHandler<Inputs> = (data) => {
    const newEntry: Entry = {
      id: Date.now().toString(),
      title: data.title,
      content: data.content,
      date: new Date().toISOString().split('T')[0],
      tags: data.tags.split(',').map(tag => tag.trim())
    }
    setEntries([newEntry, ...entries])
    reset()
  }

  const filteredEntries = entries.filter(entry =>
    entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-md">
        <div className="p-4">
          <h1 className="text-2xl font-bold mb-4">Mon Journal</h1>
          <button
            onClick={() => setSelectedEntry(null)}
            className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Nouvelle entrée
          </button>
        </div>
        <div className="flex border-b">
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
        <div className="p-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-md"
            />
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-3" />
          </div>
        </div>
        <div className="overflow-y-auto h-full">
          {filteredEntries.map(entry => (
            <div
              key={entry.id}
              onClick={() => setSelectedEntry(entry)}
              className="p-4 hover:bg-gray-100 cursor-pointer"
            >
              <h3 className="font-medium">{entry.title}</h3>
              <p className="text-sm text-gray-500">{entry.date}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 p-8 overflow-y-auto">
        {selectedEntry ? (
          <div>
            <h2 className="text-2xl font-bold mb-4">{selectedEntry.title}</h2>
            <p className="text-gray-600 mb-4">{selectedEntry.date}</p>
            <p className="whitespace-pre-wrap">{selectedEntry.content}</p>
            <div className="mt-4">
              {selectedEntry.tags.map(tag => (
                <span key={tag} className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
              <input
                type="text"
                id="title"
                {...register('title', { required: 'Le titre est requis' })}
                className="block w-full px-4 py-2 rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
              {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
            </div>
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">Contenu</label>
              <textarea
                id="content"
                rows={10}
                {...register('content', { required: 'Le contenu est requis' })}
                className="block w-full px-4 py-2 rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              ></textarea>
              {errors.content && <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>}
            </div>
            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">Tags (séparés par des virgules)</label>
              <input
                type="text"
                id="tags"
                {...register('tags')}
                className="block w-full px-4 py-2 rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Enregistrer l'entrée
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}