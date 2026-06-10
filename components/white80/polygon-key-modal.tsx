"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { X, Key, ExternalLink } from "lucide-react"
import { setStoredPolygonKey, getStoredPolygonKey } from "@/lib/api"

interface PolygonKeyModalProps {
  onKeySet: () => void
  onClose: () => void
}

export function PolygonKeyModal({ onKeySet, onClose }: PolygonKeyModalProps) {
  const [key, setKey] = useState(getStoredPolygonKey() || "")
  const [error, setError] = useState("")

  const handleSubmit = () => {
    const trimmed = key.trim()
    if (!trimmed) {
      setError("Please enter your Polygon API key")
      return
    }
    
    // Polygon keys are typically alphanumeric strings
    if (trimmed.length < 10) {
      setError("API key seems too short")
      return
    }
    
    setStoredPolygonKey(trimmed)
    onKeySet()
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-[#141411] border-[#262620]">
        <CardHeader className="relative">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-[#6e6a5e] hover:text-[#f4f0e6] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-[#c8ff00]/10 border border-[#c8ff00]/30">
              <Key className="h-5 w-5 text-[#c8ff00]" />
            </div>
            <CardTitle className="text-[#f4f0e6]">Polygon API Key Required</CardTitle>
          </div>
          <CardDescription className="text-[#6e6a5e]">
            The Tier 1 Scanner uses Polygon.io for real-time market data, technical indicators, and options flow analysis.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="font-mono text-xs text-[#6e6a5e] uppercase tracking-wider">
              API Key
            </label>
            <input
              type="password"
              value={key}
              onChange={(e) => { setKey(e.target.value); setError(""); }}
              onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
              placeholder="Enter your Polygon API key"
              className="w-full bg-[#0a0a0a] border border-[#1e1e19] rounded px-3 py-2 text-[#f4f0e6] font-mono text-sm focus:border-[#c8ff00] focus:outline-none"
              autoFocus
            />
            {error && (
              <p className="text-[#f87171] text-xs font-mono">{error}</p>
            )}
          </div>

          <div className="bg-[#0a0a0a] border border-[#1e1e19] rounded p-3 space-y-2">
            <p className="text-sm text-[#f4f0e6]">To get a Polygon API key:</p>
            <ol className="text-xs text-[#6e6a5e] space-y-1 list-decimal list-inside">
              <li>Visit polygon.io and create a free account</li>
              <li>Go to Dashboard &gt; API Keys</li>
              <li>Copy your API key and paste it here</li>
            </ol>
            <a
              href="https://polygon.io/dashboard/api-keys"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-[#c8ff00] hover:underline mt-2"
            >
              Open Polygon Dashboard <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 border-[#1e1e19] text-[#6e6a5e] hover:text-[#f4f0e6] hover:border-[#6e6a5e]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1 bg-[#c8ff00] text-[#0a0a0a] hover:bg-[#c8ff00]/90"
            >
              Save Key
            </Button>
          </div>

          <p className="text-xs text-[#6e6a5e] text-center">
            Your key is stored locally in your browser and only sent to Polygon&apos;s API.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
