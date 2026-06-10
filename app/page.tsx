import Link from "next/link"
import { TrendingUp, Radar, FileText, Search, BarChart3, Crosshair, Shield, Key, Zap } from "lucide-react"
import { MobileMenu } from "@/components/white80/mobile-menu"
import { SiteFooter } from "@/components/white80/site-footer"

const FEATURES = [
  {
    icon: Crosshair,
    color: "#fb923c",
    title: "TIER 1 SCANNER",
    desc: "Surfaces the highest-conviction setups of the day. Unusual options activity, technical breakouts, catalyst alignment. The plays that earn the call.",
    points: ["Options flow anomaly detection", "Multi-timeframe technical confluence", "Catalyst proximity scoring"],
  },
  {
    icon: TrendingUp,
    color: "#c8ff00",
    title: "AI SIGNALS",
    desc: "Decisive BUY / SELL / FADE calls on every watchlist name. Strike, expiration, target, stop. No fence-sitting.",
    points: ["Entry, target, and stop levels", "Options play recommendations", "Risk/reward analysis"],
  },
  {
    icon: FileText,
    color: "#c8ff00",
    title: "PRE-MARKET BRIEF",
    desc: "The session, read before the open. Futures, overnight catalysts, sector rotation, and your top plays — built from live market data.",
    points: ["Global macro context", "Earnings and economic calendar", "Top 3-5 plays with full thesis"],
  },
  {
    icon: Search,
    color: "#f4f0e6",
    title: "DEEP THESIS",
    desc: "Any ticker, taken apart. Bull case, bear case, key levels, sentiment, and IV-aware options structure for current conditions.",
    points: ["Bull/bear thesis breakdown", "Key support/resistance levels", "IV-aware options strategies"],
  },
  {
    icon: Radar,
    color: "#facc15",
    title: "SCOUT MODE",
    desc: "Finds the plays you have not heard of yet. Thematic scans across AI infrastructure, energy transition, biotech catalysts, and more.",
    points: ["Thematic opportunity scanning", "Market cap and horizon filters", "One-click watchlist promotion"],
  },
  {
    icon: BarChart3,
    color: "#c8ff00",
    title: "PERFORMANCE TRACKER",
    desc: "Every signal logged — taken or passed. Win rate, P&L, and the ones that would have hit. The tape does not lie, and neither does this.",
    points: ["Win/loss/missed tracking", "Realized P&L calculations", "Signal quality analysis"],
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="border-b border-[#262620] sticky top-0 bg-[#0a0a0a]/95 backdrop-blur-sm z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-[#c8ff00] animate-pulse" />
            <span className="font-display text-2xl tracking-wide text-[#f4f0e6]">WHITE 80</span>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              href="/auth/login"
              className="font-mono text-xs sm:text-sm text-[#6e6a5e] hover:text-[#f4f0e6] transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/pricing"
              className="hidden sm:block font-mono text-sm bg-[#c8ff00] hover:bg-[#d9ff4d] text-[#0a0a0a] px-4 py-2 transition-colors"
            >
              Get Started
            </Link>
            <MobileMenu isLoggedIn={false} currentPath="/" />
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-24 md:py-32 px-4 relative overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(#f4f0e6 1px, transparent 1px), linear-gradient(90deg, #f4f0e6 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div className="max-w-5xl mx-auto relative">
          <div className="inline-flex items-center gap-2 border border-[#c8ff00]/30 px-3 py-1.5 mb-10">
            <span className="w-1.5 h-1.5 bg-[#c8ff00] animate-pulse" />
            <span className="font-mono text-[10px] tracking-[0.25em] text-[#c8ff00]">AI-POWERED TRADING DESK</span>
          </div>

          <h1 className="font-display text-6xl sm:text-7xl md:text-8xl lg:text-9xl leading-[0.9] text-[#f4f0e6] mb-8 text-balance">
            INTELLIGENCE
            <br />
            IS THE <span className="text-[#c8ff00]">POSITION</span>
          </h1>

          <p className="font-mono text-sm md:text-base text-[#f4f0e6]/60 mb-12 max-w-xl leading-relaxed">
            Signals with strikes. Briefs before the bell. A research desk that reads the whole tape — so you call the
            play, not chase it.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/pricing"
              className="font-mono text-sm bg-[#c8ff00] hover:bg-[#d9ff4d] text-[#0a0a0a] px-8 py-4 text-center transition-colors"
            >
              START 7-DAY FREE TRIAL
            </Link>
            <Link
              href="#features"
              className="font-mono text-sm text-[#f4f0e6] border border-[#262620] hover:border-[#c8ff00]/50 px-8 py-4 text-center transition-colors"
            >
              SEE THE DESK
            </Link>
          </div>
          <p className="font-mono text-xs text-[#6e6a5e] mt-6">No charge for 7 days. Then $49/month. Cancel anytime.</p>
        </div>
      </section>

      {/* What is White 80 */}
      <section className="py-20 px-4 border-t border-[#262620]">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display text-4xl md:text-5xl text-[#f4f0e6] mb-2">WHAT IS WHITE 80</h2>
          <p className="font-mono text-xs tracking-[0.2em] text-[#6e6a5e] mb-10">
            INFORMATION INTELLIGENCE FOR THE SELF-DIRECTED TRADER
          </p>

          <div className="bg-[#141411] border border-[#262620] p-8">
            <p className="text-[#f4f0e6] text-lg leading-relaxed mb-6">
              White 80 is an AI research and signal desk for traders who want informed decisions without hours of
              manual analysis. A personal analyst that reads everything and never sleeps.
            </p>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="bg-[#0a0a0a] border border-[#262620] p-4">
                <h3 className="font-mono text-[#c8ff00] text-sm tracking-wider mb-3">WHAT IT IS</h3>
                <ul className="text-sm text-[#f4f0e6] space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-[#c8ff00] mt-1.5 flex-shrink-0" />
                    An intelligence platform that aggregates market data, news, and technical analysis
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-[#c8ff00] mt-1.5 flex-shrink-0" />
                    AI-generated signals and thesis research to surface opportunities
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-[#c8ff00] mt-1.5 flex-shrink-0" />A tool that sharpens your own
                    process — not a replacement for judgment
                  </li>
                </ul>
              </div>

              <div className="bg-[#0a0a0a] border border-[#262620] p-4">
                <h3 className="font-mono text-[#fb923c] text-sm tracking-wider mb-3">WHAT IT ISN&apos;T</h3>
                <ul className="text-sm text-[#f4f0e6] space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-[#f87171] mt-1.5 flex-shrink-0" />
                    Not a financial advisor or investment service
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-[#f87171] mt-1.5 flex-shrink-0" />
                    Not a guarantee of profits or trading success
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-[#f87171] mt-1.5 flex-shrink-0" />
                    Not a replacement for your own due diligence
                  </li>
                </ul>
              </div>
            </div>

            <div className="border-l-2 border-[#c8ff00] bg-[#c8ff00]/5 p-4">
              <p className="text-sm text-[#f4f0e6] leading-relaxed">
                <span className="text-[#c8ff00] font-semibold">The name:</span> In football, &quot;White 80&quot; is
                the audible — the call that changes the play at the line when you see something the defense
                doesn&apos;t. That&apos;s the platform: the information edge to call your own plays.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4 border-t border-[#262620]">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-display text-4xl md:text-5xl text-[#f4f0e6] mb-2">THE DESK</h2>
          <p className="font-mono text-xs tracking-[0.2em] text-[#6e6a5e] mb-12">
            SIX TOOLS. ONE EDGE. ZERO GUESSWORK.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-[#262620] border border-[#262620]">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-[#0a0a0a] p-6 hover:bg-[#141411] transition-colors group">
                <div
                  className="w-10 h-10 flex items-center justify-center mb-4 border"
                  style={{ borderColor: `${f.color}40`, backgroundColor: `${f.color}10` }}
                >
                  <f.icon className="w-5 h-5" style={{ color: f.color }} aria-hidden="true" />
                </div>
                <h3 className="font-display text-xl tracking-wide text-[#f4f0e6] mb-2">{f.title}</h3>
                <p className="text-sm text-[#6e6a5e] leading-relaxed mb-4">{f.desc}</p>
                <ul className="font-mono text-[11px] text-[#6e6a5e] space-y-1.5">
                  {f.points.map((p) => (
                    <li key={p} className="flex items-center gap-2">
                      <span className="w-1 h-1 flex-shrink-0" style={{ backgroundColor: f.color }} />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works - API Keys */}
      <section className="py-20 px-4 border-t border-[#262620]">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display text-4xl md:text-5xl text-[#f4f0e6] mb-2">YOUR KEYS. YOUR CONTROL.</h2>
          <p className="font-mono text-xs tracking-[0.2em] text-[#6e6a5e] mb-12 max-w-2xl">
            BRING-YOUR-OWN-API. YOUR DATA, YOUR COSTS, YOUR PRIVACY.
          </p>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-[#141411] border border-[#262620] p-6">
              <Key className="w-6 h-6 text-[#c8ff00] mb-4" aria-hidden="true" />
              <h3 className="font-mono text-[#f4f0e6] text-sm tracking-wider mb-2">YOUR API KEYS</h3>
              <p className="text-sm text-[#6e6a5e] leading-relaxed">
                You connect your own Polygon (market data) and Anthropic (AI) accounts. Your keys, your accounts — we
                never see your credentials.
              </p>
            </div>

            <div className="bg-[#141411] border border-[#262620] p-6">
              <Shield className="w-6 h-6 text-[#c8ff00] mb-4" aria-hidden="true" />
              <h3 className="font-mono text-[#f4f0e6] text-sm tracking-wider mb-2">100% PRIVATE</h3>
              <p className="text-sm text-[#6e6a5e] leading-relaxed">
                Keys are encrypted at rest and only used to make requests on your behalf. Monitor usage anytime in each
                provider&apos;s dashboard.
              </p>
            </div>

            <div className="bg-[#141411] border border-[#262620] p-6">
              <Zap className="w-6 h-6 text-[#f4f0e6] mb-4" aria-hidden="true" />
              <h3 className="font-mono text-[#f4f0e6] text-sm tracking-wider mb-2">YOU CONTROL COSTS</h3>
              <p className="text-sm text-[#6e6a5e] leading-relaxed">
                Polygon&apos;s free tier covers most users. Anthropic runs $5-15/month at typical usage. Set spending
                limits directly with each provider.
              </p>
            </div>
          </div>

          <div className="bg-[#141411] border border-[#262620] p-6">
            <h3 className="font-mono text-[#c8ff00] text-sm tracking-[0.2em] mb-6">QUICK SETUP — 5 MINUTES</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="w-6 h-6 border border-[#c8ff00]/40 text-[#c8ff00] font-mono text-xs flex items-center justify-center">
                    1
                  </span>
                  <span className="text-[#f4f0e6] font-mono text-sm">Polygon.io (Free)</span>
                </div>
                <p className="text-sm text-[#6e6a5e] ml-9 leading-relaxed">
                  Sign up at polygon.io, get your free API key instantly. Powers all market data, quotes, and options
                  chains.
                </p>
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="w-6 h-6 border border-[#f4f0e6]/40 text-[#f4f0e6] font-mono text-xs flex items-center justify-center">
                    2
                  </span>
                  <span className="text-[#f4f0e6] font-mono text-sm">Anthropic (Pay-as-you-go)</span>
                </div>
                <p className="text-sm text-[#6e6a5e] ml-9 leading-relaxed">
                  Create an account at console.anthropic.com, add billing, generate an API key. Powers all AI analysis
                  and signals.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4 border-t border-[#262620]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display text-5xl md:text-6xl text-[#f4f0e6] mb-4 text-balance">
            CALL YOUR <span className="text-[#c8ff00]">OWN PLAYS</span>
          </h2>
          <p className="font-mono text-sm text-[#6e6a5e] mb-10">
            The market opens at 9:30 either way. Walk in with the read.
          </p>
          <Link
            href="/pricing"
            className="inline-block font-mono text-sm bg-[#c8ff00] hover:bg-[#d9ff4d] text-[#0a0a0a] px-10 py-4 transition-colors"
          >
            START 7-DAY FREE TRIAL
          </Link>
          <p className="font-mono text-xs text-[#6e6a5e] mt-6">No credit card charged until trial ends. Cancel anytime.</p>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
