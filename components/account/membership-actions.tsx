"use client"

import { useActionState, useEffect, useState } from "react"
import {
  cancelMembership,
  openBillingPortal,
  resumeMembership,
  type MembershipState,
} from "@/app/actions/newsletter-account"

const INITIAL_STATE: MembershipState = { status: "idle" }

export function MembershipActions({ cancelScheduled, accessEnds }: { cancelScheduled: boolean; accessEnds: string | null }) {
  const [confirming, setConfirming] = useState(false)
  const [cancelState, cancelAction, canceling] = useActionState(cancelMembership, INITIAL_STATE)
  const [resumeState, resumeAction, resuming] = useActionState(resumeMembership, INITIAL_STATE)
  const [portalState, portalAction, openingPortal] = useActionState(openBillingPortal, INITIAL_STATE)

  useEffect(() => {
    // Stripe's portal can't render inside an iframe (embedded preview), so only redirect at the top level.
    if (portalState.status === "portal" && window.self === window.top) {
      window.location.href = portalState.url
    }
  }, [portalState])

  useEffect(() => {
    if (cancelState.status === "success") setConfirming(false)
  }, [cancelState])

  const messages = [cancelState, resumeState, portalState].filter(
    (s): s is Extract<MembershipState, { message: string }> => s.status === "error" || s.status === "success",
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <form action={portalAction}>
          <button
            type="submit"
            disabled={openingPortal}
            className="w-full rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60 sm:w-auto"
          >
            {openingPortal ? "Opening..." : "Change membership & billing"}
          </button>
        </form>

        {cancelScheduled ? (
          <form action={resumeAction}>
            <button
              type="submit"
              disabled={resuming}
              className="w-full rounded-full border border-border px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-60 sm:w-auto"
            >
              {resuming ? "Resuming..." : "Keep my membership"}
            </button>
          </form>
        ) : (
          !confirming && (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="rounded-full border border-border px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
            >
              Cancel membership
            </button>
          )
        )}
      </div>

      {confirming && !cancelScheduled && (
        <div role="alertdialog" aria-labelledby="cancel-title" className="flex flex-col gap-3 rounded-2xl border border-border bg-muted p-5">
          <p id="cancel-title" className="text-sm font-semibold text-foreground">
            Cancel your membership?
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            You won&apos;t be charged again. You keep access{accessEnds ? ` until ${accessEnds}` : " until the end of the current period"}.
          </p>
          <div className="flex flex-wrap gap-3">
            <form action={cancelAction}>
              <button
                type="submit"
                disabled={canceling}
                className="rounded-full bg-destructive px-5 py-2.5 text-sm font-semibold text-destructive-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {canceling ? "Canceling..." : "Yes, cancel"}
              </button>
            </form>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="rounded-full px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-background"
            >
              Never mind
            </button>
          </div>
        </div>
      )}

      <div aria-live="polite" className="flex flex-col gap-1 text-sm">
        {messages.map((m, i) => (
          <p key={i} className={m.status === "error" ? "text-destructive" : "text-primary"}>
            {m.message}
          </p>
        ))}
        {portalState.status === "portal" && (
          <a href={portalState.url} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-4">
            Open billing portal
          </a>
        )}
      </div>
    </div>
  )
}
