'use client'

import { useState } from 'react'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import { useRouter } from 'next/navigation'

export default function SetUsername() {
  const supabase = useSupabaseClient()
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!username) {
      setError('Please enter your Discord name.')
      return
    }

    const { error: updateError } = await supabase.auth.updateUser({
      data: { username }
    })

    if (updateError) {
      setError('Error updating username: ' + updateError.message)
    } else {
      router.push('/dashboard') // Redirect to the dashboard after setting the username
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md">
        <h2 className="text-xl mb-4">Set Your Discord Name</h2>
        {error && <p className="text-red-500">{error}</p>}
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter your Discord name"
          className="border border-gray-300 p-2 rounded mb-4 w-full"
          required
        />
        <button
          type="submit"
          className="bg-indigo-600 text-white py-2 px-4 rounded"
        >
          Submit
        </button>
      </form>
    </div>
  )
}