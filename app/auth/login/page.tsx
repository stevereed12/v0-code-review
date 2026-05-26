"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Link from "next/link"
import dynamic from "next/dynamic"

function LoginPageContent() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

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
  )
}

// Export with dynamic to prevent prerendering
export default dynamic(() => Promise.resolve(LoginPageContent), { ssr: false })
