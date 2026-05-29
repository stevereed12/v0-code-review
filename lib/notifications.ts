// ─── NOTIFICATIONS & SOUND ──────────────────────────────────────────────────

let audioContext: AudioContext | null = null

export function playNotificationSound(type: "success" | "alert" = "success") {
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    }

    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    if (type === "success") {
      // Pleasant ascending chime
      oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime) // C5
      oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1) // E5
      oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2) // G5
    } else {
      // Alert tone
      oscillator.frequency.setValueAtTime(440, audioContext.currentTime) // A4
      oscillator.frequency.setValueAtTime(349.23, audioContext.currentTime + 0.15) // F4
    }

    oscillator.type = "sine"
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4)

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.4)
  } catch (err) {
    console.warn("Could not play notification sound:", err)
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) {
    return false
  }

  if (Notification.permission === "granted") {
    return true
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission()
    return permission === "granted"
  }

  return false
}

export function sendDesktopNotification(title: string, body: string, tag?: string) {
  if (!("Notification" in window) || Notification.permission !== "granted") {
    return
  }

  try {
    new Notification(title, {
      body,
      tag: tag || "white80",
      icon: "/icon-dark-32x32.png",
      badge: "/icon-dark-32x32.png",
    })
  } catch (err) {
    console.warn("Could not send notification:", err)
  }
}

export function notifyOnComplete(
  type: "signals" | "news" | "curator" | "brief" | "scout" | "vibe",
  count?: number,
  options?: { soundEnabled?: boolean; notificationsEnabled?: boolean }
) {
  const { soundEnabled = true, notificationsEnabled = true } = options || {}

  const messages: Record<string, { title: string; body: string }> = {
    signals: { title: "Signals Ready", body: `${count || 0} trading signals generated` },
    news: { title: "News Scan Complete", body: `${count || 0} tickers scanned for news` },
    curator: { title: "Watchlist Curated", body: "Your watchlist has been updated" },
    brief: { title: "Pre-Market Brief Ready", body: "Morning market overview is ready" },
    scout: { title: "Scout Complete", body: `${count || 0} new opportunities found` },
    vibe: { title: "Vibe Check Ready", body: "The market mood read is in" },
  }

  const msg = messages[type]

  if (soundEnabled) {
    playNotificationSound("success")
  }

  if (notificationsEnabled) {
    sendDesktopNotification(msg.title, msg.body, `white80-${type}`)
  }
}
