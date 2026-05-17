"use client"

import { useState, useCallback, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { storage, STORAGE_KEYS } from "@/lib/storage"
import { askClaude, fetchLivePrices, getStoredApiKey, ApiKeyRequiredError } from "@/lib/api"
import { ApiKeyModal } from "./api-key-modal"
import { buildSignalPrompt, buildBriefPrompt, buildNewsPrompt, buildScoutPrompt, buildCuratorPrompt, buildBuyHoldPrompt } from "@/lib/prompts"
import { requestNotificationPermission, notifyOnComplete } from "@/lib/notifications"
import {
  SEED_WATCHLIST,
  THEMES,
  SCOUT_THEMES,
  CAP_TIERS,
  HORIZONS,
  type Signal,
  type TickerNews,
  type Brief,
  type CuratorState,
  type ScoutResult,
  type BuyHoldPick,
  type TrackerLog,
  type LivePrice,
  type CapTier,
  type Horizon,
  type ExtractedTrade,
} from "@/lib/types"
import { WatchlistHeader } from "./watchlist-header"
import { SignalCard } from "./signal-card"
import { NewsCard } from "./news-card"
import { ScoutCard } from "./scout-card"
import { TrackerRow } from "./tracker-row"
import { ActionButton } from "./action-button"
import { SettingsPanel } from "./settings-panel"
import { ExportModal } from "./export-modal"
import { Settings, TrendingUp, Radar, Newspaper, Activity, FileText, BarChart3, Crosshair, Search, Briefcase, Upload } from "lucide-react"
import { Tier1Scanner } from "./tier1-scanner"
import { QuickThesisSearch } from "./quick-thesis"

interface DashboardProps {
  userEmail?: string
  hasSubscription?: boolean
  polygonKey?: string | null
  anthropicKey?: string | null
}

export function White80Dashboard({ 
  userEmail, 
  hasSubscription = false,
  polygonKey,
  anthropicKey,
}: DashboardProps) {
  // Core state
  const [watchlist, setWatchlist] = useState<string[]>(SEED_WATCHLIST)
  const [pinnedTickers, setPinnedTickers] = useState<string[]>([])
  const [blockedTickers, setBlockedTickers] = useState<string[]>([])
  const [curatorState, setCuratorState] = useState<CuratorState | null>(null)
  const [signals, setSignals] = useState<Signal[]>([])
  const [brief, setBrief] = useState<Brief | null>(null)
  const [news, setNews] = useState<TickerNews[]>([])
  const [trackerLog, setTrackerLog] = useState<TrackerLog[]>([])
  const [scoutResults, setScoutResults] = useState<ScoutResult[]>([])
  const [buyHoldPicks, setBuyHoldPicks] = useState<BuyHoldPick[]>([])
  const [extractedTrades, setExtractedTrades] = useState<ExtractedTrade[]>([])
  const [extractingTrades, setExtractingTrades] = useState(false)
  const [scoutThemes, setScoutThemes] = useState<string[]>(["ai_infra", "energy_transition"])
  const [scoutCapTier, setScoutCapTier] = useState<CapTier>("small")
  const [scoutHorizon, setScoutHorizon] = useState<Horizon>("6-12mo")
  const [livePrices, setLivePrices] = useState<Record<string, LivePrice>>({})
  const [pricesAt, setPricesAt] = useState<string | null>(null)

  // UI state
  const [loading, setLoading] = useState({ curator: false, signals: false, brief: false, news: false, scout: false, buyhold: false })
  const [errors, setErrors] = useState<Record<string, string | null>>({})
  const [generatedAt, setGeneratedAt] = useState<Record<string, string>>({})
  const [autoNewsRefresh, setAutoNewsRefresh] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showExport, setShowExport] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [confirmClearTracker, setConfirmClearTracker] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [storageReady, setStorageReady] = useState(false)
  const [showApiKeyModal, setShowApiKeyModal] = useState(false)
  const [hasApiKey, setHasApiKey] = useState(false)
  const [currentDate, setCurrentDate] = useState<string>("")

  // Check for API key and set date on mount (client-side only to avoid hydration mismatch)
  useEffect(() => {
    // Use passed Anthropic key if available, otherwise check localStorage
    const storedKey = getStoredApiKey()
    const effectiveKey = anthropicKey || storedKey
    setHasApiKey(!!effectiveKey)
    
    // Store the server-provided key locally if not already stored
    if (anthropicKey && !storedKey) {
      localStorage.setItem("white80_anthropic_key", anthropicKey)
    }
    if (polygonKey) {
      localStorage.setItem("white80_polygon_key", polygonKey)
    }
    
    setCurrentDate(
      new Date()
        .toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
        .toUpperCase()
    )
  }, [anthropicKey, polygonKey])

  // Load from localStorage on mount
  useEffect(() => {
    const wl = storage.get<string[]>(STORAGE_KEYS.WATCHLIST)
    const pn = storage.get<string[]>(STORAGE_KEYS.PINNED)
    const bl = storage.get<string[]>(STORAGE_KEYS.BLOCKED)
    const tr = storage.get<TrackerLog[]>(STORAGE_KEYS.TRACKER)
    const nw = storage.get<TickerNews[]>(STORAGE_KEYS.NEWS)
    const cu = storage.get<CuratorState>(STORAGE_KEYS.CURATOR)
    const sc = storage.get<ScoutResult[]>(STORAGE_KEYS.SCOUT)
    const st = storage.get<string[]>(STORAGE_KEYS.SCOUT_THEMES)
    const scp = storage.get<CapTier>(STORAGE_KEYS.SCOUT_CAP)
    const sh = storage.get<Horizon>(STORAGE_KEYS.SCOUT_HORIZON)
    const ne = storage.get<boolean>(STORAGE_KEYS.NOTIFICATIONS_ENABLED)
    const se = storage.get<boolean>(STORAGE_KEYS.SOUND_ENABLED)

    if (wl) setWatchlist(wl)
    if (pn) setPinnedTickers(pn)
    if (bl) setBlockedTickers(bl)
    if (tr) setTrackerLog(tr)
    if (nw) setNews(nw)
    if (cu) setCuratorState(cu)
    if (sc) setScoutResults(sc)
    if (st) setScoutThemes(st)
    if (scp) setScoutCapTier(scp)
    if (sh) setScoutHorizon(sh)
    if (ne !== null) setNotificationsEnabled(ne)
    if (se !== null) setSoundEnabled(se)

    setStorageReady(true)
  }, [])

  // Save to localStorage on changes
  useEffect(() => {
    if (storageReady) storage.set(STORAGE_KEYS.WATCHLIST, watchlist)
  }, [watchlist, storageReady])
  useEffect(() => {
    if (storageReady) storage.set(STORAGE_KEYS.PINNED, pinnedTickers)
  }, [pinnedTickers, storageReady])
  useEffect(() => {
    if (storageReady) storage.set(STORAGE_KEYS.BLOCKED, blockedTickers)
  }, [blockedTickers, storageReady])
  useEffect(() => {
    if (storageReady) storage.set(STORAGE_KEYS.TRACKER, trackerLog)
  }, [trackerLog, storageReady])
  useEffect(() => {
    if (storageReady && news.length > 0) storage.set(STORAGE_KEYS.NEWS, news)
  }, [news, storageReady])
  useEffect(() => {
    if (storageReady && curatorState) storage.set(STORAGE_KEYS.CURATOR, curatorState)
  }, [curatorState, storageReady])
  useEffect(() => {
    if (storageReady && scoutResults.length > 0) storage.set(STORAGE_KEYS.SCOUT, scoutResults)
  }, [scoutResults, storageReady])
  useEffect(() => {
    if (storageReady) storage.set(STORAGE_KEYS.SCOUT_THEMES, scoutThemes)
  }, [scoutThemes, storageReady])
  useEffect(() => {
    if (storageReady) storage.set(STORAGE_KEYS.SCOUT_CAP, scoutCapTier)
  }, [scoutCapTier, storageReady])
  useEffect(() => {
    if (storageReady) storage.set(STORAGE_KEYS.SCOUT_HORIZON, scoutHorizon)
  }, [scoutHorizon, storageReady])
  useEffect(() => {
    if (storageReady) storage.set(STORAGE_KEYS.NOTIFICATIONS_ENABLED, notificationsEnabled)
  }, [notificationsEnabled, storageReady])
  useEffect(() => {
    if (storageReady) storage.set(STORAGE_KEYS.SOUND_ENABLED, soundEnabled)
  }, [soundEnabled, storageReady])

  // Handle notification permission
  const handleNotificationsToggle = async (enabled: boolean) => {
    if (enabled) {
      const granted = await requestNotificationPermission()
      setNotificationsEnabled(granted)
    } else {
      setNotificationsEnabled(false)
    }
  }

  // Reset all data
  const resetAllData = () => {
    if (!confirmReset) {
      setConfirmReset(true)
      setTimeout(() => setConfirmReset(false), 4000)
      return
    }
    setConfirmReset(false)
    storage.clear()
    setWatchlist(SEED_WATCHLIST)
    setPinnedTickers([])
    setBlockedTickers([])
    setTrackerLog([])
    setNews([])
    setCuratorState(null)
    setScoutResults([])
    setScoutThemes(["ai_infra", "energy_transition"])
    setScoutCapTier("small")
    setScoutHorizon("6-12mo")
  }

  // Watchlist operations
  const removeFromWatchlist = (ticker: string) => {
    setWatchlist((w) => w.filter((t) => t !== ticker))
    setPinnedTickers((p) => p.filter((t) => t !== ticker))
  }

  const togglePin = (ticker: string) => {
    setPinnedTickers((p) => (p.includes(ticker) ? p.filter((t) => t !== ticker) : [...p, ticker]))
  }

  const addTicker = (ticker: string, pin: boolean) => {
    if (blockedTickers.includes(ticker)) {
      setBlockedTickers((b) => b.filter((t) => t !== ticker))
    }
    setWatchlist((w) => [ticker, ...w])
    if (pin) {
      setPinnedTickers((p) => (p.includes(ticker) ? p : [...p, ticker]))
    }
  }

  // API operations
  const runCurator = useCallback(async () => {
    setLoading((s) => ({ ...s, curator: true }))
    setErrors((e) => ({ ...e, curator: null }))
    try {
      const parsed = await askClaude<CuratorState>(buildCuratorPrompt(watchlist))
      let final = parsed.active_watchlist || watchlist
      pinnedTickers.forEach((t) => {
        if (!final.includes(t)) final.unshift(t)
      })
      final = final.filter((t) => !blockedTickers.includes(t))
      setCuratorState(parsed)
      setWatchlist(final)
      setGeneratedAt((g) => ({ ...g, curator: new Date().toLocaleTimeString() }))
      notifyOnComplete("curator", undefined, { soundEnabled, notificationsEnabled })
    } catch (err) {
      if (err instanceof ApiKeyRequiredError) {
        setShowApiKeyModal(true)
      } else {
        setErrors((e) => ({ ...e, curator: (err as Error).message }))
      }
    } finally {
      setLoading((s) => ({ ...s, curator: false }))
    }
  }, [watchlist, pinnedTickers, blockedTickers, soundEnabled, notificationsEnabled])

  const runSignals = useCallback(async () => {
    setLoading((s) => ({ ...s, signals: true }))
    setErrors((e) => ({ ...e, signals: null }))
    try {
      // Fetch live prices
      let prices: Record<string, LivePrice> = {}
      try {
        prices = await fetchLivePrices(watchlist)
        setLivePrices(prices)
        setPricesAt(new Date().toLocaleTimeString())
      } catch {
        // Continue without prices
      }

      // Fetch options data if Polygon key available
      let optionsData: Record<string, import("@/lib/types").OptionsChainSummary | null> | null = null
      try {
        const priceMap: Record<string, number> = {}
        for (const [ticker, p] of Object.entries(prices)) {
          if (p?.price) priceMap[ticker] = p.price
        }
        const { fetchOptionsData } = await import("@/lib/api")
        optionsData = await fetchOptionsData(watchlist, priceMap)
      } catch {
        // Continue without options data - Polygon key might not be set
      }

      // Build news context
      let newsContext: string | null = null
      if (news.length > 0) {
        newsContext = news
          .filter((n) => n.items?.length > 0 && n.summary !== "quiet")
          .map((n) => {
            const items = n.items
              .slice(0, 3)
              .map((i) => `  - [${i.impact}/${i.magnitude}] ${i.headline} (${i.age_hours}h ago)`)
              .join("\n")
            return `${n.ticker}: ${n.summary}\n${items}`
          })
          .join("\n\n")
        if (!newsContext.trim()) newsContext = null
      }

      // Generate signals with prices and options data
      const parsed = await askClaude<Signal[]>(buildSignalPrompt(watchlist, newsContext, prices, optionsData))

      // Override with verified prices
      const withPrices = parsed.map((s) => {
        const p = prices[s.ticker]
        if (p && typeof p.price === "number") {
          return { ...s, price: p.price, change_pct: p.change_pct }
        }
        return s
      })

      setSignals(withPrices)
      setGeneratedAt((g) => ({ ...g, signals: new Date().toLocaleTimeString() }))

      // Auto-log to tracker
      const newLogs: TrackerLog[] = withPrices.map((s) => ({
        id: `${s.ticker}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        ts: new Date().toISOString(),
        ticker: s.ticker,
        signal: s.signal,
        play: s.play,
        price_at_signal: s.price,
        target: s.target,
        stop: s.stop,
        risk: s.risk,
        catalyst: s.catalyst,
        news_aware: s.news_aware || false,
        status: "PENDING",
        outcome: null,
        notes: "",
      }))
      setTrackerLog((prev) => [...newLogs, ...prev])

      notifyOnComplete("signals", withPrices.length, { soundEnabled, notificationsEnabled })
    } catch (err) {
      if (err instanceof ApiKeyRequiredError) {
        setShowApiKeyModal(true)
      } else {
        setErrors((e) => ({ ...e, signals: (err as Error).message }))
      }
    } finally {
      setLoading((s) => ({ ...s, signals: false }))
    }
  }, [watchlist, news, soundEnabled, notificationsEnabled])

  const runNews = useCallback(async () => {
    setLoading((s) => ({ ...s, news: true }))
    setErrors((e) => ({ ...e, news: null }))
    try {
      const parsed = await askClaude<TickerNews[]>(buildNewsPrompt(watchlist))
      setNews(parsed)
      setGeneratedAt((g) => ({ ...g, news: new Date().toLocaleTimeString() }))
      notifyOnComplete("news", parsed.length, { soundEnabled, notificationsEnabled })
    } catch (err) {
      if (err instanceof ApiKeyRequiredError) {
        setShowApiKeyModal(true)
      } else {
        setErrors((e) => ({ ...e, news: (err as Error).message }))
      }
    } finally {
      setLoading((s) => ({ ...s, news: false }))
    }
  }, [watchlist, soundEnabled, notificationsEnabled])

  const runBrief = useCallback(async () => {
    setLoading((s) => ({ ...s, brief: true }))
    setErrors((e) => ({ ...e, brief: null }))
    try {
      const clientApiKey = getStoredApiKey()
      if (!clientApiKey) {
        setShowApiKeyModal(true)
        setLoading((s) => ({ ...s, brief: false }))
        return
      }
      
      const clientPolygonKey = polygonKey || localStorage.getItem("white80_polygon_key") || undefined
      
      const res = await fetch("/api/brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tickers: watchlist,
          apiKey: clientApiKey,
          polygonKey: clientPolygonKey,
        }),
      })
      
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: "Brief generation failed" }))
        throw new Error(errData.error || "Brief generation failed")
      }
      
      const parsed = await res.json()
      setBrief(parsed)
      setGeneratedAt((g) => ({ ...g, brief: new Date().toLocaleTimeString() }))
      notifyOnComplete("brief", undefined, { soundEnabled, notificationsEnabled })
    } catch (err) {
      if (err instanceof ApiKeyRequiredError) {
        setShowApiKeyModal(true)
      } else {
        setErrors((e) => ({ ...e, brief: (err as Error).message }))
      }
    } finally {
      setLoading((s) => ({ ...s, brief: false }))
    }
  }, [watchlist, polygonKey, soundEnabled, notificationsEnabled])

  const runScout = useCallback(async () => {
    if (scoutThemes.length === 0) {
      setErrors((e) => ({ ...e, scout: "Pick at least one theme" }))
      return
    }
    setLoading((s) => ({ ...s, scout: true }))
    setErrors((e) => ({ ...e, scout: null }))
    try {
      const parsed = await askClaude<ScoutResult[]>(buildScoutPrompt(scoutThemes, scoutCapTier, scoutHorizon, watchlist))
      setScoutResults(parsed)
      setGeneratedAt((g) => ({ ...g, scout: new Date().toLocaleTimeString() }))
      notifyOnComplete("scout", parsed.length, { soundEnabled, notificationsEnabled })
    } catch (err) {
      if (err instanceof ApiKeyRequiredError) {
        setShowApiKeyModal(true)
      } else {
        setErrors((e) => ({ ...e, scout: (err as Error).message }))
      }
    } finally {
      setLoading((s) => ({ ...s, scout: false }))
    }
  }, [scoutThemes, scoutCapTier, scoutHorizon, watchlist, soundEnabled, notificationsEnabled])

  // Run Buy & Hold scan
  const runBuyHold = useCallback(async () => {
    setLoading((s) => ({ ...s, buyhold: true }))
    setErrors((e) => ({ ...e, buyhold: null }))
    try {
      const parsed = await askClaude<BuyHoldPick[]>(buildBuyHoldPrompt())
      setBuyHoldPicks(parsed)
      setGeneratedAt((g) => ({ ...g, buyhold: new Date().toLocaleTimeString() }))
      notifyOnComplete("buyhold", undefined, { soundEnabled, notificationsEnabled })
    } catch (err) {
      if (err instanceof ApiKeyRequiredError) {
        setShowApiKeyModal(true)
      } else {
        setErrors((e) => ({ ...e, buyhold: (err as Error).message }))
      }
    } finally {
      setLoading((s) => ({ ...s, buyhold: false }))
    }
  }, [soundEnabled, notificationsEnabled])
  
  // Auto-refresh news
  useEffect(() => {
    if (!autoNewsRefresh) return
    const interval = setInterval(runNews, 15 * 60 * 1000)
    return () => clearInterval(interval)
  }, [autoNewsRefresh, runNews])

  // Tracker operations
  const updateLog = (id: string, patch: Partial<TrackerLog>) => {
    setTrackerLog((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)))
  }

  const deleteLog = (id: string) => {
    setTrackerLog((prev) => prev.filter((l) => l.id !== id))
  }

  const clearTracker = () => {
    if (!confirmClearTracker) {
      setConfirmClearTracker(true)
      setTimeout(() => setConfirmClearTracker(false), 4000)
      return
    }
    setConfirmClearTracker(false)
    setTrackerLog([])
  }

  // Scout operations
  const promoteScoutToWatchlist = (ticker: string) => {
    if (watchlist.includes(ticker)) return
    setWatchlist((w) => [ticker, ...w])
    setPinnedTickers((p) => (p.includes(ticker) ? p : [...p, ticker]))
  }

  const toggleScoutTheme = (id: string) => {
    setScoutThemes((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]))
  }

  // Tracker stats
  const trackerStats = (() => {
    const total = trackerLog.length
    const approved = trackerLog.filter((l) => l.status === "APPROVED").length
    const passed = trackerLog.filter((l) => l.status === "PASSED").length
    const pending = trackerLog.filter((l) => l.status === "PENDING").length
    const wins = trackerLog.filter((l) => l.outcome === "WIN").length
    const losses = trackerLog.filter((l) => l.outcome === "LOSS").length
    const even = trackerLog.filter((l) => l.outcome === "EVEN").length
    const resolved = wins + losses + even
    const precision = resolved > 0 ? ((wins / resolved) * 100).toFixed(0) : "-"
    const approvalRate = approved + passed > 0 ? ((approved / (approved + passed)) * 100).toFixed(0) : "-"
    return { total, approved, passed, pending, wins, losses, even, resolved, precision, approvalRate }
  })()

  // Import handler
  const handleImport = (data: {
    watchlist: string[]
    pinnedTickers: string[]
    blockedTickers: string[]
    trackerLog: TrackerLog[]
    scoutThemes: string[]
    scoutCapTier: string
    scoutHorizon: string
  }) => {
    setWatchlist(data.watchlist)
    setPinnedTickers(data.pinnedTickers)
    setBlockedTickers(data.blockedTickers)
    setTrackerLog(data.trackerLog)
    setScoutThemes(data.scoutThemes)
    setScoutCapTier(data.scoutCapTier as CapTier)
    setScoutHorizon(data.scoutHorizon as Horizon)
  }

  return (
    <div
      className="font-serif text-[#d6dff0] min-h-screen p-6 pb-16"
      style={{ background: "radial-gradient(ellipse at top, #151e30, #05070e 70%)" }}
    >
      {/* API Key Modal */}
      {showApiKeyModal && (
        <ApiKeyModal
          onKeySet={() => {
            setShowApiKeyModal(false)
            setHasApiKey(true)
          }}
          onClose={() => setShowApiKeyModal(false)}
        />
      )}

      <div className="max-w-[980px] mx-auto">
        {/* API Key Status Banner */}
        {!hasApiKey && (
          <button
            onClick={() => setShowApiKeyModal(true)}
            className="w-full mb-4 p-3 bg-[#fb923c]/10 border border-[#fb923c]/40 rounded flex items-center justify-center gap-2 text-[#fb923c] font-mono text-sm hover:bg-[#fb923c]/20 transition-colors"
          >
            <span>API Key Required</span>
            <span className="text-xs opacity-70">Click to add your Anthropic API key</span>
          </button>
        )}

        {/* Header */}
        <div className="mb-4">
          <div className="flex justify-between items-start mb-1">
            <div>
              <h1 className="text-4xl font-semibold tracking-tight">
                White <span className="text-[#00e5ff]">80</span>
              </h1>
              <div className="font-mono text-[9px] tracking-[2.5px] text-[#3d4f6b] mt-0.5">
                PERSONAL ALPHA SYSTEM - v1.0
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono text-[10px] text-[#3d4f6b]">
                {currentDate || "---"}
                <div className="text-[9px] mt-0.5" style={{ color: curatorState?.regime ? "#00e5ff" : "#3d4f6b" }}>
                  {curatorState?.regime || "REGIME UNSET"}
                </div>
              </div>
              {userEmail && (
                <div className="mt-2 flex items-center gap-2 justify-end">
                  <span className="font-mono text-[9px] text-[#3d4f6b]">{userEmail}</span>
                  <button
                    onClick={async () => {
                      const { createClient } = await import("@/lib/supabase/client")
                      const supabase = createClient()
                      await supabase.auth.signOut()
                      window.location.href = "/"
                    }}
                    className="font-mono text-[9px] text-[#f87171] hover:text-[#f87171]/80 transition-colors"
                  >
                    SIGN OUT
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Watchlist Header */}
        <WatchlistHeader
          watchlist={watchlist}
          pinnedTickers={pinnedTickers}
          generatedAt={generatedAt.curator}
          onRemove={removeFromWatchlist}
          onTogglePin={togglePin}
          onAddTicker={addTicker}
        />

        {/* Settings Toggle */}
        <button
          onClick={() => setShowSettings(!showSettings)}
          className={`mb-4 flex items-center gap-2 font-mono text-[10px] tracking-wider px-3 py-1.5 rounded border transition-all ${
            showSettings
              ? "bg-[#00e5ff]/10 border-[#00e5ff] text-[#00e5ff]"
              : "border-[#1a2540] text-[#3d4f6b] hover:text-[#d6dff0]"
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          SETTINGS
        </button>

        {showSettings && (
          <SettingsPanel
            soundEnabled={soundEnabled}
            notificationsEnabled={notificationsEnabled}
            onSoundToggle={setSoundEnabled}
            onNotificationsToggle={handleNotificationsToggle}
            onOpenExport={() => setShowExport(true)}
            onResetAll={resetAllData}
            confirmReset={confirmReset}
          />
        )}

        {/* Main Tabs */}
        <Tabs defaultValue="watchlist" className="w-full">
          <TabsList className="w-full justify-start bg-transparent border-b border-[#131c2e] rounded-none p-0 h-auto mb-5">
{[
                { value: "thesis", label: "THESIS", icon: Search },
                { value: "tier1", label: "TIER 1", icon: Crosshair },
                { value: "watchlist", label: "WATCHLIST", icon: TrendingUp },
                { value: "scout", label: "SCOUT", icon: Radar },
                { value: "buyhold", label: "BUY & HOLD", icon: Briefcase },
                { value: "news", label: "NEWS", icon: Newspaper },
                { value: "signals", label: "SIGNALS", icon: Activity },
                { value: "brief", label: "PRE-MARKET", icon: FileText },
                { value: "tracker", label: "TRACKER", icon: BarChart3 },
              ].map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="font-mono text-[10px] tracking-wider px-3.5 py-2.5 border-b-2 border-transparent data-[state=active]:border-[#00e5ff] data-[state=active]:text-[#00e5ff] text-[#3d4f6b] rounded-none bg-transparent"
              >
                <tab.icon className="w-3.5 h-3.5 mr-1.5" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

{/* QUICK THESIS TAB - forceMount keeps it alive when switching tabs */}
              <TabsContent value="thesis" className="mt-0 data-[state=inactive]:hidden" forceMount>
                <QuickThesisSearch
                  onAddToWatchlist={(ticker) => {
                    if (!watchlist.includes(ticker)) {
                      setWatchlist(w => [ticker, ...w])
                      setPinnedTickers(p => p.includes(ticker) ? p : [...p, ticker])
                    }
                  }}
                  onApiKeyRequired={() => setShowApiKeyModal(true)}
                />
              </TabsContent>

              {/* TIER 1 SCANNER TAB - forceMount keeps scan running when switching tabs */}
              <TabsContent value="tier1" className="mt-0 data-[state=inactive]:hidden" forceMount>
                <Tier1Scanner 
                  polygonKey={polygonKey}
                  onPromoteToWatchlist={(ticker) => {
                    if (!watchlist.includes(ticker)) {
                      setWatchlist(w => [ticker, ...w])
                      setPinnedTickers(p => p.includes(ticker) ? p : [...p, ticker])
                    }
                  }}
                />
              </TabsContent>

              {/* WATCHLIST TAB */}
              <TabsContent value="watchlist" className="mt-0">
            <ActionButton
              onClick={runCurator}
              loading={loading.curator}
              label="RUN CURATOR"
              loadingLabel="CURATING..."
              color="#00e5ff"
              className="mb-4"
            />

            {errors.curator && (
              <div className="font-mono bg-[#f87171]/10 border border-[#f87171]/40 p-2.5 rounded text-[10px] text-[#f87171] mb-4">
                ERROR: {errors.curator}
              </div>
            )}

            {!curatorState && !loading.curator && (
              <div className="font-mono text-center py-10 text-[10px] text-[#3d4f6b] tracking-wider">
                Run curator to dynamically refine the watchlist based on current setups, news, and thematic fit.
              </div>
            )}

            {curatorState && (
              <div className="animate-in fade-in duration-300">
                {/* Summary */}
                <div className="bg-[#0c1020] border border-[#131c2e] rounded p-4 mb-4">
                  <div className="font-mono text-[9px] tracking-[2px] text-[#3d4f6b] mb-2">CURATOR SUMMARY</div>
                  <div className="text-base leading-relaxed">{curatorState.summary}</div>
                  {curatorState.regime && (
                    <div className="mt-2.5 inline-block px-2 py-0.5 border border-[#00e5ff]/40 rounded-sm">
                      <span className="font-mono text-[9px] text-[#00e5ff] tracking-wider">
                        REGIME - {curatorState.regime}
                      </span>
                    </div>
                  )}
                </div>

                {/* Promote / Demote */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                  <div className="bg-[#0c1020] border border-[#131c2e] rounded p-3.5">
                    <div className="font-mono text-[9px] tracking-[2px] text-[#00ffaa] mb-2.5">
                      PROMOTED - {curatorState.promote?.length || 0}
                    </div>
                    {!curatorState.promote?.length ? (
                      <div className="font-mono text-[10px] text-[#3d4f6b]">none today</div>
                    ) : (
                      curatorState.promote.map((p, i) => (
                        <div
                          key={i}
                          className="pb-2.5 mb-2.5 border-b border-[#131c2e] last:border-0 last:pb-0 last:mb-0"
                        >
                          <div className="flex justify-between items-baseline mb-0.5">
                            <span className="font-mono text-[13px] text-[#00ffaa] font-medium">{p.ticker}</span>
                            <span className="font-mono text-[8px] text-[#3d4f6b] tracking-wide">
                              {p.theme?.toUpperCase()}
                            </span>
                          </div>
                          <div className="text-[13px] leading-snug">{p.reason}</div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="bg-[#0c1020] border border-[#131c2e] rounded p-3.5">
                    <div className="font-mono text-[9px] tracking-[2px] text-[#fb923c] mb-2.5">
                      DEMOTED - {curatorState.demote?.length || 0}
                    </div>
                    {!curatorState.demote?.length ? (
                      <div className="font-mono text-[10px] text-[#3d4f6b]">none today</div>
                    ) : (
                      curatorState.demote.map((d, i) => (
                        <div
                          key={i}
                          className="pb-2.5 mb-2.5 border-b border-[#131c2e] last:border-0 last:pb-0 last:mb-0"
                        >
                          <div className="font-mono text-[13px] text-[#fb923c] font-medium mb-0.5">{d.ticker}</div>
                          <div className="text-[13px] leading-snug">{d.reason}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Theme gravity wells */}
                <div className="bg-[#0c1020] border border-[#131c2e] rounded p-3.5">
                  <div className="font-mono text-[9px] tracking-[2px] text-[#3d4f6b] mb-2.5">THEMATIC GRAVITY WELLS</div>
                  <div className="flex flex-wrap gap-1.5">
                    {THEMES.map((t) => (
                      <span
                        key={t.id}
                        className="font-mono text-[10px] px-2 py-1 bg-[#151e30] border border-[#1a2540] text-[#a78bfa] rounded-sm"
                      >
                        {t.label} - w{t.weight}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          {/* SCOUT TAB */}
          <TabsContent value="scout" className="mt-0">
            {/* Configuration */}
            <div className="bg-[#090c14] border border-[#131c2e] rounded p-3.5 mb-3.5">
              <div className="font-mono text-[9px] tracking-[2px] text-[#3d4f6b] mb-2.5">SCOUT CONFIGURATION</div>

              {/* Cap tier */}
              <div className="mb-3">
                <div className="font-mono text-[9px] text-[#3d4f6b] mb-1.5 tracking-wider">MARKET CAP TIER</div>
                <div className="flex flex-wrap gap-1">
                  {(Object.entries(CAP_TIERS) as [CapTier, (typeof CAP_TIERS)[CapTier]][]).map(([k, v]) => (
                    <button
                      key={k}
                      onClick={() => setScoutCapTier(k)}
                      className={`font-mono text-[10px] px-2.5 py-1 rounded-sm border transition-all ${
                        scoutCapTier === k
                          ? "bg-[#00e5ff]/10 border-[#00e5ff] text-[#00e5ff]"
                          : "border-[#1a2540] text-[#3d4f6b]"
                      }`}
                    >
                      {v.label} <span className="opacity-60 text-[9px]">{v.range}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Horizon */}
              <div className="mb-3">
                <div className="font-mono text-[9px] text-[#3d4f6b] mb-1.5 tracking-wider">HOLDING HORIZON</div>
                <div className="flex flex-wrap gap-1">
                  {(Object.entries(HORIZONS) as [Horizon, string][]).map(([k, desc]) => (
                    <button
                      key={k}
                      onClick={() => setScoutHorizon(k)}
                      className={`font-mono text-[10px] px-2.5 py-1 rounded-sm border transition-all ${
                        scoutHorizon === k
                          ? "bg-[#a78bfa]/10 border-[#a78bfa] text-[#a78bfa]"
                          : "border-[#1a2540] text-[#3d4f6b]"
                      }`}
                      title={desc}
                    >
                      {k}
                    </button>
                  ))}
                </div>
              </div>

              {/* Themes */}
              <div>
                <div className="font-mono text-[9px] text-[#3d4f6b] mb-1.5 tracking-wider">
                  THEMES ({scoutThemes.length} SELECTED)
                </div>
                <div className="flex flex-wrap gap-1">
                  {SCOUT_THEMES.map((t) => {
                    const on = scoutThemes.includes(t.id)
                    return (
                      <button
                        key={t.id}
                        onClick={() => toggleScoutTheme(t.id)}
                        className={`font-mono text-[10px] px-2.5 py-1 rounded-sm border transition-all ${
                          on ? "bg-[#00ffaa]/10 border-[#00ffaa] text-[#00ffaa]" : "border-[#1a2540] text-[#3d4f6b]"
                        }`}
                      >
                        {on && "* "}
                        {t.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            <ActionButton
              onClick={runScout}
              loading={loading.scout}
              label="RUN SCOUT"
              loadingLabel="SCOUTING..."
              color="#00ffaa"
              className="mb-4"
            />

            {errors.scout && (
              <div className="font-mono bg-[#f87171]/10 border border-[#f87171]/40 p-2.5 rounded text-[10px] text-[#f87171] mb-4">
                ERROR: {errors.scout}
              </div>
            )}

            {scoutResults.length === 0 && !loading.scout && (
              <div className="font-mono text-center py-10 text-[10px] text-[#3d4f6b] tracking-wider leading-relaxed">
                Scout finds high-conviction buy-and-hold names
                <br />
                outside the mega-cap mainstream.
                <br />
                Configure tier + horizon + themes, then run.
              </div>
            )}

            {scoutResults.map((r, i) => (
              <ScoutCard
                key={i}
                result={r}
                onWatchlist={watchlist.includes(r.ticker)}
                onPromote={() => promoteScoutToWatchlist(r.ticker)}
  />
  ))}
  </TabsContent>

  {/* BUY & HOLD TAB */}
  <TabsContent value="buyhold" className="mt-0">
    <div className="flex gap-2 mb-4">
      <ActionButton
        onClick={runBuyHold}
        loading={loading.buyhold}
        label="FIND OPPORTUNITIES"
        loadingLabel="Scanning market..."
      />
      {generatedAt.buyhold && (
        <span className="text-[10px] text-[#3d4f6b] font-mono self-center">
          Updated {generatedAt.buyhold}
        </span>
      )}
    </div>

    {errors.buyhold && (
      <div className="bg-[#f87171]/10 border border-[#f87171]/30 rounded p-3 mb-4">
        <span className="text-[#f87171] font-mono text-xs">{errors.buyhold}</span>
      </div>
    )}

    {buyHoldPicks.length === 0 && !loading.buyhold && (
      <div className="text-center py-12">
        <Briefcase className="w-10 h-10 text-[#3d4f6b] mx-auto mb-3" />
        <p className="text-[#3d4f6b] font-mono text-sm">
          Find quality stocks and funds at attractive entry points
        </p>
        <p className="text-[#3d4f6b]/60 font-mono text-xs mt-1">
          Long-term holds, pullback opportunities, dividend plays
        </p>
      </div>
    )}

    {buyHoldPicks.length > 0 && (
      <div className="space-y-4">
        {buyHoldPicks.map((pick, i) => (
          <div key={i} className="bg-[#0c1020] border border-[#131c2e] rounded-lg p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="font-mono text-lg font-bold text-white">{pick.ticker}</span>
                <span className="text-[#3d4f6b] text-sm">{pick.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`font-mono text-[9px] tracking-wider px-2 py-1 rounded ${
                  pick.conviction === "HIGH" ? "bg-[#00ffaa]/15 text-[#00ffaa]" :
                  pick.conviction === "MEDIUM" ? "bg-[#fbbf24]/15 text-[#fbbf24]" :
                  "bg-[#3d4f6b]/15 text-[#3d4f6b]"
                }`}>
                  {pick.conviction} CONVICTION
                </span>
                <span className={`font-mono text-[9px] tracking-wider px-2 py-1 rounded ${
                  pick.risk_level === "LOW" ? "bg-[#00ffaa]/15 text-[#00ffaa]" :
                  pick.risk_level === "MEDIUM" ? "bg-[#fbbf24]/15 text-[#fbbf24]" :
                  "bg-[#f87171]/15 text-[#f87171]"
                }`}>
                  {pick.risk_level} RISK
                </span>
              </div>
            </div>

            {/* Meta row */}
            <div className="flex items-center gap-4 mb-3 text-[11px] font-mono">
              <span className="text-[#00e5ff]">${pick.current_price?.toFixed(2) || "—"}</span>
              <span className="text-[#3d4f6b]">{pick.sector}</span>
              <span className="text-[#3d4f6b]">{pick.market_cap}</span>
              <span className="text-[#3d4f6b]">{pick.time_horizon}</span>
            </div>

            {/* Why Now */}
            <div className="mb-3">
              <div className="font-mono text-[9px] tracking-wider text-[#fb923c] mb-1">WHY NOW</div>
              <p className="text-[13px] text-[#d6dff0]">{pick.why_now}</p>
            </div>

            {/* Entry Zone & Fair Value */}
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <div className="font-mono text-[9px] tracking-wider text-[#3d4f6b] mb-1">ENTRY ZONE</div>
                <span className="text-[#00e5ff] font-mono text-sm">
                  ${pick.entry_zone?.low?.toFixed(2) || "—"} - ${pick.entry_zone?.high?.toFixed(2) || "—"}
                </span>
              </div>
              <div>
                <div className="font-mono text-[9px] tracking-wider text-[#3d4f6b] mb-1">FAIR VALUE</div>
                <span className="text-[#00ffaa] font-mono text-sm">${pick.fair_value?.toFixed(2) || "—"}</span>
              </div>
            </div>

            {/* Thesis */}
            <div className="mb-3">
              <div className="font-mono text-[9px] tracking-wider text-[#3d4f6b] mb-1">THESIS</div>
              <p className="text-[12px] text-[#d6dff0]">{pick.thesis}</p>
            </div>

            {/* Bull/Bear Cases */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="font-mono text-[9px] tracking-wider text-[#00ffaa] mb-1">BULL CASE</div>
                <p className="text-[11px] text-[#d6dff0]/80">{pick.bull_case}</p>
              </div>
              <div>
                <div className="font-mono text-[9px] tracking-wider text-[#f87171] mb-1">BEAR CASE</div>
                <p className="text-[11px] text-[#d6dff0]/80">{pick.bear_case}</p>
              </div>
            </div>

            {/* Add to Watchlist button */}
            <div className="mt-3 pt-3 border-t border-[#131c2e]">
              <button
                onClick={() => {
                  if (!watchlist.includes(pick.ticker)) {
                    setWatchlist(w => [pick.ticker, ...w])
                  }
                }}
                disabled={watchlist.includes(pick.ticker)}
                className={`font-mono text-[10px] tracking-wider px-3 py-1.5 rounded transition-colors ${
                  watchlist.includes(pick.ticker)
                    ? "bg-[#3d4f6b]/20 text-[#3d4f6b] cursor-not-allowed"
                    : "bg-[#00e5ff]/10 text-[#00e5ff] hover:bg-[#00e5ff]/20"
                }`}
              >
                {watchlist.includes(pick.ticker) ? "IN WATCHLIST" : "ADD TO WATCHLIST"}
              </button>
            </div>
          </div>
        ))}
      </div>
    )}
  </TabsContent>
  
  {/* NEWS TAB */}
          <TabsContent value="news" className="mt-0">
            <div className="flex gap-2 mb-4">
              <ActionButton
                onClick={runNews}
                loading={loading.news}
                label="RUN NEWS MONITOR"
                loadingLabel="SCANNING NEWS..."
                color="#facc15"
                className="flex-1"
              />
              <button
                onClick={() => setAutoNewsRefresh((a) => !a)}
                className={`font-mono py-3 px-4 text-[10px] tracking-wider rounded border transition-all ${
                  autoNewsRefresh
                    ? "bg-[#00ffaa]/10 border-[#00ffaa] text-[#00ffaa]"
                    : "border-[#1a2540] text-[#3d4f6b]"
                }`}
                title="Auto-refresh every 15 min"
              >
                {autoNewsRefresh ? "AUTO 15m" : "AUTO OFF"}
              </button>
            </div>

            {errors.news && (
              <div className="font-mono bg-[#f87171]/10 border border-[#f87171]/40 p-2.5 rounded text-[10px] text-[#f87171] mb-4">
                ERROR: {errors.news}
              </div>
            )}

            {news.length === 0 && !loading.news && (
              <div className="font-mono text-center py-10 text-[10px] text-[#3d4f6b] tracking-wider leading-relaxed">
                Run news monitor to scan the active watchlist for fresh catalysts.
                <br />
                Latest news flow feeds directly into Signals.
              </div>
            )}

            {news.length > 0 && (
              <>
                {/* Aggregate counter */}
                <div className="bg-[#090c14] border border-[#131c2e] rounded p-2.5 mb-3 flex justify-around flex-wrap gap-3">
                  {(() => {
                    const all = news.flatMap((n) => n.items || [])
                    const bull = all.filter((i) => i.impact === "BULLISH").length
                    const bear = all.filter((i) => i.impact === "BEARISH").length
                    const high = all.filter((i) => i.magnitude === "HIGH").length
                    const quiet = news.filter((n) => !n.items?.length || n.summary === "quiet").length
                    return (
                      <>
                        <div className="font-mono text-[10px] text-[#3d4f6b] tracking-wider">
                          <span className="text-[#00ffaa] text-sm font-medium">{bull}</span> bull
                        </div>
                        <div className="font-mono text-[10px] text-[#3d4f6b] tracking-wider">
                          <span className="text-[#f87171] text-sm font-medium">{bear}</span> bear
                        </div>
                        <div className="font-mono text-[10px] text-[#3d4f6b] tracking-wider">
                          <span className="text-[#fb923c] text-sm font-medium">{high}</span> high impact
                        </div>
                        <div className="font-mono text-[10px] text-[#3d4f6b] tracking-wider">
                          <span className="text-[#3d4f6b] text-sm font-medium">{quiet}</span> quiet
                        </div>
                      </>
                    )
                  })()}
                </div>

                {news.map((n, i) => (
                  <NewsCard key={i} news={n} />
                ))}

                <div className="font-mono mt-3.5 p-2.5 bg-[#00e5ff]/5 border border-[#00e5ff]/30 rounded text-[10px] text-[#00e5ff] tracking-wide">
                  * News flow auto-feeds into Signals. Run signals next to get news-aware plays.
                </div>
              </>
            )}
          </TabsContent>

          {/* SIGNALS TAB */}
          <TabsContent value="signals" className="mt-0">
            <ActionButton
              onClick={runSignals}
              loading={loading.signals}
              label="RUN SIGNALS"
              loadingLabel="SCANNING..."
              color="#00ffaa"
              className="mb-4"
            />

            {errors.signals && (
              <div className="font-mono bg-[#f87171]/10 border border-[#f87171]/40 p-2.5 rounded text-[10px] text-[#f87171] mb-4">
                ERROR: {errors.signals}
              </div>
            )}

            {pricesAt && Object.keys(livePrices).length > 0 && (
              <div className="font-mono bg-[#00ffaa]/5 border border-[#00ffaa]/40 p-2 rounded text-[10px] text-[#00ffaa] tracking-wide mb-3 flex justify-between items-center flex-wrap gap-1.5">
                <span>
                  * PRICES + OPTIONS DATA - {Object.keys(livePrices).length}/{watchlist.length} TICKERS
                </span>
                <span className="text-[#3d4f6b]">fetched {pricesAt}</span>
              </div>
            )}

            {signals.length === 0 && !loading.signals && (
              <div className="font-mono text-center py-10 text-[10px] text-[#3d4f6b] tracking-wider">
                Run signals to scan the active watchlist for setups.
              </div>
            )}

            {signals.map((s, i) => (
              <SignalCard key={i} signal={s} />
            ))}
          </TabsContent>

          {/* PRE-MARKET BRIEF TAB */}
          <TabsContent value="brief" className="mt-0">
            <ActionButton
              onClick={runBrief}
              loading={loading.brief}
              label="RUN PRE-MARKET BRIEF"
              loadingLabel="BRIEFING..."
              color="#a78bfa"
              className="mb-4"
            />

            {errors.brief && (
              <div className="font-mono bg-[#f87171]/10 border border-[#f87171]/40 p-2.5 rounded text-[10px] text-[#f87171] mb-4">
                ERROR: {errors.brief}
              </div>
            )}

            {!brief && !loading.brief && (
              <div className="font-mono text-center py-10 text-[10px] text-[#3d4f6b] tracking-wider">
                Run brief for overnight action, headlines, and today&apos;s setup.
              </div>
            )}

            {brief && (
              <div className="animate-in fade-in duration-300 space-y-5">
                {/* Header */}
                <div className="text-center border-b border-[#131c2e] pb-4">
                  <div className="font-mono text-[10px] tracking-[3px] text-[#3d4f6b] mb-1">WHITE 80 PRE-MARKET BRIEF</div>
                  <div className="font-mono text-sm text-[#d6dff0]">{brief.session_date} | {brief.session_label}</div>
                </div>

                {/* MACRO PULSE */}
                <div className="bg-[#0c1020] border border-[#131c2e] rounded-lg p-4">
                  <div className="font-mono text-[10px] tracking-[2px] text-[#00e5ff] mb-4 border-b border-[#131c2e] pb-2">MACRO PULSE</div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[13px]">
                    {/* SPY */}
                    <div>
                      <span className="text-[#3d4f6b] font-mono text-[10px]">SPY</span>
                      <div className="text-[#d6dff0]">
                        ${brief.macro_pulse?.spy?.price?.toFixed(2) || "—"}
                        <span className={`ml-1 ${(brief.macro_pulse?.spy?.change_pct || 0) >= 0 ? "text-[#00ffaa]" : "text-[#f87171]"}`}>
                          ({(brief.macro_pulse?.spy?.change_pct || 0) >= 0 ? "+" : ""}{brief.macro_pulse?.spy?.change_pct?.toFixed(2) || 0}%)
                        </span>
                      </div>
                      <div className="text-[10px] text-[#3d4f6b]">{brief.macro_pulse?.spy?.context}</div>
                    </div>
                    {/* QQQ */}
                    <div>
                      <span className="text-[#3d4f6b] font-mono text-[10px]">QQQ</span>
                      <div className="text-[#d6dff0]">
                        ${brief.macro_pulse?.qqq?.price?.toFixed(2) || "—"}
                        <span className={`ml-1 ${(brief.macro_pulse?.qqq?.change_pct || 0) >= 0 ? "text-[#00ffaa]" : "text-[#f87171]"}`}>
                          ({(brief.macro_pulse?.qqq?.change_pct || 0) >= 0 ? "+" : ""}{brief.macro_pulse?.qqq?.change_pct?.toFixed(2) || 0}%)
                        </span>
                      </div>
                      <div className="text-[10px] text-[#3d4f6b]">{brief.macro_pulse?.qqq?.context}</div>
                    </div>
                    {/* VIX */}
                    <div>
                      <span className="text-[#3d4f6b] font-mono text-[10px]">VIX</span>
                      <div className="text-[#d6dff0]">{brief.macro_pulse?.vix?.level?.toFixed(2) || "—"}</div>
                      <div className="text-[10px] text-[#3d4f6b]">{brief.macro_pulse?.vix?.context}</div>
                    </div>
                    {/* DXY */}
                    <div>
                      <span className="text-[#3d4f6b] font-mono text-[10px]">DXY</span>
                      <div className="text-[#d6dff0]">{brief.macro_pulse?.dxy?.level?.toFixed(2) || "—"}</div>
                      <div className="text-[10px] text-[#3d4f6b]">{brief.macro_pulse?.dxy?.context}</div>
                    </div>
                    {/* 10Y */}
                    <div>
                      <span className="text-[#3d4f6b] font-mono text-[10px]">10Y YIELD</span>
                      <div className="text-[#d6dff0]">{brief.macro_pulse?.ten_year?.yield?.toFixed(2) || "—"}%</div>
                      <div className="text-[10px] text-[#3d4f6b]">{brief.macro_pulse?.ten_year?.context}</div>
                    </div>
                    {/* WTI */}
                    <div>
                      <span className="text-[#3d4f6b] font-mono text-[10px]">WTI CRUDE</span>
                      <div className="text-[#d6dff0]">
                        ${brief.macro_pulse?.wti?.price?.toFixed(2) || "—"}
                        <span className={`ml-1 ${(brief.macro_pulse?.wti?.change_pct || 0) >= 0 ? "text-[#00ffaa]" : "text-[#f87171]"}`}>
                          ({(brief.macro_pulse?.wti?.change_pct || 0) >= 0 ? "+" : ""}{brief.macro_pulse?.wti?.change_pct?.toFixed(2) || 0}%)
                        </span>
                      </div>
                      <div className="text-[10px] text-[#3d4f6b]">{brief.macro_pulse?.wti?.context}</div>
                    </div>
                    {/* Gold */}
                    <div>
                      <span className="text-[#3d4f6b] font-mono text-[10px]">GOLD</span>
                      <div className="text-[#d6dff0]">${brief.macro_pulse?.gold?.price?.toLocaleString() || "—"}</div>
                      <div className="text-[10px] text-[#3d4f6b]">{brief.macro_pulse?.gold?.context}</div>
                    </div>
                  </div>
                </div>

                {/* TOP CATALYSTS */}
                <div className="bg-[#0c1020] border border-[#131c2e] rounded-lg p-4">
                  <div className="font-mono text-[10px] tracking-[2px] text-[#fb923c] mb-4 border-b border-[#131c2e] pb-2">TOP CATALYSTS</div>
                  <div className="space-y-4">
                    {brief.catalysts?.map((c, i) => (
                      <div key={i}>
                        <div className="font-mono text-[12px] text-[#fb923c] mb-1">{i + 1}. {c.title}</div>
                        <div className="text-[14px] leading-relaxed text-[#d6dff0] pl-4">{c.body}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* SECTOR ROTATION */}
                <div className="bg-[#0c1020] border border-[#131c2e] rounded-lg p-4">
                  <div className="font-mono text-[10px] tracking-[2px] text-[#a78bfa] mb-4 border-b border-[#131c2e] pb-2">SECTOR ROTATION</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Leading */}
                    <div>
                      <div className="font-mono text-[10px] text-[#00ffaa] mb-2">LEADING</div>
                      <div className="space-y-2">
                        {brief.sector_rotation?.leading?.map((s, i) => (
                          <div key={i} className="bg-[#090c14] rounded p-2">
                            <div className="flex justify-between items-baseline">
                              <span className="text-[13px] text-[#d6dff0]">{s.sector}</span>
                              <span className="font-mono text-[12px] text-[#00ffaa]">+{s.change_pct?.toFixed(1)}%</span>
                            </div>
                            <div className="text-[11px] text-[#3d4f6b] mt-1">{s.detail}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Lagging */}
                    <div>
                      <div className="font-mono text-[10px] text-[#f87171] mb-2">LAGGING</div>
                      <div className="space-y-2">
                        {brief.sector_rotation?.lagging?.map((s, i) => (
                          <div key={i} className="bg-[#090c14] rounded p-2">
                            <div className="flex justify-between items-baseline">
                              <span className="text-[13px] text-[#d6dff0]">{s.sector}</span>
                              <span className="font-mono text-[12px] text-[#f87171]">{s.change_pct?.toFixed(1)}%</span>
                            </div>
                            <div className="text-[11px] text-[#3d4f6b] mt-1">{s.detail}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* VERDICT */}
                <div
                  className="rounded-lg p-4"
                  style={{
                    background: brief.verdict?.tone === "RISK-ON" ? "linear-gradient(135deg, rgba(0,255,170,0.1) 0%, rgba(0,229,255,0.05) 100%)" 
                      : brief.verdict?.tone === "RISK-OFF" ? "linear-gradient(135deg, rgba(248,113,113,0.1) 0%, rgba(251,146,60,0.05) 100%)"
                      : "linear-gradient(135deg, rgba(250,204,21,0.1) 0%, rgba(167,139,250,0.05) 100%)",
                    border: `1px solid ${brief.verdict?.tone === "RISK-ON" ? "#00ffaa40" : brief.verdict?.tone === "RISK-OFF" ? "#f8717140" : "#facc1540"}`,
                  }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="font-mono text-[10px] tracking-[2px] text-[#3d4f6b]">VERDICT</div>
                    <div 
                      className="font-mono text-xs font-semibold px-3 py-1 rounded"
                      style={{ 
                        color: brief.verdict?.tone === "RISK-ON" ? "#00ffaa" : brief.verdict?.tone === "RISK-OFF" ? "#f87171" : "#facc15",
                        background: brief.verdict?.tone === "RISK-ON" ? "#00ffaa15" : brief.verdict?.tone === "RISK-OFF" ? "#f8717115" : "#facc1515",
                        border: `1px solid ${brief.verdict?.tone === "RISK-ON" ? "#00ffaa40" : brief.verdict?.tone === "RISK-OFF" ? "#f8717140" : "#facc1540"}`,
                      }}
                    >
                      {brief.verdict?.tone}
                    </div>
                  </div>
                  <div className="text-[15px] leading-relaxed text-[#d6dff0]">{brief.verdict?.summary}</div>
                </div>

                {/* TOP PLAYS */}
                {brief.top_plays && brief.top_plays.length > 0 && (
                <div>
                  <div className="font-mono text-[10px] tracking-[2px] text-[#fb923c] mb-3">WHITE 80 TOP PLAYS</div>
                  <div className="space-y-3">
                    {brief.top_plays.map((play, i) => (
                      <div key={i} className="bg-[#0c1020] border border-[#131c2e] rounded p-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-bold text-white">{play.ticker}</span>
                            <span className={`font-mono text-[9px] tracking-wider px-1.5 py-0.5 rounded ${
                              play.action === "BUY" ? "bg-[#00ffaa]/15 text-[#00ffaa]" :
                              play.action === "SELL" ? "bg-[#f87171]/15 text-[#f87171]" :
                              "bg-[#fb923c]/15 text-[#fb923c]"
                            }`}>
                              {play.action}
                            </span>
                            <span className={`font-mono text-[9px] tracking-wider ${
                              play.conviction === "HIGH" ? "text-[#00ffaa]" :
                              play.conviction === "MEDIUM" ? "text-[#fbbf24]" :
                              "text-[#3d4f6b]"
                            }`}>
                              {play.conviction}
                            </span>
                          </div>
                        </div>
                        <div className="font-mono text-[11px] text-[#00e5ff] mb-1">{play.play}</div>
                        <div className="text-[11px] text-[#d6dff0] mb-1">{play.thesis}</div>
                        <div className="font-mono text-[9px] text-[#3d4f6b]">CATALYST: {play.catalyst}</div>
                      </div>
                    ))}
                  </div>
                </div>
                )}

              </div>
            )}
          </TabsContent>

          {/* TRACKER TAB */}
          <TabsContent value="tracker" className="mt-0">
            {/* Stats grid */}
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-4">
              {[
                { label: "TOTAL", value: trackerStats.total, color: "#d6dff0" },
                { label: "PENDING", value: trackerStats.pending, color: "#facc15" },
                { label: "APPROVAL", value: trackerStats.approvalRate === "-" ? "-" : `${trackerStats.approvalRate}%`, color: "#00e5ff" },
                {
                  label: "PRECISION",
                  value: trackerStats.precision === "-" ? "-" : `${trackerStats.precision}%`,
                  color:
                    trackerStats.precision !== "-" && parseInt(trackerStats.precision) >= 65
                      ? "#00ffaa"
                      : trackerStats.precision !== "-" && parseInt(trackerStats.precision) < 50
                        ? "#f87171"
                        : "#facc15",
                },
                { label: "WINS", value: trackerStats.wins, color: "#00ffaa" },
                { label: "LOSSES", value: trackerStats.losses, color: "#f87171" },
              ].map((s, i) => (
                <div key={i} className="bg-[#0c1020] border border-[#131c2e] rounded p-2.5">
                  <div className="font-mono text-[8px] tracking-wider text-[#3d4f6b] mb-1">{s.label}</div>
                  <div className="font-mono text-xl font-medium tracking-wide" style={{ color: s.color }}>
                    {s.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Vision target */}
            <div className="bg-[#a78bfa]/10 border border-[#a78bfa]/40 rounded p-2.5 mb-3.5">
              <div className="font-mono text-[9px] text-[#a78bfa] tracking-wider mb-1">VISION TARGETS</div>
              <div className="text-[13px] leading-snug">
                Precision &gt;55% at 90 days - &gt;65% at 12 months - Beat SPY by 800bps risk-adjusted
              </div>
            </div>

            {trackerLog.length === 0 && (
              <div className="font-mono text-center py-10 text-[10px] text-[#3d4f6b] tracking-wider leading-relaxed">
                Tracker auto-logs every signal fired.
                <br />
                Mark approve/pass and outcomes to compute precision over time.
              </div>
            )}

            {/* Export/Import Controls */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => {
                  const data = JSON.stringify({ trackerLog, watchlist, exportedAt: new Date().toISOString() }, null, 2)
                  const blob = new Blob([data], { type: "application/json" })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement("a")
                  a.href = url
                  a.download = `white80-backup-${new Date().toISOString().split("T")[0]}.json`
                  a.click()
                  URL.revokeObjectURL(url)
                }}
                className="font-mono text-[9px] tracking-wider px-3 py-1.5 rounded border border-[#00e5ff]/40 text-[#00e5ff] hover:bg-[#00e5ff]/10 transition-colors"
              >
                EXPORT BACKUP
              </button>
              <label className="font-mono text-[9px] tracking-wider px-3 py-1.5 rounded border border-[#00ffaa]/40 text-[#00ffaa] hover:bg-[#00ffaa]/10 transition-colors cursor-pointer">
                IMPORT BACKUP
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    const reader = new FileReader()
                    reader.onload = (evt) => {
                      try {
                        const data = JSON.parse(evt.target?.result as string)
                        if (data.trackerLog) {
                          // Merge imported logs with existing (avoid duplicates by id)
                          const existingIds = new Set(trackerLog.map(l => l.id))
                          const newLogs = data.trackerLog.filter((l: { id: string }) => !existingIds.has(l.id))
                          if (newLogs.length > 0) {
                            const merged = [...trackerLog, ...newLogs]
                            localStorage.setItem("white80_tracker", JSON.stringify(merged))
                            window.location.reload()
                          }
                        }
                        if (data.watchlist && Array.isArray(data.watchlist)) {
                          localStorage.setItem("white80_watchlist", JSON.stringify(data.watchlist))
                        }
                      } catch {
                        alert("Invalid backup file")
                      }
                    }
                    reader.readAsText(file)
                  }}
                />
              </label>
            </div>

            {/* Trade Upload Section */}
            <div className="bg-[#0c1020] border border-[#131c2e] rounded-lg p-4 mb-4">
              <div className="font-mono text-[10px] tracking-[2px] text-[#fb923c] mb-3">IMPORT TRADES</div>
              <p className="text-[12px] text-[#3d4f6b] mb-3">
                Upload a screenshot of your Robinhood transactions or drop in a CSV export to auto-reconcile against your signals.
              </p>
              
              <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                extractingTrades 
                  ? "border-[#fb923c]/50 bg-[#fb923c]/5" 
                  : "border-[#3d4f6b]/50 hover:border-[#00e5ff]/50 hover:bg-[#00e5ff]/5"
              }`}>
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {extractingTrades ? (
                    <>
                      <div className="w-8 h-8 border-2 border-[#fb923c] border-t-transparent rounded-full animate-spin mb-2" />
                      <p className="text-[11px] text-[#fb923c] font-mono">Extracting trades...</p>
                    </>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-[#3d4f6b] mb-2" />
                      <p className="text-[11px] text-[#3d4f6b] font-mono">
                        <span className="text-[#00e5ff]">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-[9px] text-[#3d4f6b]/60 font-mono mt-1">
                        PNG, JPG (screenshots) or CSV (Robinhood export)
                      </p>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*,.csv"
                  className="hidden"
                  disabled={extractingTrades}
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    
                    console.log("[v0] Starting trade extraction for file:", file.name, file.type)
                    setExtractingTrades(true)
                    setExtractedTrades([])
                    
                    try {
                      const formData = new FormData()
                      formData.append("file", file)
                      formData.append("apiKey", getStoredApiKey() || "")
                      formData.append("signals", JSON.stringify(signals))
                      formData.append("topPlays", JSON.stringify(brief?.top_plays || []))
                      
                      console.log("[v0] Sending request to /api/extract-trades")
                      const res = await fetch("/api/extract-trades", {
                        method: "POST",
                        body: formData,
                      })
                      
                      console.log("[v0] Response status:", res.status)
                      
                      if (!res.ok) {
                        const err = await res.json()
                        throw new Error(err.error || "Failed to extract trades")
                      }
                      
                      const data = await res.json()
                      console.log("[v0] Extracted trades data:", data)
                      setExtractedTrades(data.trades || [])
                    } catch (err) {
                      console.error("[v0] Trade extraction error:", err)
                      alert(err instanceof Error ? err.message : "Failed to extract trades")
                    } finally {
                      setExtractingTrades(false)
                      e.target.value = ""
                    }
                  }}
                />
              </label>
              
              {/* Extracted Trades Review */}
              {extractedTrades.length > 0 && (
                <div className="mt-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-mono text-[10px] text-[#3d4f6b] tracking-wider">
                      EXTRACTED: {extractedTrades.length} TRADES
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setExtractedTrades([])}
                        className="font-mono text-[9px] tracking-wider px-2 py-1 rounded border border-[#3d4f6b]/40 text-[#3d4f6b] hover:bg-[#3d4f6b]/10"
                      >
                        CLEAR
                      </button>
                      <button
                        onClick={() => {
                          // Convert extracted trades to tracker logs
                          const newLogs: TrackerLog[] = extractedTrades.map((t) => ({
                            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                            ts: new Date().toISOString(),
                            ticker: t.ticker,
                            signal: t.action,
                            play: t.isOptions && t.contract ? t.contract : `${t.action} ${t.quantity} shares`,
                            price_at_signal: t.price,
                            target: 0,
                            stop: 0,
                            risk: "Medium",
                            catalyst: t.matchedSignal || "Imported from transactions",
                            news_aware: false,
                            status: "EXECUTED", // Historical trades are already executed
                            outcome: t.action === "SELL" ? "CLOSED" : "OPEN", // Sells are closed positions, buys are open
                            notes: `${t.matchStatus}: ${t.matchedSignal || "Manual import"} | Total: $${t.total.toFixed(2)}`,
                          }))
                          
                          const merged = [...newLogs, ...trackerLog]
                          localStorage.setItem("white80_tracker", JSON.stringify(merged))
                          setTrackerLog(merged)
                          setExtractedTrades([])
                        }}
                        className="font-mono text-[9px] tracking-wider px-3 py-1 rounded bg-[#00ffaa]/20 border border-[#00ffaa]/40 text-[#00ffaa] hover:bg-[#00ffaa]/30"
                      >
                        IMPORT ALL
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {extractedTrades.map((trade, i) => (
                      <div key={i} className="bg-[#090c14] border border-[#131c2e] rounded p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-bold text-white">{trade.ticker}</span>
                            <span className={`font-mono text-[9px] tracking-wider px-1.5 py-0.5 rounded ${
                              trade.action === "BUY" 
                                ? "bg-[#00ffaa]/15 text-[#00ffaa]" 
                                : "bg-[#f87171]/15 text-[#f87171]"
                            }`}>
                              {trade.action}
                            </span>
                            {trade.isOptions && (
                              <span className="font-mono text-[9px] tracking-wider px-1.5 py-0.5 rounded bg-[#a78bfa]/15 text-[#a78bfa]">
                                OPTIONS
                              </span>
                            )}
                          </div>
                          <span className={`font-mono text-[9px] tracking-wider px-2 py-0.5 rounded ${
                            trade.matchStatus === "SIGNAL" ? "bg-[#00ffaa]/15 text-[#00ffaa]" :
                            trade.matchStatus === "TOP_PLAY" ? "bg-[#00e5ff]/15 text-[#00e5ff]" :
                            trade.matchStatus === "OFF_SIGNAL" ? "bg-[#fb923c]/15 text-[#fb923c]" :
                            "bg-[#3d4f6b]/15 text-[#3d4f6b]"
                          }`}>
                            {trade.matchStatus?.replace("_", " ")}
                          </span>
                        </div>
                        <div className="grid grid-cols-4 gap-2 text-[11px] font-mono">
                          <div>
                            <span className="text-[#3d4f6b]">QTY:</span>{" "}
                            <span className="text-[#d6dff0]">{trade.quantity}</span>
                          </div>
                          <div>
                            <span className="text-[#3d4f6b]">PRICE:</span>{" "}
                            <span className="text-[#d6dff0]">${trade.price.toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-[#3d4f6b]">TOTAL:</span>{" "}
                            <span className="text-[#00e5ff]">${trade.total.toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-[#3d4f6b]">DATE:</span>{" "}
                            <span className="text-[#d6dff0]">{trade.date}</span>
                          </div>
                        </div>
                        {trade.contract && (
                          <div className="text-[10px] text-[#a78bfa] mt-1 font-mono">{trade.contract}</div>
                        )}
                        <div className="text-[10px] text-[#3d4f6b] mt-1">{trade.matchedSignal}</div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Match Summary */}
                  <div className="mt-3 pt-3 border-t border-[#131c2e] grid grid-cols-4 gap-2">
                    {[
                      { label: "SIGNAL MATCH", count: extractedTrades.filter(t => t.matchStatus === "SIGNAL").length, color: "#00ffaa" },
                      { label: "TOP PLAY", count: extractedTrades.filter(t => t.matchStatus === "TOP_PLAY").length, color: "#00e5ff" },
                      { label: "OFF SIGNAL", count: extractedTrades.filter(t => t.matchStatus === "OFF_SIGNAL").length, color: "#fb923c" },
                      { label: "UNMATCHED", count: extractedTrades.filter(t => t.matchStatus === "UNMATCHED").length, color: "#3d4f6b" },
                    ].map((stat, i) => (
                      <div key={i} className="text-center">
                        <div className="font-mono text-lg font-bold" style={{ color: stat.color }}>{stat.count}</div>
                        <div className="font-mono text-[8px] tracking-wider text-[#3d4f6b]">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {trackerLog.length > 0 && (
              <>
                <div className="flex justify-between items-center mb-2.5">
                  <span className="font-mono text-[9px] text-[#3d4f6b] tracking-wider">
                    SIGNAL LOG - {trackerLog.length}
                  </span>
                  <button
                    onClick={clearTracker}
                    className={`font-mono text-[9px] tracking-wider px-2.5 py-1 rounded-sm border transition-all ${
                      confirmClearTracker
                        ? "bg-[#f87171]/20 border-[#f87171] text-[#f87171]"
                        : "border-[#f87171]/40 text-[#f87171]"
                    }`}
                  >
                    {confirmClearTracker ? "CONFIRM?" : "CLEAR ALL"}
                  </button>
                </div>

                {trackerLog.map((log) => (
                  <TrackerRow
                    key={log.id}
                    log={log}
                    onUpdate={(patch) => updateLog(log.id, patch)}
                    onDelete={() => deleteLog(log.id)}
                  />
                ))}
              </>
            )}
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="mt-10 pt-4 border-t border-[#131c2e] flex justify-between flex-wrap gap-2 items-center">
          <span className="font-mono text-[9px] text-[#3d4f6b] tracking-wider">
            WHITE 80 - PERSONAL ALPHA SYSTEM - POWERED BY CLAUDE
          </span>
          <div className="flex gap-3 items-center flex-wrap">
            <span className="font-mono text-[9px] text-[#3d4f6b]">
              {Object.entries(generatedAt)
                .map(([k, v]) => `${k}:${v}`)
                .join(" - ") || "no runs yet"}
            </span>
          </div>
        </div>
      </div>

      {/* Export Modal */}
      <ExportModal
        open={showExport}
        onClose={() => setShowExport(false)}
        watchlist={watchlist}
        pinnedTickers={pinnedTickers}
        blockedTickers={blockedTickers}
        trackerLog={trackerLog}
        scoutThemes={scoutThemes}
        scoutCapTier={scoutCapTier}
        scoutHorizon={scoutHorizon}
        onImport={handleImport}
      />
    </div>
  )
}
