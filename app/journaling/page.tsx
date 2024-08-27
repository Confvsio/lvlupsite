'use client'

import { useState } from 'react'
import { useForm, SubmitHandler } from 'react-hook-form'
import { CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline'

type Inputs = {
  title: string
  content: string
}

export default function JournalingPage() {
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isError, setIsError] = useState(false)
  const { register, handleSubmit, formState: { errors }, reset } = useForm<Inputs>()

  const onSubmit: SubmitHandler<Inputs> = async (data) => {
    try {
      // Here you can handle the submission logic, like sending to an API
      console.log(data); // For demonstration, we log the data
      setIsSubmitted(true)
      setIsError(false)
      reset()
    } catch (error) {
      setIsError(true)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">Mon Journal</h1>
      
      {isSubmitted && (
        <div className="mb-6 p-4 bg-green-100 text-green-700 rounded-md flex items-center">
          <CheckCircleIcon className="h-5 w-5 mr-2" />
          <span>Merci pour votre entrée !</span>
        </div>
      )}

      {isError && (
        <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-md flex items-center">
          <ExclamationCircleIcon className="h-5 w-5 mr-2" />
          <span>Une erreur s'est produite. Veuillez réessayer.</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white shadow-lg rounded-lg p-8">
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
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">Votre réflexion</label>
          <textarea
            id="content"
            rows={6}
            {...register('content', { required: 'Le contenu est requis' })}
            className="block w-full px-4 py-2 rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Écrivez vos pensées, gratitude, ou réflexions ici..."
          ></textarea>
          {errors.content && <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>}
        </div>

        <div>
          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out"
          >
            Enregistrer mon entrée
          </button>
        </div>
      </form>
    </div>
  )
}