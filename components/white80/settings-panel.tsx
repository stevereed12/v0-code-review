"use client"

import { Bell, Volume2, Download, RotateCcw } from "lucide-react"
import { Switch } from "@/components/ui/switch"

interface SettingsPanelProps {
  soundEnabled: boolean
  notificationsEnabled: boolean
  onSoundToggle: (enabled: boolean) => void
  onNotificationsToggle: (enabled: boolean) => void
  onOpenExport: () => void
  onResetAll: () => void
  confirmReset: boolean
}

export function SettingsPanel({
  soundEnabled,
  notificationsEnabled,
  onSoundToggle,
  onNotificationsToggle,
  onOpenExport,
  onResetAll,
  confirmReset,
}: SettingsPanelProps) {
  return (
    <div className="bg-[#090c14] border border-[#131c2e] rounded-md p-3 mb-4">
      <div className="font-mono text-[9px] tracking-[2px] text-[#3d4f6b] mb-3">SETTINGS</div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-[#d6dff0]">
            <Volume2 className="w-4 h-4 text-[#00e5ff]" />
            Sound alerts
          </label>
          <Switch checked={soundEnabled} onCheckedChange={onSoundToggle} />
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-[#d6dff0]">
            <Bell className="w-4 h-4 text-[#a78bfa]" />
            Desktop notifications
          </label>
          <Switch checked={notificationsEnabled} onCheckedChange={onNotificationsToggle} />
        </div>

        <div className="flex gap-2 pt-2 border-t border-[#131c2e]">
          <button
            onClick={onOpenExport}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-[#00e5ff]/10 border border-[#00e5ff] text-[#00e5ff] text-[10px] font-mono tracking-wider rounded transition-all hover:bg-[#00e5ff]/20"
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
