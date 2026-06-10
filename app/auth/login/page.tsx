"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Link from "next/link"
import dynamic from "next/dynamic"

function LoginPageContent() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [existingSession, setExistingSession] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  // Check if there's an existing session
  useEffect(() => {
    const checkSession = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setExistingSession(!!user)
      setCheckingSession(false)
    }
    checkSession()
  }, [supabase.auth])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setExistingSession(false)
    router.refresh()
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // Sign out any existing session first
    if (existingSession) {
      await supabase.auth.signOut()
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push("/dashboard")
      router.refresh()
    }
  }

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-3 h-3 bg-[#c8ff00] rounded-full animate-pulse" />
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
          {/* Existing session warning */}
          {existingSession && (
            <div className="bg-[#262620] border border-[#c8ff00]/30 rounded-lg p-4 mb-4">
              <p className="text-[#f4f0e6] font-mono text-sm mb-3">
                You&apos;re currently signed in to another account.
              </p>
              <button
                onClick={handleSignOut}
                className="w-full bg-[#c8ff00]/10 hover:bg-[#c8ff00]/20 text-[#c8ff00] font-mono text-sm py-2 rounded transition-colors border border-[#c8ff00]/30"
              >
                SIGN OUT & CONTINUE
              </button>
            </div>
          )}

          {/* Form */}
          <div className="bg-[#141411] border border-[#262620] rounded-lg p-6">
            <h1 className="font-display text-4xl text-[#f4f0e6] mb-6">SIGN IN</h1>

            <form onSubmit={handleLogin} className="space-y-4">
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
                <div className="flex items-center justify-between mb-2">
                  <label className="block font-mono text-[10px] tracking-wider text-[#6e6a5e]">
                    PASSWORD
                  </label>
                  <Link
                    href="/auth/forgot-password"
                    className="font-mono text-[10px] text-[#6e6a5e] hover:text-[#c8ff00] transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
                {loading ? "SIGNING IN..." : "SIGN IN"}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-[#262620] text-center">
              <p className="text-[#6e6a5e] font-mono text-xs">
                Don&apos;t have an account?{" "}
                <Link href="/auth/signup" className="text-[#c8ff00] hover:underline">
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Export with dynamic to prevent prerendering
export default dynamic(() => Promise.resolve(LoginPageContent), { ssr: false })
