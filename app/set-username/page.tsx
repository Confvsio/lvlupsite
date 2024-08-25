'use client'

import { useState } from 'react'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import { useRouter } from 'next/navigation'

export default function SetUsername() {
  const supabase = useSupabaseClient()
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!username) {
      setError('Please enter your Discord name.')
      setLoading(false)
      return
    }

    const { error: updateError } = await supabase.auth.updateUser({
      data: { username }
    })

    if (updateError) {
      setError('Error updating username: ' + updateError.message)
      setLoading(false)
    } else {
      router.push('/dashboard') // Redirect to the dashboard after setting the username
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-center text-gray-800">Set Your Discord Name</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter your Discord name"
          className="border border-gray-300 p-3 rounded mb-4 w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
          required
        />
        <button
          type="submit"
          className={`bg-indigo-600 text-white py-2 px-4 rounded w-full transition duration-300 ease-in-out ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-700'}`}
          disabled={loading}
        >
          {loading ? 'Setting...' : 'Submit'}
        </button>
      </form>
    </div>
  )
}