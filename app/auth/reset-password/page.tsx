"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Link from "next/link"
import dynamic from "next/dynamic"

function ResetPasswordContent() {
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [hasSession, setHasSession] = useState<boolean | null>(null)
  const [done, setDone] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // Supabase delivers the user here from the email link with a recovery session
  useEffect(() => {
    const checkSession = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setHasSession(!!user)
    }
    checkSession()
  }, [supabase.auth])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError("Password must be at least 8 characters.")
      return
    }
    if (password !== confirm) {
      setError("Passwords do not match.")
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (error) {
      setError(error.message)
    } else {
      setDone(true)
      setTimeout(() => {
        router.push("/dashboard")
        router.refresh()
      }, 1500)
    }
  }

  if (hasSession === null) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-3 h-3 bg-[#c8ff00] animate-pulse" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      <header className="border-b border-[#262620]">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <Link href="/" className="inline-flex items-center gap-2 hover:opacity-90 transition-opacity">
            <div className="w-3 h-3 bg-[#c8ff00] animate-pulse" />
            <span className="font-display text-2xl tracking-wide text-[#f4f0e6]">WHITE 80</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-[#141411] border border-[#262620] p-6">
            <h1 className="font-display text-4xl text-[#f4f0e6] mb-6">NEW PASSWORD</h1>

            {!hasSession ? (
              <div>
                <div className="bg-[#f87171]/10 border border-[#f87171]/30 px-3 py-3 text-[#f87171] font-mono text-xs leading-relaxed mb-6">
                  This reset link is invalid or has expired. Request a new one.
                </div>
                <Link
                  href="/auth/forgot-password"
                  className="block w-full bg-[#c8ff00] hover:bg-[#d9ff4d] text-[#0a0a0a] font-mono text-sm tracking-wider py-2.5 text-center transition-colors"
                >
                  REQUEST NEW LINK
                </Link>
              </div>
            ) : done ? (
              <div className="border border-[#c8ff00]/30 bg-[#c8ff00]/5 p-4">
                <p className="font-mono text-sm text-[#c8ff00] mb-1">PASSWORD UPDATED</p>
                <p className="font-mono text-xs text-[#f4f0e6]/70">Taking you to the desk...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label htmlFor="password" className="block font-mono text-[10px] tracking-wider text-[#6e6a5e] mb-2">
                    NEW PASSWORD
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-[#262620] px-3 py-2.5 text-[#f4f0e6] font-mono text-sm focus:outline-none focus:border-[#c8ff00]/50"
                    placeholder="Minimum 8 characters"
                    minLength={8}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="confirm" className="block font-mono text-[10px] tracking-wider text-[#6e6a5e] mb-2">
                    CONFIRM PASSWORD
                  </label>
                  <input
                    id="confirm"
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-[#262620] px-3 py-2.5 text-[#f4f0e6] font-mono text-sm focus:outline-none focus:border-[#c8ff00]/50"
                    placeholder="Repeat password"
                    minLength={8}
                    required
                  />
                </div>

                {error && (
                  <div className="bg-[#f87171]/10 border border-[#f87171]/30 px-3 py-2 text-[#f87171] font-mono text-xs">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#c8ff00] hover:bg-[#d9ff4d] text-[#0a0a0a] font-mono text-sm tracking-wider py-2.5 transition-colors disabled:opacity-50"
                >
                  {loading ? "UPDATING..." : "UPDATE PASSWORD"}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default dynamic(() => Promise.resolve(ResetPasswordContent), { ssr: false })
