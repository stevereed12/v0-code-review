"use client"

import { useState, useEffect, Suspense } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { verifyCheckoutSession } from "@/app/actions/verify-checkout"
import { Radar, FileText, TrendingUp, Target, BarChart3, Crosshair, ArrowRight, Check, ExternalLink } from "lucide-react"

function OnboardingContent() {
  const [step, setStep] = useState(0) // 0 = welcome, 1 = features, 2 = polygon, 3 = anthropic, 4 = complete
  const [polygonKey, setPolygonKey] = useState("")
  const [anthropicKey, setAnthropicKey] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checkingSession, setCheckingSession] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    const checkSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push("/auth/login")
        return
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("subscription_status, polygon_api_key, anthropic_api_key, onboarding_completed")
        .eq("id", user.id)
        .single()

      // If already onboarded, go to dashboard
      if (profile?.onboarding_completed && profile?.polygon_api_key && profile?.anthropic_api_key) {
        router.push("/dashboard")
        return
      }

      // Check for checkout session ID from Stripe redirect
      const sessionId = searchParams.get("session_id")
      
      if (sessionId) {
        const result = await verifyCheckoutSession(sessionId)
        if (result.error) {
          console.error("Checkout verification failed:", result.error)
          router.push("/pricing")
          return
        }
      } else if (profile?.subscription_status !== "active") {
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
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    setStep(4) // Show completion screen
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

  const features = [
    {
      icon: FileText,
      title: "Pre-Market Brief",
      description: "Daily AI analysis of market conditions, sector rotations, and top trading opportunities before the bell.",
      color: "#00e5ff",
    },
    {
      icon: Radar,
      title: "Signal Generation",
      description: "Real-time BUY/SELL/FADE signals with entry points, targets, and stop losses for your watchlist.",
      color: "#00ffaa",
    },
    {
      icon: Target,
      title: "Options Flow",
      description: "AI-powered options plays with strike, expiry, and thesis based on current market dynamics.",
      color: "#a78bfa",
    },
    {
      icon: TrendingUp,
      title: "Scout Mode",
      description: "Discover new opportunities across AI, energy, biotech, and other high-growth sectors.",
      color: "#fb923c",
    },
    {
      icon: BarChart3,
      title: "P/L Tracking",
      description: "Track your performance, win rate, and missed opportunities with automatic signal logging.",
      color: "#f87171",
    },
    {
      icon: Crosshair,
      title: "Thesis Builder",
      description: "Generate detailed investment theses for any ticker with catalysts and risk analysis.",
      color: "#facc15",
    },
  ]

  return (
    <div className="min-h-screen bg-[#060a10] py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-3 h-3 bg-[#00e5ff] rounded-full animate-pulse" />
            <span className="font-mono text-xl tracking-wider text-white">WHITE 80</span>
          </div>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-8 justify-center">
          {[0, 1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`w-10 h-1 rounded transition-colors ${
                step >= s ? "bg-[#00e5ff]" : "bg-[#131c2e]"
              }`}
            />
          ))}
        </div>

        {/* Step 0: Welcome */}
        {step === 0 && (
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#00e5ff]/10 flex items-center justify-center">
              <Check className="w-10 h-10 text-[#00e5ff]" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">Welcome to White 80</h1>
            <p className="text-[#3d4f6b] mb-8 max-w-md mx-auto">
              Your payment was successful. Let&apos;s get you set up with AI-powered trading intelligence in just a few minutes.
            </p>
            <button
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-2 bg-[#00e5ff] hover:bg-[#00e5ff]/90 text-[#060a10] font-mono text-sm tracking-wider px-8 py-3 rounded transition-colors"
            >
              GET STARTED <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 1: Features Overview */}
        {step === 1 && (
          <div>
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Here&apos;s What You Get</h2>
              <p className="text-[#3d4f6b]">Six powerful tools to level up your trading</p>
            </div>

            <div className="grid gap-4 mb-8">
              {features.map((feature, i) => (
                <div
                  key={i}
                  className="bg-[#0c1020] border border-[#131c2e] rounded-lg p-4 flex items-start gap-4"
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${feature.color}15` }}
                  >
                    <feature.icon className="w-5 h-5" style={{ color: feature.color }} />
                  </div>
                  <div>
                    <h3 className="font-mono text-white mb-1">{feature.title}</h3>
                    <p className="text-[#3d4f6b] text-sm">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(0)}
                className="flex-1 bg-[#131c2e] hover:bg-[#1a2438] text-white font-mono text-sm tracking-wider py-3 rounded transition-colors"
              >
                BACK
              </button>
              <button
                onClick={() => setStep(2)}
                className="flex-1 bg-[#00e5ff] hover:bg-[#00e5ff]/90 text-[#060a10] font-mono text-sm tracking-wider py-3 rounded transition-colors"
              >
                CONTINUE
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Polygon Key */}
        {step === 2 && (
          <div className="bg-[#0c1020] border border-[#131c2e] rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-[#00ffaa]/15 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-[#00ffaa]" />
              </div>
              <div>
                <h2 className="font-mono text-lg text-white">Polygon API Key</h2>
                <p className="text-[#3d4f6b] text-sm">For real-time stock and options data</p>
              </div>
            </div>

            <div className="bg-[#090c14] border border-[#131c2e] rounded p-4 mb-4">
              <ol className="space-y-3 text-sm text-[#d6dff0]">
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#00e5ff]/15 text-[#00e5ff] font-mono text-xs flex items-center justify-center flex-shrink-0">1</span>
                  <span>
                    Go to{" "}
                    <a href="https://polygon.io" target="_blank" rel="noopener noreferrer" className="text-[#00e5ff] hover:underline inline-flex items-center gap-1">
                      polygon.io <ExternalLink className="w-3 h-3" />
                    </a>
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#00e5ff]/15 text-[#00e5ff] font-mono text-xs flex items-center justify-center flex-shrink-0">2</span>
                  <span>Create a free account (free tier works great)</span>
                </li>
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#00e5ff]/15 text-[#00e5ff] font-mono text-xs flex items-center justify-center flex-shrink-0">3</span>
                  <span>Copy your API key from the dashboard</span>
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

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 bg-[#131c2e] hover:bg-[#1a2438] text-white font-mono text-sm tracking-wider py-2.5 rounded transition-colors"
              >
                BACK
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!polygonKey.trim()}
                className="flex-1 bg-[#00e5ff] hover:bg-[#00e5ff]/90 text-[#060a10] font-mono text-sm tracking-wider py-2.5 rounded transition-colors disabled:opacity-50"
              >
                CONTINUE
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Anthropic Key */}
        {step === 3 && (
          <div className="bg-[#0c1020] border border-[#131c2e] rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-[#a78bfa]/15 flex items-center justify-center">
                <Radar className="w-5 h-5 text-[#a78bfa]" />
              </div>
              <div>
                <h2 className="font-mono text-lg text-white">Anthropic API Key</h2>
                <p className="text-[#3d4f6b] text-sm">Powers all AI features (signals, briefs, thesis)</p>
              </div>
            </div>

            <div className="bg-[#090c14] border border-[#131c2e] rounded p-4 mb-4">
              <ol className="space-y-3 text-sm text-[#d6dff0]">
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#00e5ff]/15 text-[#00e5ff] font-mono text-xs flex items-center justify-center flex-shrink-0">1</span>
                  <span>
                    Go to{" "}
                    <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" className="text-[#00e5ff] hover:underline inline-flex items-center gap-1">
                      console.anthropic.com <ExternalLink className="w-3 h-3" />
                    </a>
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#00e5ff]/15 text-[#00e5ff] font-mono text-xs flex items-center justify-center flex-shrink-0">2</span>
                  <span>Create an account and add billing ($5-10 credit recommended)</span>
                </li>
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#00e5ff]/15 text-[#00e5ff] font-mono text-xs flex items-center justify-center flex-shrink-0">3</span>
                  <span>Generate an API key under Settings → API Keys</span>
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
                onClick={() => setStep(2)}
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
          </div>
        )}

        {/* Step 4: Complete */}
        {step === 4 && (
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#00ffaa]/10 flex items-center justify-center">
              <Check className="w-10 h-10 text-[#00ffaa]" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">You&apos;re All Set!</h1>
            <p className="text-[#3d4f6b] mb-8 max-w-md mx-auto">
              Your account is ready. Start with a Pre-Market Brief to see what&apos;s moving today.
            </p>

            <div className="bg-[#0c1020] border border-[#131c2e] rounded-lg p-6 mb-8 text-left">
              <h3 className="font-mono text-white mb-4">Quick Start Tips:</h3>
              <ul className="space-y-3 text-sm text-[#d6dff0]">
                <li className="flex gap-2">
                  <Check className="w-4 h-4 text-[#00ffaa] flex-shrink-0 mt-0.5" />
                  Run the <span className="text-[#00e5ff]">Pre-Market Brief</span> each morning for top plays
                </li>
                <li className="flex gap-2">
                  <Check className="w-4 h-4 text-[#00ffaa] flex-shrink-0 mt-0.5" />
                  Add tickers to your <span className="text-[#00e5ff]">Watchlist</span> for real-time signals
                </li>
                <li className="flex gap-2">
                  <Check className="w-4 h-4 text-[#00ffaa] flex-shrink-0 mt-0.5" />
                  Use <span className="text-[#00e5ff]">Scout</span> to discover new opportunities by sector
                </li>
                <li className="flex gap-2">
                  <Check className="w-4 h-4 text-[#00ffaa] flex-shrink-0 mt-0.5" />
                  Track your trades in the <span className="text-[#00e5ff]">Tracker</span> tab for P/L analysis
                </li>
              </ul>
            </div>

            <button
              onClick={() => router.push("/dashboard")}
              className="inline-flex items-center gap-2 bg-[#00e5ff] hover:bg-[#00e5ff]/90 text-[#060a10] font-mono text-sm tracking-wider px-8 py-3 rounded transition-colors"
            >
              GO TO DASHBOARD <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Skip link (only on API key steps) */}
        {(step === 2 || step === 3) && (
          <div className="mt-6 text-center">
            <Link href="/dashboard" className="text-[#3d4f6b] font-mono text-xs hover:text-[#00e5ff]">
              Skip for now (limited features)
            </Link>
          </div>
        )}
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
