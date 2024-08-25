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
      const avatarUrl = data.user.user_metadata?.avatar_url

      if (avatarUrl) {
        try {
          const avatarResponse = await fetch(avatarUrl)
          const avatarBlob = await avatarResponse.blob()

          const { data: uploadData, error: uploadError } = await supabase
            .storage
            .from('avatars')
            .upload(`${data.user.id}.png`, avatarBlob, {
              upsert: true
            })

          if (uploadError) {
            console.error('Error uploading avatar:', uploadError)
          }
        } catch (error) {
          console.error('Error fetching or uploading avatar:', error)
        }
      }
    }
  }

  // Redirect to the dashboard after successful login
  return NextResponse.redirect(`${requestUrl.origin}/dashboard`)
}