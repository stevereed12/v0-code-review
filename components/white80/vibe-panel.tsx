"use client"

import type { VibeCheck } from "@/lib/types"
import { Flame, Snowflake, TrendingUp, TrendingDown, Zap, Users, Eye, Target } from "lucide-react"

function stripCitations(text: string): string {
  return text?.replace(/<\/?cite[^>]*>/g, "").replace(/\[\d+\]/g, "") || ""
}

// Map vibe score (0-100) to a color
function scoreColor(score: number): string {
  if (score >= 75) return "#c8ff00"
  if (score >= 60) return "#c8ff00"
  if (score >= 45) return "#facc15"
  if (score >= 30) return "#fb923c"
  return "#f87171"
}

const TEMP_CONFIG: Record<string, { color: string; icon: typeof Flame }> = {
  FREEZING: { color: "#c8ff00", icon: Snowflake },
  COLD: { color: "#c8ff00", icon: Snowflake },
  COOL: { color: "#c8ff00", icon: Snowflake },
  WARM: { color: "#facc15", icon: Flame },
  HOT: { color: "#fb923c", icon: Flame },
  "ON FIRE": { color: "#f87171", icon: Flame },
}

export function VibePanel({ vibe }: { vibe: VibeCheck }) {
  const sColor = scoreColor(vibe.vibe_score)
  const temp = TEMP_CONFIG[vibe.temperature] || TEMP_CONFIG.WARM
  const TempIcon = temp.icon

  return (
    <div className="animate-in fade-in duration-300 space-y-4">
      {/* Hero: score gauge + headline */}
      <div
        className="bg-[#141411] border rounded-lg p-5"
        style={{ borderColor: `${sColor}40`, background: `linear-gradient(135deg, ${sColor}0d 0%, transparent 60%)` }}
      >
        <div className="flex items-center justify-between mb-1">
          <div className="font-mono text-[9px] tracking-[2.5px] text-[#6e6a5e]">
            VIBE CHECK — {vibe.session_date} | {vibe.session_time}
          </div>
          <div
            className="flex items-center gap-1.5 px-2 py-0.5 rounded-sm font-mono text-[9px] tracking-wider"
            style={{ color: temp.color, background: `${temp.color}15`, border: `1px solid ${temp.color}40` }}
          >
            <TempIcon className="w-3 h-3" />
            {vibe.temperature}
          </div>
        </div>

        <div className="flex items-center gap-5 mt-3">
          {/* Score number */}
          <div className="flex flex-col items-center shrink-0">
            <div className="font-mono text-5xl font-semibold leading-none" style={{ color: sColor }}>
              {vibe.vibe_score}
            </div>
            <div className="font-mono text-[8px] tracking-[2px] text-[#6e6a5e] mt-1">VIBE / 100</div>
          </div>

          {/* Mood + headline */}
          <div className="min-w-0">
            <div className="font-mono text-sm tracking-wider mb-1.5" style={{ color: sColor }}>
              {vibe.mood}
            </div>
            <div className="text-lg leading-snug text-balance text-[#f4f0e6]">{stripCitations(vibe.headline)}</div>
          </div>
        </div>

        {/* Score bar: fear -> greed */}
        <div className="mt-4">
          <div className="relative h-2 rounded-full overflow-hidden bg-[#0a0a0a] border border-[#262620]">
            <div
              className="absolute inset-y-0 left-0 rounded-full transition-all"
              style={{ width: `${vibe.vibe_score}%`, background: sColor }}
            />
          </div>
          <div className="flex justify-between font-mono text-[8px] tracking-wider text-[#6e6a5e] mt-1">
            <span>FEAR</span>
            <span>NEUTRAL</span>
            <span>GREED</span>
          </div>
        </div>
      </div>

      {/* The read */}
      <div className="bg-[#141411] border border-[#262620] rounded-lg p-4">
        <div className="font-mono text-[9px] tracking-[2px] text-[#6e6a5e] mb-2">THE READ</div>
        <div className="text-[15px] leading-relaxed text-[#f4f0e6]">{stripCitations(vibe.read)}</div>
      </div>

      {/* Drivers */}
      {vibe.drivers?.length > 0 && (
        <div className="bg-[#141411] border border-[#262620] rounded-lg p-4">
          <div className="font-mono text-[9px] tracking-[2px] text-[#6e6a5e] mb-3 flex items-center gap-1.5">
            <Zap className="w-3 h-3" /> WHAT&apos;S MOVING THE MOOD
          </div>
          <div className="space-y-2.5">
            {vibe.drivers.map((d, i) => {
              const c = d.sentiment === "POSITIVE" ? "#c8ff00" : d.sentiment === "NEGATIVE" ? "#f87171" : "#facc15"
              return (
                <div key={i} className="flex gap-3">
                  <div className="w-1 rounded-full shrink-0" style={{ background: c }} />
                  <div className="min-w-0">
                    <div className="font-mono text-[11px] tracking-wider mb-0.5" style={{ color: c }}>
                      {d.label}
                    </div>
                    <div className="text-[13px] leading-snug text-[#f4f0e6]">{stripCitations(d.detail)}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Hot / Cold sectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-[#141411] border border-[#262620] rounded-lg p-4">
          <div className="font-mono text-[9px] tracking-[2px] text-[#fb923c] mb-3 flex items-center gap-1.5">
            <Flame className="w-3 h-3" /> RUNNING HOT
          </div>
          {!vibe.hot_sectors?.length ? (
            <div className="font-mono text-[10px] text-[#6e6a5e]">nothing on fire</div>
          ) : (
            <div className="space-y-2.5">
              {vibe.hot_sectors.map((s, i) => (
                <div key={i} className="border-b border-[#262620] last:border-0 pb-2.5 last:pb-0">
                  <div className="flex justify-between items-baseline">
                    <span className="font-mono text-[12px] text-[#f4f0e6]">{s.sector}</span>
                    <span className="font-mono text-[11px] text-[#c8ff00]">
                      {s.change_pct >= 0 ? "+" : ""}{s.change_pct?.toFixed(2)}%
                    </span>
                  </div>
                  <div className="text-[12px] leading-snug text-[#6e6a5e] mt-0.5">{stripCitations(s.vibe)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-[#141411] border border-[#262620] rounded-lg p-4">
          <div className="font-mono text-[9px] tracking-[2px] text-[#c8ff00] mb-3 flex items-center gap-1.5">
            <Snowflake className="w-3 h-3" /> ICE COLD
          </div>
          {!vibe.cold_sectors?.length ? (
            <div className="font-mono text-[10px] text-[#6e6a5e]">nothing frozen</div>
          ) : (
            <div className="space-y-2.5">
              {vibe.cold_sectors.map((s, i) => (
                <div key={i} className="border-b border-[#262620] last:border-0 pb-2.5 last:pb-0">
                  <div className="flex justify-between items-baseline">
                    <span className="font-mono text-[12px] text-[#f4f0e6]">{s.sector}</span>
                    <span className="font-mono text-[11px] text-[#f87171]">
                      {s.change_pct >= 0 ? "+" : ""}{s.change_pct?.toFixed(2)}%
                    </span>
                  </div>
                  <div className="text-[12px] leading-snug text-[#6e6a5e] mt-0.5">{stripCitations(s.vibe)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Buzzing tickers */}
      {vibe.buzzing_tickers?.length > 0 && (
        <div className="bg-[#141411] border border-[#262620] rounded-lg p-4">
          <div className="font-mono text-[9px] tracking-[2px] text-[#6e6a5e] mb-3 flex items-center gap-1.5">
            <TrendingUp className="w-3 h-3" /> TALK OF THE TAPE
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {vibe.buzzing_tickers.map((t, i) => {
              const c = t.vibe === "BULLISH" ? "#c8ff00" : t.vibe === "BEARISH" ? "#f87171" : "#facc15"
              const VibeIcon = t.vibe === "BEARISH" ? TrendingDown : TrendingUp
              return (
                <div key={i} className="bg-[#0a0a0a] border border-[#262620] rounded p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-[13px] font-medium text-[#f4f0e6]">{t.ticker}</span>
                    <span className="flex items-center gap-1 font-mono text-[8px] tracking-wider" style={{ color: c }}>
                      <VibeIcon className="w-3 h-3" />
                      {t.vibe}
                    </span>
                  </div>
                  <div className="text-[12px] leading-snug text-[#6e6a5e]">{stripCitations(t.why)}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Social pulse + contrarian note */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-[#141411] border border-[#262620] rounded-lg p-4">
          <div className="font-mono text-[9px] tracking-[2px] text-[#c8ff00] mb-2 flex items-center gap-1.5">
            <Users className="w-3 h-3" /> SOCIAL PULSE
          </div>
          <div className="text-[13px] leading-relaxed text-[#f4f0e6]">{stripCitations(vibe.social_pulse)}</div>
        </div>
        <div className="bg-[#141411] border border-[#262620] rounded-lg p-4">
          <div className="font-mono text-[9px] tracking-[2px] text-[#fb923c] mb-2 flex items-center gap-1.5">
            <Eye className="w-3 h-3" /> CONTRARIAN NOTE
          </div>
          <div className="text-[13px] leading-relaxed text-[#f4f0e6]">{stripCitations(vibe.contrarian_note)}</div>
        </div>
      </div>

      {/* Play it */}
      <div
        className="rounded-lg p-4"
        style={{ background: `linear-gradient(135deg, ${sColor}12 0%, transparent 70%)`, border: `1px solid ${sColor}40` }}
      >
        <div className="font-mono text-[9px] tracking-[2px] mb-2 flex items-center gap-1.5" style={{ color: sColor }}>
          <Target className="w-3 h-3" /> HOW TO PLAY THE VIBE
        </div>
        <div className="text-[15px] leading-relaxed text-[#f4f0e6]">{stripCitations(vibe.play_it)}</div>
      </div>

      {/* Disclaimer */}
      <div className="font-mono text-[9px] text-[#6e6a5e] text-center leading-relaxed px-4">
        Vibe Check is a sentiment read for entertainment and context — not financial advice. Trade your plan, not the vibes.
      </div>
    </div>
  )
}
