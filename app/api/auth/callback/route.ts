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
      // Check if the user already has a username
      const discordUsername = data.user.user_metadata?.username

      if (!discordUsername) {
        // If no username is set, redirect to a page where they can set it
        return NextResponse.redirect(`${requestUrl.origin}/set-username`)
      }
    }
  }

  return NextResponse.redirect(`${requestUrl.origin}/dashboard`)
}