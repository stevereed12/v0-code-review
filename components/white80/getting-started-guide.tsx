"use client"

import { useState, useEffect } from "react"
import { X, Crosshair, Radar, FileText, Plus, Activity, Search, BarChart3, ChevronRight, Sparkles, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface GettingStartedGuideProps {
  onClose: () => void
  onNavigate: (tab: string) => void
}

const WORKFLOW_STEPS = [
  {
    phase: "DISCOVER",
    title: "Find Trading Ideas",
    description: "Start by discovering interesting tickers using our AI-powered scanners.",
    tools: [
      { name: "Tier 1 Scanner", icon: Crosshair, tab: "tier1", desc: "See unusual options activity and smart money flow", details: "Tier 1 scans for unusual options activity - large block trades, sweeps, and smart money positioning. It highlights tickers where institutional players are making big bets." },
      { name: "Scout Mode", icon: Radar, tab: "scout", desc: "Find plays around themes you care about (AI, Energy, etc.)", details: "Scout Mode lets you search by theme or sector. Type 'AI stocks' or 'clean energy' and get AI-generated ticker ideas with analysis." },
      { name: "Pre-Market Brief", icon: FileText, tab: "brief", desc: "Get today's top opportunities before market open", details: "The Pre-Market Brief runs every morning and gives you a summary of market conditions, top movers, and AI-selected plays for the day." },
    ],
    color: "#00e5ff",
  },
  {
    phase: "SAVE",
    title: "Build Your Watchlist",
    description: "Add tickers you like to your Watchlist. This becomes your personal universe.",
    tools: [
      { name: "Watchlist", icon: Plus, tab: "watchlist", desc: "Your hub - add tickers from any discovery tool with the + button", details: "Your Watchlist is the central hub. When you find a ticker in any discovery tool, click the + button to add it. All your analysis runs against this list." },
    ],
    color: "#00ffaa",
  },
  {
    phase: "ANALYZE",
    title: "Go Deeper",
    description: "Run AI analysis on your watchlist to get actionable signals.",
    tools: [
      { name: "AI Signals", icon: Activity, tab: "signals", desc: "Get BUY/SELL/HOLD recommendations with conviction levels", details: "AI Signals analyzes your watchlist and gives each ticker a BUY, SELL, or HOLD rating with a conviction level (0-100). It considers technicals, sentiment, and market conditions." },
      { name: "Deep Thesis", icon: Search, tab: "thesis", desc: "Full research report on any ticker", details: "Deep Thesis generates a comprehensive research report on any ticker - bull case, bear case, catalysts, risks, and suggested options strategies." },
    ],
    color: "#a78bfa",
  },
  {
    phase: "TRACK",
    title: "Measure Results",
    description: "Log your trades and track performance over time.",
    tools: [
      { name: "Signal Tracker", icon: BarChart3, tab: "tracker", desc: "Track wins, losses, and missed opportunities", details: "Signal Tracker lets you log which plays you took. Track your P/L, win rate, and see which types of plays work best for you." },
    ],
    color: "#fb923c",
  },
]

export function GettingStartedGuide({ onClose, onNavigate }: GettingStartedGuideProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [dismissed, setDismissed] = useState(false)
  const [expandedTool, setExpandedTool] = useState<string | null>(null)

  useEffect(() => {
    const hasSeen = localStorage.getItem("white80_seen_guide")
    if (hasSeen) {
      setDismissed(true)
    }
  }, [])

  const handleDismiss = () => {
    localStorage.setItem("white80_seen_guide", "true")
    onClose()
  }

  const handleGoToTool = (tab: string) => {
    localStorage.setItem("white80_seen_guide", "true")
    onNavigate(tab)
    onClose()
  }

  if (dismissed) return null

  const step = WORKFLOW_STEPS[currentStep]

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0a0e1a] border border-[#131c2e] rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#131c2e]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#00e5ff]/15 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[#00e5ff]" />
            </div>
            <div>
              <h2 className="font-mono text-sm text-white tracking-wider">GETTING STARTED</h2>
              <p className="text-[#3d4f6b] text-xs">How to use White 80</p>
            </div>
          </div>
          <button onClick={handleDismiss} className="text-[#3d4f6b] hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress indicators */}
        <div className="flex gap-1 px-4 pt-4">
          {WORKFLOW_STEPS.map((s, i) => (
            <button
              key={s.phase}
              onClick={() => { setCurrentStep(i); setExpandedTool(null); }}
              className={`flex-1 h-1 rounded-full transition-colors ${
                i === currentStep ? "bg-[#00e5ff]" : i < currentStep ? "bg-[#00e5ff]/50" : "bg-[#131c2e]"
              }`}
            />
          ))}
        </div>

        {/* Step content */}
        <div className="p-6">
          {/* Phase badge */}
          <div 
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono tracking-wider mb-4"
            style={{ backgroundColor: `${step.color}15`, color: step.color }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: step.color }} />
            {step.phase}
          </div>

          <h3 className="text-2xl font-bold text-white mb-2">{step.title}</h3>
          <p className="text-[#d6dff0] mb-6">{step.description}</p>

          {/* Tools for this step */}
          <div className="space-y-3">
            {step.tools.map((tool) => (
              <div key={tool.name} className="bg-[#0c1020] border border-[#131c2e] rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedTool(expandedTool === tool.name ? null : tool.name)}
                  className="w-full flex items-center gap-4 p-4 hover:bg-[#131c2e]/50 transition-colors text-left group"
                >
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${step.color}15` }}
                  >
                    <tool.icon className="w-5 h-5" style={{ color: step.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-sm text-white tracking-wider">{tool.name}</div>
                    <div className="text-[#3d4f6b] text-xs mt-0.5">{tool.desc}</div>
                  </div>
                  <HelpCircle className={`w-4 h-4 transition-colors ${expandedTool === tool.name ? 'text-[#00e5ff]' : 'text-[#3d4f6b] group-hover:text-[#00e5ff]'}`} />
                </button>
                
                {/* Expanded details */}
                {expandedTool === tool.name && (
                  <div className="px-4 pb-4 border-t border-[#131c2e]">
                    <p className="text-[#d6dff0] text-sm py-3">{tool.details}</p>
                    <button
                      onClick={() => handleGoToTool(tool.tab)}
                      className="flex items-center gap-2 px-4 py-2 bg-[#00e5ff] hover:bg-[#00e5ff]/90 text-[#060a10] font-mono text-xs tracking-wider rounded transition-colors"
                    >
                      GO TO {tool.name.toUpperCase()}
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer navigation */}
        <div className="flex items-center justify-between p-4 border-t border-[#131c2e]">
          <button
            onClick={() => { setCurrentStep(Math.max(0, currentStep - 1)); setExpandedTool(null); }}
            disabled={currentStep === 0}
            className="font-mono text-xs text-[#3d4f6b] hover:text-white transition-colors disabled:opacity-30"
          >
            BACK
          </button>
          
          <div className="flex gap-3">
            <button
              onClick={handleDismiss}
              className="font-mono text-xs text-[#3d4f6b] hover:text-white transition-colors"
            >
              SKIP GUIDE
            </button>
            {currentStep < WORKFLOW_STEPS.length - 1 ? (
              <Button
                onClick={() => { setCurrentStep(currentStep + 1); setExpandedTool(null); }}
                className="bg-[#00e5ff] hover:bg-[#00e5ff]/90 text-[#060a10] font-mono text-xs tracking-wider"
              >
                NEXT STEP
              </Button>
            ) : (
              <Button
                onClick={() => handleGoToTool("tier1")}
                className="bg-[#00e5ff] hover:bg-[#00e5ff]/90 text-[#060a10] font-mono text-xs tracking-wider"
              >
                START DISCOVERING
              </Button>
            )}
          </div>
        </div>

        {/* Quick tip */}
        <div className="px-4 pb-4">
          <div className="bg-[#00e5ff]/5 border border-[#00e5ff]/20 rounded p-3">
            <p className="text-xs text-[#d6dff0]">
              <span className="text-[#00e5ff] font-semibold">Tip:</span> You can always access this guide from the Settings menu if you need a refresher.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
