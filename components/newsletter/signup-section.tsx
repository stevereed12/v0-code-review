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
    <section id="signup" className="scroll-mt-20 px-4 pb-16 md:pb-24">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-7 rounded-3xl bg-primary px-6 py-14 text-center md:py-20">
        <div className="flex max-w-xl flex-col gap-3">
          <h2 className="text-3xl font-semibold tracking-tight text-primary-foreground text-balance md:text-4xl">
            Walk into the open with the read.
          </h2>
          <p className="leading-relaxed text-primary-foreground/70 text-pretty">
            Enter your email to start your free trial. You&apos;ll add a card on the next screen, and nothing is
            charged for 7 days.
          </p>
        </div>

        <form action={formAction} className="flex w-full max-w-lg flex-col gap-3 sm:flex-row">
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
            className="flex-1 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-5 py-3.5 text-sm text-primary-foreground placeholder:text-primary-foreground/50 focus:border-accent focus:outline-none"
          />
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-accent px-7 py-3.5 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {pending ? "Starting..." : "Start free trial"}
          </button>
        </form>

        <div id="signup-status" aria-live="polite" className="min-h-6 text-sm">
          {state.status === "error" && <p className="text-accent">{state.message}</p>}
          {state.status === "ready" && (
            <a
              href={state.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent underline underline-offset-4"
            >
              Continue to secure checkout
            </a>
          )}
          {state.status === "idle" && (
            <p className="text-primary-foreground/60">
              Secure checkout by Stripe. $49/month after the trial. Cancel anytime.
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
