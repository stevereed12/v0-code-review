import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'
  const error_description = searchParams.get('error_description')

  // Handle error from Supabase (e.g., expired link)
  if (error_description) {
    const errorUrl = new URL('/auth/error', origin)
    errorUrl.searchParams.set('message', error_description)
    return NextResponse.redirect(errorUrl)
  }

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Successfully authenticated - redirect to onboarding or dashboard
      return NextResponse.redirect(`${origin}/onboarding?from=signup`)
    }
    
    // Exchange failed
    const errorUrl = new URL('/auth/error', origin)
    errorUrl.searchParams.set('message', error.message)
    return NextResponse.redirect(errorUrl)
  }

  // No code provided
  const errorUrl = new URL('/auth/error', origin)
  errorUrl.searchParams.set('message', 'No authentication code provided')
  return NextResponse.redirect(errorUrl)
}
