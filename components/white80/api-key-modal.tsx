"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Key, ExternalLink, Eye, EyeOff } from "lucide-react"
import { setStoredApiKey, getStoredApiKey, clearStoredApiKey } from "@/lib/api"

interface ApiKeyModalProps {
  onKeySet: () => void
  onClose?: () => void
}

export function ApiKeyModal({ onKeySet, onClose }: ApiKeyModalProps) {
  const [key, setKey] = useState("")
  const [error, setError] = useState("")
  const [showKey, setShowKey] = useState(false)
  const existingKey = getStoredApiKey()

  const handleSubmit = () => {
    const trimmed = key.trim()
    if (!trimmed) {
      setError("Please enter your API key")
      return
    }
    if (!trimmed.startsWith("sk-ant-")) {
      setError("Invalid key format. Anthropic keys start with 'sk-ant-'")
      return
    }
    setStoredApiKey(trimmed)
    setError("")
    onKeySet()
  }

  const handleClear = () => {
    clearStoredApiKey()
    setKey("")
    setError("")
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-[#141411] border-[#1e1e19]">
        <CardHeader>
          <div className="flex items-center gap-2 text-[#c8ff00]">
            <Key className="w-5 h-5" />
            <CardTitle className="text-lg font-semibold">Anthropic API Key</CardTitle>
          </div>
          <CardDescription className="text-[#6e6a5e]">
            Your key is stored locally in your browser and sent directly to Anthropic.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {existingKey ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-3 bg-[#c8ff00]/10 border border-[#c8ff00]/30 rounded-md">
                <span className="text-[#c8ff00] font-mono text-sm">
                  {existingKey.slice(0, 12)}...{existingKey.slice(-4)}
                </span>
                <span className="text-[#c8ff00] text-xs ml-auto">Connected</span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 border-[#1e1e19] text-[#f4f0e6] hover:bg-[#262620]"
                  onClick={handleClear}
                >
                  Clear Key
                </Button>
                {onClose && (
                  <Button
                    className="flex-1 bg-[#c8ff00]/20 text-[#c8ff00] hover:bg-[#c8ff00]/30 border border-[#c8ff00]"
                    onClick={onClose}
                  >
                    Continue
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="relative">
                <Input
                  type={showKey ? "text" : "password"}
                  placeholder="sk-ant-api03-..."
                  value={key}
                  onChange={(e) => { setKey(e.target.value); setError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  className="bg-[#0a0a0a] border-[#1e1e19] text-[#f4f0e6] font-mono text-sm pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6e6a5e] hover:text-[#f4f0e6]"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-[#f87171] text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              <Button
                className="w-full bg-[#c8ff00]/20 text-[#c8ff00] hover:bg-[#c8ff00]/30 border border-[#c8ff00]"
                onClick={handleSubmit}
                disabled={!key.trim()}
              >
                Save API Key
              </Button>

              <a
                href="https://console.anthropic.com/settings/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 text-[#6e6a5e] hover:text-[#f4f0e6] text-sm transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                Get your API key from Anthropic Console
              </a>
            </>
          )}

          <div className="pt-2 border-t border-[#1e1e19]">
            <p className="text-xs text-[#6e6a5e] leading-relaxed">
              Your API key never leaves your browser except to call Anthropic directly. 
              It is not stored on any server.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
