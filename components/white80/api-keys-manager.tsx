"use client"

import { useState, useEffect } from "react"
import { Key, Eye, EyeOff, Save, Check, AlertCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { setStoredApiKey, setStoredPolygonKey } from "@/lib/api"

interface ApiKeysManagerProps {
  userId: string
}

export function ApiKeysManager({ userId }: ApiKeysManagerProps) {
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
    // Check if user has keys stored
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
        // Show masked versions if keys exist
        if (data.polygon_api_key) {
          setPolygonKey("••••••••••••" + data.polygon_api_key.slice(-4))
        }
        if (data.anthropic_api_key) {
          setAnthropicKey("••••••••••••" + data.anthropic_api_key.slice(-4))
        }
      }
    }
    checkKeys()
  }, [userId, supabase])

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSaved(false)

    try {
      const updates: Record<string, string> = {}
      
      // Only update keys that were actually changed (not masked)
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

      // Keep localStorage in sync so scan/thesis calls use the new key immediately
      if (updates.anthropic_api_key) {
        setStoredApiKey(updates.anthropic_api_key)
      }
      if (updates.polygon_api_key) {
        setStoredPolygonKey(updates.polygon_api_key)
      }

      setSaved(true)
      setHasKeys({
        polygon: hasKeys.polygon || !!updates.polygon_api_key,
        anthropic: hasKeys.anthropic || !!updates.anthropic_api_key
      })
      
      // Update display to show masked version
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
    // Clear masked value when user focuses to enter new key
    if (currentVal.startsWith("••••")) {
      setter("")
    }
  }

  return (
    <div className="bg-[#0a0a0a] border border-[#262620] rounded-md p-3 mb-4">
      <div className="font-mono text-[9px] tracking-[2px] text-[#6e6a5e] mb-3">API KEYS</div>
      
      <div className="space-y-3">
        {/* Polygon API Key */}
        <div>
          <label className="flex items-center gap-2 text-xs text-[#f4f0e6] mb-1.5">
            <Key className="w-3.5 h-3.5 text-[#c8ff00]" />
            Polygon API Key
            {hasKeys.polygon && (
              <span className="text-[9px] text-[#c8ff00] font-mono">CONFIGURED</span>
            )}
          </label>
          <div className="relative">
            <input
              type={showPolygon ? "text" : "password"}
              value={polygonKey}
              onChange={(e) => setPolygonKey(e.target.value)}
              onFocus={() => handleKeyFocus(setPolygonKey, polygonKey)}
              placeholder="Enter Polygon API key..."
              className="w-full bg-[#0a0a0a] border border-[#262620] rounded px-3 py-2 text-sm text-[#f4f0e6] font-mono placeholder:text-[#6e6a5e] focus:outline-none focus:border-[#c8ff00]/50"
            />
            <button
              type="button"
              onClick={() => setShowPolygon(!showPolygon)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[#6e6a5e] hover:text-[#f4f0e6] transition-colors"
            >
              {showPolygon ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Anthropic API Key */}
        <div>
          <label className="flex items-center gap-2 text-xs text-[#f4f0e6] mb-1.5">
            <Key className="w-3.5 h-3.5 text-[#f4f0e6]" />
            Anthropic API Key
            {hasKeys.anthropic && (
              <span className="text-[9px] text-[#c8ff00] font-mono">CONFIGURED</span>
            )}
          </label>
          <div className="relative">
            <input
              type={showAnthropic ? "text" : "password"}
              value={anthropicKey}
              onChange={(e) => setAnthropicKey(e.target.value)}
              onFocus={() => handleKeyFocus(setAnthropicKey, anthropicKey)}
              placeholder="Enter Anthropic API key..."
              className="w-full bg-[#0a0a0a] border border-[#262620] rounded px-3 py-2 text-sm text-[#f4f0e6] font-mono placeholder:text-[#6e6a5e] focus:outline-none focus:border-[#f4f0e6]/50"
            />
            <button
              type="button"
              onClick={() => setShowAnthropic(!showAnthropic)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[#6e6a5e] hover:text-[#f4f0e6] transition-colors"
            >
              {showAnthropic ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="flex items-center gap-2 text-[11px] text-[#f87171]">
            <AlertCircle className="w-3.5 h-3.5" />
            {error}
          </div>
        )}

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className={`w-full flex items-center justify-center gap-2 py-2 px-3 text-[10px] font-mono tracking-wider rounded transition-all ${
            saved
              ? "bg-[#c8ff00]/20 border border-[#c8ff00] text-[#c8ff00]"
              : "bg-[#c8ff00]/10 border border-[#c8ff00] text-[#c8ff00] hover:bg-[#c8ff00]/20"
          } disabled:opacity-50`}
        >
          {saving ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-[#c8ff00]/30 border-t-[#c8ff00] rounded-full animate-spin" />
              SAVING...
            </>
          ) : saved ? (
            <>
              <Check className="w-3.5 h-3.5" />
              SAVED
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5" />
              SAVE API KEYS
            </>
          )}
        </button>

        <p className="text-[10px] text-[#6e6a5e] leading-relaxed">
          Your API keys are stored securely and used to power AI features. 
          Keys are encrypted and never shared.
        </p>
      </div>
    </div>
  )
}
