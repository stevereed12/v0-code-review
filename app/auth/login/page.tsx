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
      <div className="min-h-screen bg-[#060a10] flex items-center justify-center">
        <div className="w-3 h-3 bg-[#00e5ff] rounded-full animate-pulse" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#060a10] flex flex-col">
      {/* Header */}
      <header className="border-b border-[#131c2e]">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <Link href="/" className="inline-flex items-center gap-2 hover:opacity-90 transition-opacity">
            <div className="w-3 h-3 bg-[#00e5ff] rounded-full animate-pulse" />
            <span className="font-mono text-lg tracking-wider text-white">WHITE 80</span>
          </Link>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          {/* Existing session warning */}
          {existingSession && (
            <div className="bg-[#131c2e] border border-[#00e5ff]/30 rounded-lg p-4 mb-4">
              <p className="text-[#d6dff0] font-mono text-sm mb-3">
                You&apos;re currently signed in to another account.
              </p>
              <button
                onClick={handleSignOut}
                className="w-full bg-[#00e5ff]/10 hover:bg-[#00e5ff]/20 text-[#00e5ff] font-mono text-sm py-2 rounded transition-colors border border-[#00e5ff]/30"
              >
                SIGN OUT & CONTINUE
              </button>
            </div>
          )}

          {/* Form */}
          <div className="bg-[#0c1020] border border-[#131c2e] rounded-lg p-6">
            <h1 className="font-mono text-lg text-white mb-6">Sign In</h1>

            <form onSubmit={handleLogin} className="space-y-4">
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
                {loading ? "SIGNING IN..." : "SIGN IN"}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-[#131c2e] text-center">
              <p className="text-[#3d4f6b] font-mono text-xs">
                Don&apos;t have an account?{" "}
                <Link href="/auth/signup" className="text-[#00e5ff] hover:underline">
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
