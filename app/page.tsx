import Link from "next/link"
import { TrendingUp, Radar, FileText, Search, BarChart3, Crosshair, Shield, Key, Zap } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#060a10]">
      {/* Header */}
      <header className="border-b border-[#131c2e]">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-[#00e5ff] rounded-full animate-pulse" />
            <span className="font-mono text-lg tracking-wider text-white">WHITE 80</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/auth/login"
              className="font-mono text-sm text-[#3d4f6b] hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/pricing"
              className="font-mono text-sm bg-[#00e5ff] hover:bg-[#00e5ff]/90 text-[#060a10] px-4 py-2 rounded transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-[#00e5ff]/10 border border-[#00e5ff]/20 rounded-full px-4 py-1.5 mb-8">
            <span className="w-2 h-2 bg-[#00ffaa] rounded-full animate-pulse" />
            <span className="font-mono text-xs text-[#00e5ff]">AI-POWERED TRADING INTELLIGENCE</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Trade Smarter,<br />
            <span className="text-[#00e5ff]">Not Harder</span>
          </h1>
          
          <p className="text-lg text-[#3d4f6b] mb-10 max-w-2xl mx-auto">
            AI-generated trading signals, pre-market briefings, options flow analysis, 
            and deep thesis research. Everything you need to make informed decisions.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/pricing"
              className="font-mono text-sm bg-[#00e5ff] hover:bg-[#00e5ff]/90 text-[#060a10] px-8 py-3 rounded transition-colors"
            >
              START FREE TRIAL
            </Link>
            <Link
              href="#features"
              className="font-mono text-sm bg-[#131c2e] hover:bg-[#1a2438] text-white border border-[#00e5ff]/30 px-8 py-3 rounded transition-colors"
            >
              SEE FEATURES
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4 border-t border-[#131c2e]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Your Trading Command Center</h2>
            <p className="text-[#3d4f6b]">Six powerful tools working together to give you an edge</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Tier 1 Scanner */}
            <div className="bg-[#0c1020] border border-[#131c2e] rounded-lg p-6 hover:border-[#fb923c]/30 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-[#fb923c]/15 flex items-center justify-center mb-4">
                <Crosshair className="w-5 h-5 text-[#fb923c]" />
              </div>
              <h3 className="font-mono text-white mb-2">Tier 1 Scanner</h3>
              <p className="text-sm text-[#3d4f6b] mb-3">
                Automatically surfaces the highest-conviction plays of the day. Scans for unusual options activity, 
                technical breakouts, and catalyst alignment to find setups with asymmetric risk/reward.
              </p>
              <ul className="text-xs text-[#3d4f6b] space-y-1">
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-[#fb923c] rounded-full" />
                  Options flow anomaly detection
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-[#fb923c] rounded-full" />
                  Multi-timeframe technical confluence
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-[#fb923c] rounded-full" />
                  Catalyst proximity scoring
                </li>
              </ul>
            </div>

            {/* AI Signals */}
            <div className="bg-[#0c1020] border border-[#131c2e] rounded-lg p-6 hover:border-[#00ffaa]/30 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-[#00ffaa]/15 flex items-center justify-center mb-4">
                <TrendingUp className="w-5 h-5 text-[#00ffaa]" />
              </div>
              <h3 className="font-mono text-white mb-2">AI Signals</h3>
              <p className="text-sm text-[#3d4f6b] mb-3">
                Generate actionable BUY/SELL/FADE signals for any ticker on your watchlist. 
                Each signal includes conviction level, price targets, stop losses, and the reasoning behind the call.
              </p>
              <ul className="text-xs text-[#3d4f6b] space-y-1">
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-[#00ffaa] rounded-full" />
                  Entry, target, and stop levels
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-[#00ffaa] rounded-full" />
                  Options play recommendations
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-[#00ffaa] rounded-full" />
                  Risk/reward analysis
                </li>
              </ul>
            </div>

            {/* Pre-Market Brief */}
            <div className="bg-[#0c1020] border border-[#131c2e] rounded-lg p-6 hover:border-[#00e5ff]/30 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-[#00e5ff]/15 flex items-center justify-center mb-4">
                <FileText className="w-5 h-5 text-[#00e5ff]" />
              </div>
              <h3 className="font-mono text-white mb-2">Pre-Market Brief</h3>
              <p className="text-sm text-[#3d4f6b] mb-3">
                Start every trading day with a comprehensive market overview. Futures positioning, overnight catalysts, 
                sector rotation analysis, and your personalized Top Plays for the session.
              </p>
              <ul className="text-xs text-[#3d4f6b] space-y-1">
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-[#00e5ff] rounded-full" />
                  Global macro context
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-[#00e5ff] rounded-full" />
                  Earnings and economic calendar
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-[#00e5ff] rounded-full" />
                  Top 3-5 plays with full thesis
                </li>
              </ul>
            </div>

            {/* Deep Thesis */}
            <div className="bg-[#0c1020] border border-[#131c2e] rounded-lg p-6 hover:border-[#a78bfa]/30 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-[#a78bfa]/15 flex items-center justify-center mb-4">
                <Search className="w-5 h-5 text-[#a78bfa]" />
              </div>
              <h3 className="font-mono text-white mb-2">Deep Thesis</h3>
              <p className="text-sm text-[#3d4f6b] mb-3">
                Run any ticker through comprehensive AI analysis. Get bull and bear cases, technical levels, 
                sentiment analysis, and specific options strategies based on current market conditions.
              </p>
              <ul className="text-xs text-[#3d4f6b] space-y-1">
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-[#a78bfa] rounded-full" />
                  Bull/bear thesis breakdown
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-[#a78bfa] rounded-full" />
                  Key support/resistance levels
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-[#a78bfa] rounded-full" />
                  IV-aware options strategies
                </li>
              </ul>
            </div>

            {/* Scout */}
            <div className="bg-[#0c1020] border border-[#131c2e] rounded-lg p-6 hover:border-[#facc15]/30 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-[#facc15]/15 flex items-center justify-center mb-4">
                <Radar className="w-5 h-5 text-[#facc15]" />
              </div>
              <h3 className="font-mono text-white mb-2">Scout Mode</h3>
              <p className="text-sm text-[#3d4f6b] mb-3">
                Discover new opportunities you might have missed. AI-powered thematic scanning finds emerging plays 
                in sectors like AI infrastructure, energy transition, biotech catalysts, and more.
              </p>
              <ul className="text-xs text-[#3d4f6b] space-y-1">
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-[#facc15] rounded-full" />
                  Thematic opportunity scanning
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-[#facc15] rounded-full" />
                  Market cap and horizon filters
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-[#facc15] rounded-full" />
                  One-click watchlist promotion
                </li>
              </ul>
            </div>

            {/* Performance Tracker */}
            <div className="bg-[#0c1020] border border-[#131c2e] rounded-lg p-6 hover:border-[#00ffaa]/30 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-[#00ffaa]/15 flex items-center justify-center mb-4">
                <BarChart3 className="w-5 h-5 text-[#00ffaa]" />
              </div>
              <h3 className="font-mono text-white mb-2">Performance Tracker</h3>
              <p className="text-sm text-[#3d4f6b] mb-3">
                Track every signal - taken or passed. Measure your execution with win rate, P&L tracking, 
                and see which signals you missed that would have hit. Learn and improve over time.
              </p>
              <ul className="text-xs text-[#3d4f6b] space-y-1">
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-[#00ffaa] rounded-full" />
                  Win/loss/missed tracking
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-[#00ffaa] rounded-full" />
                  Realized P&L calculations
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-[#00ffaa] rounded-full" />
                  Signal quality analysis
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - API Keys */}
      <section className="py-20 px-4 border-t border-[#131c2e] bg-[#080c14]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Your Keys, Your Control</h2>
            <p className="text-[#3d4f6b] max-w-2xl mx-auto">
              White 80 uses a bring-your-own-API model. You connect your own data and AI accounts, 
              keeping you in complete control of your costs and privacy.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-[#0c1020] border border-[#131c2e] rounded-lg p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-[#00e5ff]/15 flex items-center justify-center mx-auto mb-4">
                <Key className="w-6 h-6 text-[#00e5ff]" />
              </div>
              <h3 className="font-mono text-white mb-2">Your API Keys</h3>
              <p className="text-sm text-[#3d4f6b]">
                You create accounts with Polygon (market data) and Anthropic (AI). Your keys, your accounts - 
                we never see your credentials.
              </p>
            </div>

            <div className="bg-[#0c1020] border border-[#131c2e] rounded-lg p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-[#00ffaa]/15 flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-[#00ffaa]" />
              </div>
              <h3 className="font-mono text-white mb-2">100% Private</h3>
              <p className="text-sm text-[#3d4f6b]">
                Keys are encrypted at rest and only used to make requests on your behalf. 
                Full transparency - monitor your usage anytime in each provider&apos;s dashboard.
              </p>
            </div>

            <div className="bg-[#0c1020] border border-[#131c2e] rounded-lg p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-[#a78bfa]/15 flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-[#a78bfa]" />
              </div>
              <h3 className="font-mono text-white mb-2">You Control Costs</h3>
              <p className="text-sm text-[#3d4f6b]">
                Polygon free tier covers most users. Anthropic runs $5-15/month typical usage. 
                Set your own spending limits directly with each provider.
              </p>
            </div>
          </div>

          <div className="bg-[#0c1020] border border-[#131c2e] rounded-lg p-6">
            <h4 className="font-mono text-[#00e5ff] text-sm tracking-wider mb-4">QUICK SETUP (5 MINUTES)</h4>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="w-6 h-6 rounded-full bg-[#00ffaa]/15 text-[#00ffaa] font-mono text-xs flex items-center justify-center">1</span>
                  <span className="text-white font-mono text-sm">Polygon.io (Free)</span>
                </div>
                <p className="text-sm text-[#3d4f6b] ml-9">
                  Sign up at polygon.io, get your free API key instantly. Powers all market data, quotes, and options chains.
                </p>
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="w-6 h-6 rounded-full bg-[#a78bfa]/15 text-[#a78bfa] font-mono text-xs flex items-center justify-center">2</span>
                  <span className="text-white font-mono text-sm">Anthropic (Pay-as-you-go)</span>
                </div>
                <p className="text-sm text-[#3d4f6b] ml-9">
                  Create account at console.anthropic.com, add billing, generate API key. Powers all AI analysis and signals.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 border-t border-[#131c2e]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Level Up?</h2>
          <p className="text-[#3d4f6b] mb-8">
            Join traders who use White 80 to make smarter, faster decisions.
          </p>
          <Link
            href="/pricing"
            className="inline-block font-mono text-sm bg-[#00e5ff] hover:bg-[#00e5ff]/90 text-[#060a10] px-8 py-3 rounded transition-colors"
          >
            GET STARTED NOW
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#131c2e] py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-[#00e5ff] rounded-full" />
            <span className="font-mono text-sm text-[#3d4f6b]">WHITE 80</span>
          </div>
          <p className="font-mono text-xs text-[#3d4f6b]">
            Information intelligence platform. Not financial advice. Trade at your own risk.
          </p>
        </div>
      </footer>
    </div>
  )
}
