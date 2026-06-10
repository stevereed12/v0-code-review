import { PageHeader } from "@/components/white80/page-header"
import { SiteFooter } from "@/components/white80/site-footer"
import { Sparkles, Bug, Zap, Shield, BarChart3 } from "lucide-react"

const CHANGELOG_ENTRIES = [
  {
    version: "1.2.0",
    date: "January 2025",
    type: "feature" as const,
    title: "Spread Strategy Conversion",
    description: "New spreads view in Signals tab converts single-leg options plays into defined-risk spread strategies including bull/bear verticals and iron condors.",
  },
  {
    version: "1.1.5",
    date: "January 2025",
    type: "improvement" as const,
    title: "Pre-Market Brief Enhancements",
    description: "Improved expiration date accuracy for options plays. Briefs now use validated weekly and monthly expiration dates.",
  },
  {
    version: "1.1.4",
    date: "January 2025",
    type: "fix" as const,
    title: "User Session Management",
    description: "Fixed data persistence issue between user sessions on shared devices. User data is now properly cleared on logout.",
  },
  {
    version: "1.1.3",
    date: "January 2025",
    type: "improvement" as const,
    title: "API Key Management",
    description: "Moved API key configuration into the Settings panel for a cleaner dashboard experience.",
  },
  {
    version: "1.1.0",
    date: "December 2024",
    type: "feature" as const,
    title: "Signal Tracker",
    description: "New portfolio tracking feature to monitor signal performance over time with P&L calculations and outcome tracking.",
  },
  {
    version: "1.0.5",
    date: "December 2024",
    type: "security" as const,
    title: "Enhanced Security",
    description: "Added encrypted storage for API keys and improved session handling for better account security.",
  },
  {
    version: "1.0.0",
    date: "December 2024",
    type: "feature" as const,
    title: "Initial Release",
    description: "White 80 launches with AI-powered signals, multi-tier watchlist, curator analysis, and pre-market briefs.",
  },
]

const TYPE_CONFIG = {
  feature: { icon: Sparkles, color: "text-[#c8ff00]", bg: "bg-[#c8ff00]/10" },
  improvement: { icon: Zap, color: "text-[#f4f0e6]", bg: "bg-[#f4f0e6]/10" },
  fix: { icon: Bug, color: "text-[#fb923c]", bg: "bg-[#fb923c]/10" },
  security: { icon: Shield, color: "text-[#c8ff00]", bg: "bg-[#c8ff00]/10" },
}

export default function ChangelogPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <PageHeader currentPath="/changelog" />
      
      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="font-display text-5xl md:text-6xl text-[#f4f0e6] mb-4">CHANGELOG</h1>
          <p className="text-[#6e6a5e] font-mono text-sm">
            New features, improvements, and fixes
          </p>
        </div>

        <div className="space-y-6">
          {CHANGELOG_ENTRIES.map((entry, i) => {
            const config = TYPE_CONFIG[entry.type]
            const Icon = config.icon
            
            return (
              <div key={i} className="bg-[#0a0a0a] border border-[#262620] rounded-lg p-5">
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 ${config.bg} rounded-lg flex items-center justify-center shrink-0`}>
                    <Icon className={`w-5 h-5 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <span className="font-mono text-xs text-[#6e6a5e]">v{entry.version}</span>
                      <span className="font-mono text-xs text-[#6e6a5e]">{entry.date}</span>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">{entry.title}</h3>
                    <p className="text-sm text-[#6e6a5e] leading-relaxed">{entry.description}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
      <SiteFooter />
    </div>
  )
}
