"use client"

import { useEffect, type ComponentProps } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { Analytics, type BeforeSendEvent } from "@vercel/analytics/next"
import { track } from "@vercel/analytics"
import { readCampaign, type Campaign } from "@/lib/growth"

const CAMPAIGN_KEY = "white80-campaign"
const PLACEMENT_KEY = "white80-trial-placement"

export function getCampaign(): Campaign | null {
  const params = new URLSearchParams(window.location.search)
  const current = readCampaign((key) => params.get(key))
  try {
    if (current) {
      sessionStorage.setItem(CAMPAIGN_KEY, JSON.stringify(current))
      return current
    }
    const saved = JSON.parse(sessionStorage.getItem(CAMPAIGN_KEY) ?? "null")
    return readCampaign((key) => saved?.[key])
  } catch {
    return current
  }
}

export function addCheckoutAttribution(form: HTMLFormElement) {
  const campaign = getCampaign()
  let placement = "signup"
  try {
    placement = sessionStorage.getItem(PLACEMENT_KEY) ?? placement
  } catch {}
  for (const [key, value] of Object.entries({ placement, ...campaign })) {
    const input = form.elements.namedItem(key)
    if (input instanceof HTMLInputElement) input.value = value
  }
}

function beforeSend(event: BeforeSendEvent): BeforeSendEvent | null {
  const url = new URL(event.url, window.location.origin)
  url.search = ""
  url.hash = ""
  if (event.type === "pageview" && /^\/(auth|account|dashboard|onboarding|subscribed|checkout)(\/|$)/.test(url.pathname)) return null
  return { ...event, url: url.toString() }
}

export function GrowthAnalytics() {
  const pathname = usePathname()
  useEffect(() => { getCampaign() }, [pathname])
  return process.env.NODE_ENV === "production" ? <Analytics beforeSend={beforeSend} /> : null
}

export function trackGrowth(event: string, channel: string, placement: string) {
  track(event, { channel, placement })
}

export function TrialLink({ placement, ...props }: Omit<ComponentProps<typeof Link>, "href" | "onClick"> & { placement: string }) {
  return (
    <Link
      {...props}
      href="/#signup"
      onClick={() => {
        trackGrowth("Trial CTA Clicked", getCampaign()?.utm_source ?? "untagged", placement)
        try { sessionStorage.setItem(PLACEMENT_KEY, placement) } catch {}
      }}
    />
  )
}

export function TrialCompleted({ eventKey, channel, placement }: { eventKey: string; channel: string; placement: string }) {
  useEffect(() => {
    try {
      const key = `white80-trial-${eventKey}`
      if (sessionStorage.getItem(key)) return
      sessionStorage.setItem(key, "1")
    } catch {}
    trackGrowth("Trial Checkout Completed", channel, placement)
  }, [eventKey, channel, placement])
  return null
}
