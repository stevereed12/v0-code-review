"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import dynamic from "next/dynamic"

function ForgotPasswordContent() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })

    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
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
            <h1 className="font-display text-4xl text-[#f4f0e6] mb-2">RESET PASSWORD</h1>
            <p className="font-mono text-xs text-[#6e6a5e] mb-6 leading-relaxed">
              Enter your email and we&apos;ll send you a link to reset your password.
            </p>

            {sent ? (
              <div className="border border-[#c8ff00]/30 bg-[#c8ff00]/5 p-4">
                <p className="font-mono text-sm text-[#c8ff00] mb-2">CHECK YOUR EMAIL</p>
                <p className="font-mono text-xs text-[#f4f0e6]/70 leading-relaxed">
                  If an account exists for {email}, a reset link is on its way. The link expires in one hour.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label htmlFor="email" className="block font-mono text-[10px] tracking-wider text-[#6e6a5e] mb-2">
                    EMAIL
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-[#262620] px-3 py-2.5 text-[#f4f0e6] font-mono text-sm focus:outline-none focus:border-[#c8ff00]/50"
                    placeholder="you@example.com"
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
                  {loading ? "SENDING..." : "SEND RESET LINK"}
                </button>
              </form>
            )}

            <div className="mt-6 pt-6 border-t border-[#262620] text-center">
              <p className="text-[#6e6a5e] font-mono text-xs">
                Remembered it?{" "}
                <Link href="/auth/login" className="text-[#c8ff00] hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default dynamic(() => Promise.resolve(ForgotPasswordContent), { ssr: false })
