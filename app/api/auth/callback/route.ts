import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = createRouteHandlerClient({ cookies })
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data?.user) {
      // Ensure we're capturing the Discord username
      const discordUsername = data.user.user_metadata?.full_name || 
                              data.user.user_metadata?.name ||
                              data.user.user_metadata?.preferred_username

      if (discordUsername) {
        // Update the user metadata with the Discord username
        await supabase.auth.updateUser({
          data: { username: discordUsername }
        })
      }

      console.log('User data after login:', data.user) // For debugging
    }
  }

  return NextResponse.redirect(`${requestUrl.origin}/dashboard`)
}