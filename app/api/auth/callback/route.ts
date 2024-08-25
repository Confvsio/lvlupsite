// app/api/auth/callback/route.ts

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
      // Check if the avatar URL is in the user metadata
      const avatarUrl = data.user.user_metadata.avatar_url

      if (avatarUrl) {
        // Update the user metadata with the avatar URL
        await supabase.auth.updateUser({
          data: { avatar_url: avatarUrl }
        })
      }
    }
  }

  // Redirect to the dashboard after successful login
  return NextResponse.redirect(`${requestUrl.origin}/dashboard`)
}