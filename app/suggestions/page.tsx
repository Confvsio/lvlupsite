'use client'

import { useState, useEffect } from 'react'
import { useForm, SubmitHandler } from 'react-hook-form'
import { CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline'
import { useUser } from '@supabase/auth-helpers-react'

type Inputs = {
  category: string
  suggestion: string
}

export default function SuggestionPage() {
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isError, setIsError] = useState(false)
  const { register, handleSubmit, formState: { errors }, reset } = useForm<Inputs>()
  const user = useUser()
  const [username, setUsername] = useState<string>('')

  useEffect(() => {
    if (user) {
      const discordUsername = user.user_metadata?.username || 'Utilisateur'
      setUsername(discordUsername)
    }
  }, [user])

  const onSubmit: SubmitHandler<Inputs> = async (data) => {
    try {
      const response = await fetch('https://formspree.io/f/xzzporry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          name: username // Include the username automatically
        }),
      })

      if (response.ok) {
        setIsSubmitted(true)
        setIsError(false)
        reset()
      } else {
        setIsError(true)
      }
    } catch (error) {
      setIsError(true)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">Partage-nous tes idées !</h1>
      
      {isSubmitted && (
        <div className="mb-6 p-4 bg-green-100 text-green-700 rounded-md flex items-center">
          <CheckCircleIcon className="h-5 w-5 mr-2" />
          <span>Merci pour ta suggestion ! On va l'examiner avec attention.</span>
        </div>
      )}

      {isError && (
        <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-md flex items-center">
          <ExclamationCircleIcon className="h-5 w-5 mr-2" />
          <span>Oups ! Il y a eu un problème. Essaie encore ?</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white shadow-lg rounded-lg p-8">
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
          <select
            id="category"
            {...register('category', { required: 'Choisis une catégorie' })}
            className="block w-full px-4 py-2 rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">Choisis une catégorie</option>
            <option value="feature">Nouvelle fonctionnalité</option>
            <option value="improvement">Amélioration</option>
            <option value="bug">Rapport de bug</option>
            <option value="other">Autre</option>
          </select>
          {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>}
        </div>

        <div>
          <label htmlFor="suggestion" className="block text-sm font-medium text-gray-700 mb-1">Ta suggestion</label>
          <textarea
            id="suggestion"
            rows={4}
            {...register('suggestion', { required: 'Dis-nous ce que tu as en tête !' })}
            className="block w-full px-4 py-2 rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Ton idée ici..."
          ></textarea>
          {errors.suggestion && <p className="mt-1 text-sm text-red-600">{errors.suggestion.message}</p>}
        </div>

        <div>
          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out"
          >
            Envoyer ma suggestion
          </button>
        </div>
      </form>
    </div>
  )
}