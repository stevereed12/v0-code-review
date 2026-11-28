"use client"

import Link from "next/link"
import { useActionState, useEffect, useRef } from "react"
import { joinResearchList, type ResearchSignupState } from "@/app/actions/research-signup"
import { getCampaign, trackGrowth } from "@/components/newsletter/growth-analytics"

const INITIAL_STATE: ResearchSignupState = "idle"

export function ResearchSignup({ placement }: { placement: string }) {
  const [state, action, pending] = useActionState(joinResearchList, INITIAL_STATE)
  const tracked = useRef(false)
  const finished = state === "saved" || state === "received"

  useEffect(() => {
    if (state === "saved" && !tracked.current) {
      tracked.current = true
      trackGrowth("Research Email Signup", getCampaign()?.utm_source ?? "untagged", placement)
    }
  }, [state, placement])

  return (
    <section id="research-email" className="scroll-mt-20 rounded-2xl border border-border bg-card p-6 md:p-8">
      <h2 className="text-2xl font-semibold tracking-tight">Get free White 80 research notes</h2>
      <p className="mt-2 text-muted-foreground">Occasional market research and brief previews. No card required.</p>
      {!finished && (
        <form action={action} className="mt-5 flex flex-col gap-3 sm:flex-row">
          <label htmlFor="research-email-address" className="sr-only">Email address</label>
          <input
            id="research-email-address"
            type="email"
            name="email"
            required
            maxLength={254}
            autoComplete="email"
            placeholder="you@example.com"
            aria-invalid={state === "invalid"}
            aria-describedby="research-email-status"
            className="min-w-0 flex-1 rounded-full border border-border bg-background px-4 py-3 text-sm"
          />
          <div hidden><label>Company <input name="company" autoComplete="off" tabIndex={-1} /></label></div>
          <button disabled={pending} className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60">
            {pending ? "Signing up…" : "Sign up free"}
          </button>
        </form>
      )}
      <div id="research-email-status" aria-live="polite" className="mt-3 text-sm text-muted-foreground">
        {finished && <p>Thanks. If this address can receive these emails, we&apos;ll send the next note there.</p>}
        {state === "invalid" && <p>Enter a valid email address.</p>}
        {state === "unavailable" && <p>Signup is temporarily unavailable. Please try again later.</p>}
        {!finished && (
          <p>By signing up, you agree to receive these emails. Unsubscribe anytime. <Link href="/privacy" className="underline">Privacy policy</Link></p>
        )}
      </div>
    </section>
  )
}
