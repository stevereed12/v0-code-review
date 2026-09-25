"use client"

import { useActionState, useEffect } from "react"
import { startNewsletterCheckout, type CheckoutState } from "@/app/actions/newsletter-checkout"

const INITIAL_STATE: CheckoutState = { status: "idle" }

export function SignupSection() {
  const [state, formAction, pending] = useActionState(startNewsletterCheckout, INITIAL_STATE)

  useEffect(() => {
    // Stripe Checkout refuses to render inside an iframe (e.g. an embedded preview),
    // so only auto-redirect at the top level; otherwise the link below opens a new tab.
    if (state.status === "ready" && window.self === window.top) {
      window.location.href = state.url
    }
  }, [state])

  return (
    <section id="signup" className="scroll-mt-20 border-t border-border px-4 py-20 md:py-28">
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-8 text-center">
        <div className="flex flex-col gap-3">
          <h2 className="font-display text-5xl text-foreground text-balance md:text-7xl">
            WALK INTO THE OPEN <span className="text-primary">WITH THE READ</span>
          </h2>
          <p className="leading-relaxed text-muted-foreground text-pretty">
            Enter your email to start your free trial. You&apos;ll add a card on the next screen — nothing is
            charged for 7 days.
          </p>
        </div>

        <form action={formAction} className="flex w-full flex-col gap-3 sm:flex-row">
          <label htmlFor="signup-email" className="sr-only">
            Email address
          </label>
          <input
            id="signup-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            aria-invalid={state.status === "error"}
            aria-describedby="signup-status"
            className="flex-1 border border-border bg-card px-4 py-4 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
          <button
            type="submit"
            disabled={pending}
            className="bg-primary px-8 py-4 font-mono text-sm tracking-wider text-primary-foreground transition-colors hover:bg-primary/85 disabled:opacity-60"
          >
            {pending ? "STARTING..." : "START FREE TRIAL"}
          </button>
        </form>

        <div id="signup-status" aria-live="polite" className="min-h-6 font-mono text-xs">
          {state.status === "error" && <p className="text-destructive">{state.message}</p>}
          {state.status === "ready" && (
            <a href={state.url} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-4">
              Continue to secure checkout
            </a>
          )}
          {state.status === "idle" && (
            <p className="text-muted-foreground">Secure checkout by Stripe. $49/month after the trial. Cancel anytime.</p>
          )}
        </div>
      </div>
    </section>
  )
}
