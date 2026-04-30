// ─── LOCAL STORAGE UTILITY ──────────────────────────────────────────────────

const STORAGE_PREFIX = "white80:"

export const storage = {
  get<T>(key: string): T | null {
    if (typeof window === "undefined") return null
    try {
      const item = localStorage.getItem(STORAGE_PREFIX + key)
      return item ? JSON.parse(item) : null
    } catch {
      return null
    }
  },

  set<T>(key: string, value: T): void {
    if (typeof window === "undefined") return
    try {
      localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value))
    } catch (err) {
      console.error("Storage set error:", err)
    }
  },

  remove(key: string): void {
    if (typeof window === "undefined") return
    try {
      localStorage.removeItem(STORAGE_PREFIX + key)
    } catch {
      // Ignore
    }
  },

  clear(): void {
    if (typeof window === "undefined") return
    try {
      const keys = Object.keys(localStorage).filter((k) => k.startsWith(STORAGE_PREFIX))
      keys.forEach((k) => localStorage.removeItem(k))
    } catch {
      // Ignore
    }
  },
}

// ─── STORAGE KEYS ────────────────────────────────────────────────────────────

export const STORAGE_KEYS = {
  WATCHLIST: "watchlist",
  PINNED: "pinned",
  BLOCKED: "blocked",
  TRACKER: "tracker",
  NEWS: "news_last",
  CURATOR: "curator_last",
  SCOUT: "scout_last",
  SCOUT_THEMES: "scout_themes",
  SCOUT_CAP: "scout_cap",
  SCOUT_HORIZON: "scout_horizon",
  NOTIFICATIONS_ENABLED: "notifications_enabled",
  SOUND_ENABLED: "sound_enabled",
} as const
