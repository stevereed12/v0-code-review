import Link from "next/link"

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
            <p className="text-[#3d4f6b]">Everything you need, nothing you don&apos;t</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: "AI Signals",
                description: "Get BUY/SELL/HOLD recommendations with conviction levels, targets, and stops for every ticker.",
                icon: "⚡",
                color: "#00ffaa",
              },
              {
                title: "Pre-Market Brief",
                description: "Wake up to a complete market overview: futures, catalysts, sector rotation, and your watchlist setup.",
                icon: "📊",
                color: "#00e5ff",
              },
              {
                title: "Tier 1 Scanner",
                description: "Find the hottest setups automatically. High conviction plays with unusual options activity.",
                icon: "🎯",
                color: "#fb923c",
              },
              {
                title: "Deep Thesis",
                description: "Run any ticker through the engine. Get bull/bear cases, technicals, and options plays.",
                icon: "🔬",
                color: "#a78bfa",
              },
              {
                title: "Options Flow",
                description: "See where smart money is positioning. Call/put ratios, unusual strikes, IV percentiles.",
                icon: "📈",
                color: "#00e5ff",
              },
              {
                title: "Performance Tracker",
                description: "Track your signals, measure your edge. Win rate, precision, and P&L over time.",
                icon: "📋",
                color: "#00ffaa",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="bg-[#0c1020] border border-[#131c2e] rounded-lg p-6 hover:border-[#00e5ff]/30 transition-colors"
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-xl mb-4"
                  style={{ background: `${feature.color}15` }}
                >
                  {feature.icon}
                </div>
                <h3 className="font-mono text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-[#3d4f6b]">{feature.description}</p>
              </div>
            ))}
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
            Not financial advice. Trade at your own risk.
          </p>
        </div>
      </footer>
    </div>
  )
}
