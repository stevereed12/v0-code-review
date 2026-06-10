"use client"

import { useState, Suspense } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import dynamic from "next/dynamic"

function SignUpForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get("redirect") || "/pricing"
  const supabase = createClient()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    setLoading(true)

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    
    // If email confirmation is disabled, user is auto-confirmed and we have a session
    // Redirect to the original destination (pricing) or default to pricing
    if (data.session) {
      router.push(redirectTo)
      return
    }
    
    // Email confirmation is enabled - show success message
    setSuccess(true)
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
        {/* Header */}
        <header className="border-b border-[#262620]">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <Link href="/" className="inline-flex items-center gap-2 hover:opacity-90 transition-opacity">
              <div className="w-3 h-3 bg-[#c8ff00] rounded-full animate-pulse" />
              <span className="font-display text-2xl tracking-wide text-[#f4f0e6]">WHITE 80</span>
            </Link>
          </div>
        </header>
        
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="w-full max-w-md">
            <div className="bg-[#141411] border border-[#c8ff00]/30 rounded-lg p-6 text-center">
              <div className="w-12 h-12 bg-[#c8ff00]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-[#c8ff00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="font-mono text-lg text-white mb-2">Check Your Email</h2>
              <p className="text-[#6e6a5e] font-mono text-sm">
                We sent a confirmation link to <span className="text-[#c8ff00]">{email}</span>. 
                Click the link to activate your account.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      {/* Header */}
      <header className="border-b border-[#262620]">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <Link href="/" className="inline-flex items-center gap-2 hover:opacity-90 transition-opacity">
            <div className="w-3 h-3 bg-[#c8ff00] rounded-full animate-pulse" />
            <span className="font-display text-2xl tracking-wide text-[#f4f0e6]">WHITE 80</span>
          </Link>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          {/* Form */}
          <div className="bg-[#141411] border border-[#262620] rounded-lg p-6">
            <h1 className="font-display text-4xl text-[#f4f0e6] mb-6">CREATE ACCOUNT</h1>

          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <label className="block font-mono text-[10px] tracking-wider text-[#6e6a5e] mb-2">
                EMAIL
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-[#262620] rounded px-3 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-[#c8ff00]/50"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="block font-mono text-[10px] tracking-wider text-[#6e6a5e] mb-2">
                PASSWORD
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-[#262620] rounded px-3 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-[#c8ff00]/50"
                placeholder="••••••••"
                required
              />
            </div>

            <div>
              <label className="block font-mono text-[10px] tracking-wider text-[#6e6a5e] mb-2">
                CONFIRM PASSWORD
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-[#262620] rounded px-3 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-[#c8ff00]/50"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="bg-[#f87171]/10 border border-[#f87171]/30 rounded px-3 py-2 text-[#f87171] font-mono text-xs">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#c8ff00] hover:bg-[#c8ff00]/90 text-[#0a0a0a] font-mono text-sm tracking-wider py-2.5 rounded transition-colors disabled:opacity-50"
            >
              {loading ? "CREATING ACCOUNT..." : "CREATE ACCOUNT"}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-[#262620] text-center">
            <p className="text-[#6e6a5e] font-mono text-xs">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-[#c8ff00] hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
  )
}

function SignUpPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-3 h-3 bg-[#c8ff00] rounded-full animate-pulse" />
      </div>
    }>
      <SignUpForm />
    </Suspense>
  )
}

export default dynamic(() => Promise.resolve(SignUpPage), { ssr: false })
