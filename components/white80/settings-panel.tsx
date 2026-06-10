"use client"

import { useState, useEffect } from "react"
import { Bell, Volume2, Download, RotateCcw, HelpCircle, Key, Eye, EyeOff, Save, Check, AlertCircle, ChevronDown, ChevronUp } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { createClient } from "@/lib/supabase/client"

interface SettingsPanelProps {
  userId?: string
  soundEnabled: boolean
  notificationsEnabled: boolean
  onSoundToggle: (enabled: boolean) => void
  onNotificationsToggle: (enabled: boolean) => void
  onOpenExport: () => void
  onResetAll: () => void
  onShowGuide: () => void
  confirmReset: boolean
}

export function SettingsPanel({
  userId,
  soundEnabled,
  notificationsEnabled,
  onSoundToggle,
  onNotificationsToggle,
  onOpenExport,
  onResetAll,
  onShowGuide,
  confirmReset,
}: SettingsPanelProps) {
  const [showApiKeys, setShowApiKeys] = useState(false)
  const [polygonKey, setPolygonKey] = useState("")
  const [anthropicKey, setAnthropicKey] = useState("")
  const [showPolygon, setShowPolygon] = useState(false)
  const [showAnthropic, setShowAnthropic] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasKeys, setHasKeys] = useState({ polygon: false, anthropic: false })
  
  const supabase = createClient()

  useEffect(() => {
    if (!userId || !showApiKeys) return
    
    const checkKeys = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("polygon_api_key, anthropic_api_key")
        .eq("id", userId)
        .single()
      
      if (data) {
        setHasKeys({
          polygon: !!data.polygon_api_key,
          anthropic: !!data.anthropic_api_key
        })
        if (data.polygon_api_key) {
          setPolygonKey("••••••••••••" + data.polygon_api_key.slice(-4))
        }
        if (data.anthropic_api_key) {
          setAnthropicKey("••••••••••••" + data.anthropic_api_key.slice(-4))
        }
      }
    }
    checkKeys()
  }, [userId, supabase, showApiKeys])

  const handleSaveKeys = async () => {
    if (!userId) return
    setSaving(true)
    setError(null)
    setSaved(false)

    try {
      const updates: Record<string, string> = {}
      
      if (polygonKey && !polygonKey.startsWith("••••")) {
        updates.polygon_api_key = polygonKey
      }
      if (anthropicKey && !anthropicKey.startsWith("••••")) {
        updates.anthropic_api_key = anthropicKey
      }

      if (Object.keys(updates).length === 0) {
        setError("No changes to save")
        setSaving(false)
        return
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", userId)

      if (updateError) throw updateError

      setSaved(true)
      setHasKeys({
        polygon: hasKeys.polygon || !!updates.polygon_api_key,
        anthropic: hasKeys.anthropic || !!updates.anthropic_api_key
      })
      
      if (updates.polygon_api_key) {
        setPolygonKey("••••••••••••" + updates.polygon_api_key.slice(-4))
      }
      if (updates.anthropic_api_key) {
        setAnthropicKey("••••••••••••" + updates.anthropic_api_key.slice(-4))
      }

      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save keys")
    } finally {
      setSaving(false)
    }
  }

  const handleKeyFocus = (setter: (val: string) => void, currentVal: string) => {
    if (currentVal.startsWith("••••")) {
      setter("")
    }
  }

  return (
    <div className="bg-[#0a0a0a] border border-[#262620] rounded-md p-3 mb-4">
      <div className="font-mono text-[9px] tracking-[2px] text-[#6e6a5e] mb-3">SETTINGS</div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-[#f4f0e6]">
            <Volume2 className="w-4 h-4 text-[#c8ff00]" />
            Sound alerts
          </label>
          <Switch checked={soundEnabled} onCheckedChange={onSoundToggle} />
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-[#f4f0e6]">
            <Bell className="w-4 h-4 text-[#f4f0e6]" />
            Desktop notifications
          </label>
          <Switch checked={notificationsEnabled} onCheckedChange={onNotificationsToggle} />
        </div>

        {/* API Keys Section */}
        {userId && (
          <div className="pt-2 border-t border-[#262620]">
            <button
              onClick={() => setShowApiKeys(!showApiKeys)}
              className="w-full flex items-center justify-between py-1 text-sm text-[#f4f0e6] hover:text-[#f4f0e6] transition-colors"
            >
              <span className="flex items-center gap-2">
                <Key className="w-4 h-4 text-[#fb923c]" />
                API Keys
                {(hasKeys.polygon && hasKeys.anthropic) && (
                  <span className="text-[8px] text-[#c8ff00] font-mono bg-[#c8ff00]/10 px-1.5 py-0.5 rounded">CONFIGURED</span>
                )}
              </span>
              {showApiKeys ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            
            {showApiKeys && (
              <div className="mt-3 space-y-3">
                {/* Polygon API Key */}
                <div>
                  <label className="flex items-center gap-2 text-[10px] text-[#6e6a5e] mb-1 font-mono tracking-wider">
                    POLYGON KEY
                    {hasKeys.polygon && <Check className="w-3 h-3 text-[#c8ff00]" />}
                  </label>
                  <div className="relative">
                    <input
                      type={showPolygon ? "text" : "password"}
                      value={polygonKey}
                      onChange={(e) => setPolygonKey(e.target.value)}
                      onFocus={() => handleKeyFocus(setPolygonKey, polygonKey)}
                      placeholder="Enter key..."
                      className="w-full bg-[#0a0a0a] border border-[#262620] rounded px-3 py-1.5 text-xs text-[#f4f0e6] font-mono placeholder:text-[#6e6a5e] focus:outline-none focus:border-[#c8ff00]/50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPolygon(!showPolygon)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[#6e6a5e] hover:text-[#f4f0e6]"
                    >
                      {showPolygon ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Anthropic API Key */}
                <div>
                  <label className="flex items-center gap-2 text-[10px] text-[#6e6a5e] mb-1 font-mono tracking-wider">
                    ANTHROPIC KEY
                    {hasKeys.anthropic && <Check className="w-3 h-3 text-[#c8ff00]" />}
                  </label>
                  <div className="relative">
                    <input
                      type={showAnthropic ? "text" : "password"}
                      value={anthropicKey}
                      onChange={(e) => setAnthropicKey(e.target.value)}
                      onFocus={() => handleKeyFocus(setAnthropicKey, anthropicKey)}
                      placeholder="Enter key..."
                      className="w-full bg-[#0a0a0a] border border-[#262620] rounded px-3 py-1.5 text-xs text-[#f4f0e6] font-mono placeholder:text-[#6e6a5e] focus:outline-none focus:border-[#f4f0e6]/50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAnthropic(!showAnthropic)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[#6e6a5e] hover:text-[#f4f0e6]"
                    >
                      {showAnthropic ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-[10px] text-[#f87171]">
                    <AlertCircle className="w-3 h-3" />
                    {error}
                  </div>
                )}

                <button
                  onClick={handleSaveKeys}
                  disabled={saving}
                  className={`w-full flex items-center justify-center gap-2 py-1.5 text-[9px] font-mono tracking-wider rounded transition-all ${
                    saved
                      ? "bg-[#c8ff00]/20 border border-[#c8ff00] text-[#c8ff00]"
                      : "bg-[#fb923c]/10 border border-[#fb923c] text-[#fb923c] hover:bg-[#fb923c]/20"
                  } disabled:opacity-50`}
                >
                  {saving ? "SAVING..." : saved ? "SAVED" : "SAVE KEYS"}
                </button>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2 pt-2 border-t border-[#262620]">
          <button
            onClick={onShowGuide}
            className="flex items-center justify-center gap-2 py-2 px-3 bg-[#f4f0e6]/10 border border-[#f4f0e6]/50 text-[#f4f0e6] text-[10px] font-mono tracking-wider rounded transition-all hover:bg-[#f4f0e6]/20 hover:border-[#f4f0e6]"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            GUIDE
          </button>
          <button
            onClick={onOpenExport}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-[#c8ff00]/10 border border-[#c8ff00] text-[#c8ff00] text-[10px] font-mono tracking-wider rounded transition-all hover:bg-[#c8ff00]/20"
          >
            <Download className="w-3.5 h-3.5" />
            EXPORT / IMPORT
          </button>
          <button
            onClick={onResetAll}
            className={`flex items-center justify-center gap-2 py-2 px-3 border text-[10px] font-mono tracking-wider rounded transition-all ${
              confirmReset
                ? "bg-[#f87171]/20 border-[#f87171] text-[#f87171]"
                : "border-[#f87171]/30 text-[#f87171]/70 hover:border-[#f87171] hover:text-[#f87171]"
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {confirmReset ? "CONFIRM?" : "RESET"}
          </button>
        </div>
      </div>
    </div>
  )
}
