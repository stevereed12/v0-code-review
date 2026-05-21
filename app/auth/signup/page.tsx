"use client"

import { useState, Suspense } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"

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
        emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ?? 
          `${window.location.origin}/auth/callback`,
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
      <div className="min-h-screen bg-[#060a10] flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-[#0c1020] border border-[#00ffaa]/30 rounded-lg p-6 text-center">
            <div className="w-12 h-12 bg-[#00ffaa]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-[#00ffaa]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="font-mono text-lg text-white mb-2">Check Your Email</h2>
            <p className="text-[#3d4f6b] font-mono text-sm">
              We sent a confirmation link to <span className="text-[#00e5ff]">{email}</span>. 
              Click the link to activate your account.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#060a10] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-3 h-3 bg-[#00e5ff] rounded-full animate-pulse" />
            <span className="font-mono text-xl tracking-wider text-white">WHITE 80</span>
          </div>
          <p className="text-[#3d4f6b] font-mono text-sm">Trading Intelligence Platform</p>
        </div>

        {/* Form */}
        <div className="bg-[#0c1020] border border-[#131c2e] rounded-lg p-6">
          <h1 className="font-mono text-lg text-white mb-6">Create Account</h1>

          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <label className="block font-mono text-[10px] tracking-wider text-[#3d4f6b] mb-2">
                EMAIL
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#090c14] border border-[#131c2e] rounded px-3 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-[#00e5ff]/50"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="block font-mono text-[10px] tracking-wider text-[#3d4f6b] mb-2">
                PASSWORD
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#090c14] border border-[#131c2e] rounded px-3 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-[#00e5ff]/50"
                placeholder="••••••••"
                required
              />
            </div>

            <div>
              <label className="block font-mono text-[10px] tracking-wider text-[#3d4f6b] mb-2">
                CONFIRM PASSWORD
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-[#090c14] border border-[#131c2e] rounded px-3 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-[#00e5ff]/50"
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
              className="w-full bg-[#00e5ff] hover:bg-[#00e5ff]/90 text-[#060a10] font-mono text-sm tracking-wider py-2.5 rounded transition-colors disabled:opacity-50"
            >
              {loading ? "CREATING ACCOUNT..." : "CREATE ACCOUNT"}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-[#131c2e] text-center">
            <p className="text-[#3d4f6b] font-mono text-xs">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-[#00e5ff] hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SignUpPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#060a10] flex items-center justify-center">
        <div className="w-3 h-3 bg-[#00e5ff] rounded-full animate-pulse" />
      </div>
    }>
      <SignUpForm />
    </Suspense>
  )
}
