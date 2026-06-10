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
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#c8ff00] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="font-mono text-sm text-[#6e6a5e]">Setting up your account...</p>
        </div>
      </div>
    )
  }

  const features = [
    {
      icon: FileText,
      title: "Pre-Market Brief",
      description: "Daily AI analysis of market conditions, sector rotations, and top trading opportunities before the bell.",
      color: "#c8ff00",
    },
    {
      icon: Radar,
      title: "Signal Generation",
      description: "Real-time BUY/SELL/FADE signals with entry points, targets, and stop losses for your watchlist.",
      color: "#c8ff00",
    },
    {
      icon: Target,
      title: "Options Flow",
      description: "AI-powered options plays with strike, expiry, and thesis based on current market dynamics.",
      color: "#f4f0e6",
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
    <div className="min-h-screen bg-[#0a0a0a] py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-2 hover:opacity-90 transition-opacity">
            <div className="w-3 h-3 bg-[#c8ff00] rounded-full animate-pulse" />
            <span className="font-mono text-xl tracking-wider text-white">WHITE 80</span>
          </Link>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-8 justify-center">
          {[0, 1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`w-10 h-1 rounded transition-colors ${
                step >= s ? "bg-[#c8ff00]" : "bg-[#262620]"
              }`}
            />
          ))}
        </div>

        {/* Step 0: Welcome */}
        {step === 0 && (
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#c8ff00]/10 flex items-center justify-center">
              <Check className="w-10 h-10 text-[#c8ff00]" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">Welcome to White 80</h1>
            <p className="text-[#6e6a5e] mb-8 max-w-md mx-auto">
              Your payment was successful. Let&apos;s get you set up with AI-powered trading intelligence in just a few minutes.
            </p>
            <button
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-2 bg-[#c8ff00] hover:bg-[#c8ff00]/90 text-[#0a0a0a] font-mono text-sm tracking-wider px-8 py-3 rounded transition-colors"
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
              <p className="text-[#6e6a5e]">Six powerful tools to level up your trading</p>
            </div>

            <div className="grid gap-4 mb-8">
              {features.map((feature, i) => (
                <div
                  key={i}
                  className="bg-[#141411] border border-[#262620] rounded-lg p-4 flex items-start gap-4"
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${feature.color}15` }}
                  >
                    <feature.icon className="w-5 h-5" style={{ color: feature.color }} />
                  </div>
                  <div>
                    <h3 className="font-mono text-white mb-1">{feature.title}</h3>
                    <p className="text-[#6e6a5e] text-sm">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(0)}
                className="flex-1 bg-[#262620] hover:bg-[#1e1e19] text-white font-mono text-sm tracking-wider py-3 rounded transition-colors"
              >
                BACK
              </button>
              <button
                onClick={() => setStep(2)}
                className="flex-1 bg-[#c8ff00] hover:bg-[#c8ff00]/90 text-[#0a0a0a] font-mono text-sm tracking-wider py-3 rounded transition-colors"
              >
                CONTINUE
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Polygon Key */}
        {step === 2 && (
          <div className="bg-[#141411] border border-[#262620] rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-[#c8ff00]/15 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-[#c8ff00]" />
              </div>
              <div>
                <h2 className="font-mono text-lg text-white">Polygon API Key</h2>
                <p className="text-[#6e6a5e] text-sm">For real-time stock and options data</p>
              </div>
            </div>

            {/* Why you need this */}
            <div className="bg-[#0a0a0a] border border-[#262620] rounded p-4 mb-4">
              <h4 className="text-[#c8ff00] font-mono text-xs tracking-wider mb-2">WHY POLYGON?</h4>
              <p className="text-[#f4f0e6] text-sm mb-3">
                Polygon provides the market data that powers White 80 - live prices, options chains, and historical data. Their free tier includes everything you need.
              </p>
              <ol className="space-y-3 text-sm text-[#f4f0e6]">
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#c8ff00]/15 text-[#c8ff00] font-mono text-xs flex items-center justify-center flex-shrink-0">1</span>
                  <span>
                    Go to{" "}
                    <a href="https://polygon.io" target="_blank" rel="noopener noreferrer" className="text-[#c8ff00] hover:underline inline-flex items-center gap-1">
                      polygon.io <ExternalLink className="w-3 h-3" />
                    </a>{" "}
                    and click &quot;Get your Free API Key&quot;
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#c8ff00]/15 text-[#c8ff00] font-mono text-xs flex items-center justify-center flex-shrink-0">2</span>
                  <span>Sign up with email or Google (takes 30 seconds)</span>
                </li>
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#c8ff00]/15 text-[#c8ff00] font-mono text-xs flex items-center justify-center flex-shrink-0">3</span>
                  <span>Your API key appears on the dashboard - copy it</span>
                </li>
              </ol>
            </div>

            <input
              type="text"
              value={polygonKey}
              onChange={(e) => setPolygonKey(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-[#262620] rounded px-3 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-[#c8ff00]/50 mb-4"
              placeholder="Paste your Polygon API key here"
            />

            {/* Privacy note */}
            <div className="bg-[#c8ff00]/5 border border-[#c8ff00]/20 rounded p-3 mb-4">
              <div className="flex gap-2 items-start">
                <div className="w-4 h-4 rounded-full bg-[#c8ff00]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-2.5 h-2.5 text-[#c8ff00]" />
                </div>
                <p className="text-[#c8ff00]/80 text-xs">
                  <span className="font-semibold">Your key, your account.</span> This is YOUR Polygon account. Your API key is encrypted and stored securely. We never share your keys or access your Polygon account for any other purpose.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 bg-[#262620] hover:bg-[#1e1e19] text-white font-mono text-sm tracking-wider py-2.5 rounded transition-colors"
              >
                BACK
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!polygonKey.trim()}
                className="flex-1 bg-[#c8ff00] hover:bg-[#c8ff00]/90 text-[#0a0a0a] font-mono text-sm tracking-wider py-2.5 rounded transition-colors disabled:opacity-50"
              >
                CONTINUE
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Anthropic Key */}
        {step === 3 && (
          <div className="bg-[#141411] border border-[#262620] rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-[#f4f0e6]/15 flex items-center justify-center">
                <Radar className="w-5 h-5 text-[#f4f0e6]" />
              </div>
              <div>
                <h2 className="font-mono text-lg text-white">Anthropic API Key</h2>
                <p className="text-[#6e6a5e] text-sm">Powers all AI analysis and signal generation</p>
              </div>
            </div>

            {/* Why you need this */}
            <div className="bg-[#0a0a0a] border border-[#262620] rounded p-4 mb-4">
              <h4 className="text-[#f4f0e6] font-mono text-xs tracking-wider mb-2">WHY ANTHROPIC?</h4>
              <p className="text-[#f4f0e6] text-sm mb-3">
                Anthropic&apos;s Claude AI generates your signals, briefs, and thesis analysis. Using your own key means direct access with no middleman - faster, more reliable, and you control your usage.
              </p>
              <ol className="space-y-3 text-sm text-[#f4f0e6]">
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#f4f0e6]/15 text-[#f4f0e6] font-mono text-xs flex items-center justify-center flex-shrink-0">1</span>
                  <span>
                    Go to{" "}
                    <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" className="text-[#c8ff00] hover:underline inline-flex items-center gap-1">
                      console.anthropic.com <ExternalLink className="w-3 h-3" />
                    </a>
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#f4f0e6]/15 text-[#f4f0e6] font-mono text-xs flex items-center justify-center flex-shrink-0">2</span>
                  <span>Create an account and add billing (most users spend $5-15/month)</span>
                </li>
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#f4f0e6]/15 text-[#f4f0e6] font-mono text-xs flex items-center justify-center flex-shrink-0">3</span>
                  <span>Go to Settings → API Keys → Create Key</span>
                </li>
              </ol>
            </div>

            <input
              type="text"
              value={anthropicKey}
              onChange={(e) => setAnthropicKey(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-[#262620] rounded px-3 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-[#c8ff00]/50 mb-4"
              placeholder="Paste your Anthropic API key here (starts with sk-ant-)"
            />

            {/* Privacy note */}
            <div className="bg-[#f4f0e6]/5 border border-[#f4f0e6]/20 rounded p-3 mb-4">
              <div className="flex gap-2 items-start">
                <div className="w-4 h-4 rounded-full bg-[#f4f0e6]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-2.5 h-2.5 text-[#f4f0e6]" />
                </div>
                <div className="text-[#f4f0e6]/80 text-xs">
                  <p className="mb-1">
                    <span className="font-semibold">100% private and secure.</span> Your API key is encrypted at rest and only used to make AI requests on your behalf.
                  </p>
                  <p>
                    You have full visibility into your Anthropic usage at any time through their console. Set spending limits there if you want cost controls.
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-[#f87171]/10 border border-[#f87171]/30 rounded px-3 py-2 text-[#f87171] font-mono text-xs mb-4">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="flex-1 bg-[#262620] hover:bg-[#1e1e19] text-white font-mono text-sm tracking-wider py-2.5 rounded transition-colors"
              >
                BACK
              </button>
              <button
                onClick={handleSaveKeys}
                disabled={loading || !anthropicKey.trim()}
                className="flex-1 bg-[#c8ff00] hover:bg-[#c8ff00]/90 text-[#0a0a0a] font-mono text-sm tracking-wider py-2.5 rounded transition-colors disabled:opacity-50"
              >
                {loading ? "SAVING..." : "COMPLETE SETUP"}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Complete */}
        {step === 4 && (
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#c8ff00]/10 flex items-center justify-center">
              <Check className="w-10 h-10 text-[#c8ff00]" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">You&apos;re All Set!</h1>
            <p className="text-[#6e6a5e] mb-8 max-w-md mx-auto">
              Your account is ready. Start with a Pre-Market Brief to see what&apos;s moving today.
            </p>

            <div className="bg-[#141411] border border-[#262620] rounded-lg p-6 mb-8 text-left">
              <h3 className="font-mono text-white mb-4">Quick Start Tips:</h3>
              <ul className="space-y-3 text-sm text-[#f4f0e6]">
                <li className="flex gap-2">
                  <Check className="w-4 h-4 text-[#c8ff00] flex-shrink-0 mt-0.5" />
                  Run the <span className="text-[#c8ff00]">Pre-Market Brief</span> each morning for top plays
                </li>
                <li className="flex gap-2">
                  <Check className="w-4 h-4 text-[#c8ff00] flex-shrink-0 mt-0.5" />
                  Add tickers to your <span className="text-[#c8ff00]">Watchlist</span> for real-time signals
                </li>
                <li className="flex gap-2">
                  <Check className="w-4 h-4 text-[#c8ff00] flex-shrink-0 mt-0.5" />
                  Use <span className="text-[#c8ff00]">Scout</span> to discover new opportunities by sector
                </li>
                <li className="flex gap-2">
                  <Check className="w-4 h-4 text-[#c8ff00] flex-shrink-0 mt-0.5" />
                  Track your trades in the <span className="text-[#c8ff00]">Tracker</span> tab for P/L analysis
                </li>
              </ul>
            </div>

            <button
              onClick={() => router.push("/dashboard")}
              className="inline-flex items-center gap-2 bg-[#c8ff00] hover:bg-[#c8ff00]/90 text-[#0a0a0a] font-mono text-sm tracking-wider px-8 py-3 rounded transition-colors"
            >
              GO TO DASHBOARD <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Skip link (only on API key steps) */}
        {(step === 2 || step === 3) && (
          <div className="mt-6 text-center">
            <Link href="/dashboard" className="text-[#6e6a5e] font-mono text-xs hover:text-[#c8ff00]">
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
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#c8ff00] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <OnboardingContent />
    </Suspense>
  )
}
