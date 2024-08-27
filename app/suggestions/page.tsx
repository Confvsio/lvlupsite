'use client'

import { useState } from 'react'
import { useForm, SubmitHandler } from 'react-hook-form'
import { CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline'

type Inputs = {
  name: string
  category: string
  suggestion: string
}

export default function SuggestionPage() {
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isError, setIsError] = useState(false)
  const { register, handleSubmit, formState: { errors }, reset } = useForm<Inputs>()

  const onSubmit: SubmitHandler<Inputs> = async (data) => {
    try {
      const response = await fetch('https://formspree.io/f/xzzporry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
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
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">Faites-nous part de vos suggestions</h1>
      
      {isSubmitted && (
        <div className="mb-6 p-4 bg-green-100 text-green-700 rounded-md flex items-center">
          <CheckCircleIcon className="h-5 w-5 mr-2" />
          <span>Merci pour votre suggestion ! Nous l'examinerons attentivement.</span>
        </div>
      )}

      {isError && (
        <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-md flex items-center">
          <ExclamationCircleIcon className="h-5 w-5 mr-2" />
          <span>Une erreur s'est produite. Veuillez réessayer plus tard.</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white shadow-md rounded-lg p-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nom</label>
          <input
            type="text"
            id="name"
            {...register('name', { required: 'Le nom est requis' })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700">Catégorie</label>
          <select
            id="category"
            {...register('category', { required: 'La catégorie est requise' })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          >
            <option value="">Sélectionnez une catégorie</option>
            <option value="feature">Nouvelle fonctionnalité</option>
            <option value="improvement">Amélioration</option>
            <option value="bug">Rapport de bug</option>
            <option value="other">Autre</option>
          </select>
          {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>}
        </div>

        <div>
          <label htmlFor="suggestion" className="block text-sm font-medium text-gray-700">Votre suggestion</label>
          <textarea
            id="suggestion"
            rows={4}
            {...register('suggestion', { required: 'La suggestion est requise' })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          ></textarea>
          {errors.suggestion && <p className="mt-1 text-sm text-red-600">{errors.suggestion.message}</p>}
        </div>

        <div>
          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Envoyer la suggestion
          </button>
        </div>
      </form>
    </div>
  )
}