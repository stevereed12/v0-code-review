"use client"

import { useState, useEffect, Suspense } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"

function OnboardingContent() {
  const [step, setStep] = useState(1)
  const [polygonKey, setPolygonKey] = useState("")
  const [anthropicKey, setAnthropicKey] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checkingSession, setCheckingSession] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    // Check if user has active subscription
    const checkSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push("/auth/login")
        return
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("subscription_status, polygon_api_key, anthropic_api_key")
        .eq("id", user.id)
        .single()

      // If they already have keys, skip to dashboard
      if (profile?.polygon_api_key && profile?.anthropic_api_key) {
        router.push("/dashboard")
        return
      }

      // If no active subscription and no session_id, send to pricing
      const sessionId = searchParams.get("session_id")
      if (profile?.subscription_status !== "active" && !sessionId) {
        router.push("/pricing")
        return
      }

      // Pre-fill if they have some keys
      if (profile?.polygon_api_key) setPolygonKey(profile.polygon_api_key)
      if (profile?.anthropic_api_key) setAnthropicKey(profile.anthropic_api_key)

      setCheckingSession(false)
    }

    checkSubscription()
  }, [supabase, router, searchParams])

  const handleSaveKeys = async () => {
    if (!polygonKey.trim() || !anthropicKey.trim()) {
      setError("Both API keys are required")
      return
    }

    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      setError("Not authenticated")
      setLoading(false)
      return
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        polygon_api_key: polygonKey,
        anthropic_api_key: anthropicKey,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    router.push("/dashboard")
  }

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-[#060a10] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#00e5ff] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="font-mono text-sm text-[#3d4f6b]">Setting up your account...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#060a10] py-20 px-4">
      <div className="max-w-lg mx-auto">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-3 h-3 bg-[#00e5ff] rounded-full animate-pulse" />
            <span className="font-mono text-xl tracking-wider text-white">WHITE 80</span>
          </div>
          <p className="text-[#3d4f6b] font-mono text-sm">Almost there! Set up your API keys.</p>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-8 justify-center">
          <div className={`w-12 h-1 rounded ${step >= 1 ? "bg-[#00e5ff]" : "bg-[#131c2e]"}`} />
          <div className={`w-12 h-1 rounded ${step >= 2 ? "bg-[#00e5ff]" : "bg-[#131c2e]"}`} />
        </div>

        <div className="bg-[#0c1020] border border-[#131c2e] rounded-lg p-6">
          {step === 1 && (
            <>
              <h2 className="font-mono text-lg text-white mb-2">Polygon API Key</h2>
              <p className="text-[#3d4f6b] text-sm mb-4">
                Get real-time stock prices and options data. Free tier available.
              </p>

              <div className="bg-[#090c14] border border-[#131c2e] rounded p-4 mb-4">
                <ol className="space-y-2 text-sm text-[#d6dff0]">
                  <li className="flex gap-2">
                    <span className="text-[#00e5ff] font-mono">1.</span>
                    Go to <a href="https://polygon.io" target="_blank" rel="noopener noreferrer" className="text-[#00e5ff] hover:underline">polygon.io</a>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[#00e5ff] font-mono">2.</span>
                    Create a free account
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[#00e5ff] font-mono">3.</span>
                    Copy your API key from the dashboard
                  </li>
                </ol>
              </div>

              <input
                type="text"
                value={polygonKey}
                onChange={(e) => setPolygonKey(e.target.value)}
                className="w-full bg-[#090c14] border border-[#131c2e] rounded px-3 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-[#00e5ff]/50 mb-4"
                placeholder="Paste your Polygon API key"
              />

              <button
                onClick={() => setStep(2)}
                disabled={!polygonKey.trim()}
                className="w-full bg-[#00e5ff] hover:bg-[#00e5ff]/90 text-[#060a10] font-mono text-sm tracking-wider py-2.5 rounded transition-colors disabled:opacity-50"
              >
                CONTINUE
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="font-mono text-lg text-white mb-2">Anthropic API Key</h2>
              <p className="text-[#3d4f6b] text-sm mb-4">
                Powers all AI features - signals, briefs, thesis generation.
              </p>

              <div className="bg-[#090c14] border border-[#131c2e] rounded p-4 mb-4">
                <ol className="space-y-2 text-sm text-[#d6dff0]">
                  <li className="flex gap-2">
                    <span className="text-[#00e5ff] font-mono">1.</span>
                    Go to <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" className="text-[#00e5ff] hover:underline">console.anthropic.com</a>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[#00e5ff] font-mono">2.</span>
                    Create an account and add billing
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[#00e5ff] font-mono">3.</span>
                    Generate an API key
                  </li>
                </ol>
              </div>

              <input
                type="text"
                value={anthropicKey}
                onChange={(e) => setAnthropicKey(e.target.value)}
                className="w-full bg-[#090c14] border border-[#131c2e] rounded px-3 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-[#00e5ff]/50 mb-4"
                placeholder="Paste your Anthropic API key"
              />

              {error && (
                <div className="bg-[#f87171]/10 border border-[#f87171]/30 rounded px-3 py-2 text-[#f87171] font-mono text-xs mb-4">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 bg-[#131c2e] hover:bg-[#1a2438] text-white font-mono text-sm tracking-wider py-2.5 rounded transition-colors"
                >
                  BACK
                </button>
                <button
                  onClick={handleSaveKeys}
                  disabled={loading || !anthropicKey.trim()}
                  className="flex-1 bg-[#00e5ff] hover:bg-[#00e5ff]/90 text-[#060a10] font-mono text-sm tracking-wider py-2.5 rounded transition-colors disabled:opacity-50"
                >
                  {loading ? "SAVING..." : "COMPLETE SETUP"}
                </button>
              </div>
            </>
          )}
        </div>

        <div className="mt-6 text-center">
          <Link href="/dashboard" className="text-[#3d4f6b] font-mono text-xs hover:text-[#00e5ff]">
            Skip for now (limited features)
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#060a10] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#00e5ff] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <OnboardingContent />
    </Suspense>
  )
}
