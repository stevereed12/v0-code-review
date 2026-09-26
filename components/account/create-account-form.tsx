"use client"

import { useActionState } from "react"
import Link from "next/link"
import { createNewsletterAccount, type CreateAccountState } from "@/app/actions/newsletter-account"

const INITIAL_STATE: CreateAccountState = { status: "idle" }

const inputClass =
  "w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"

export function CreateAccountForm({ sessionId, email }: { sessionId: string; email: string }) {
  const [state, formAction, pending] = useActionState(createNewsletterAccount, INITIAL_STATE)

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="session_id" value={sessionId} />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="account-email" className="text-sm font-medium text-foreground">
          Email
        </label>
        <input id="account-email" type="email" value={email} readOnly className={`${inputClass} bg-muted`} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="account-password" className="text-sm font-medium text-foreground">
          Create a password
        </label>
        <input
          id="account-password"
          name="password"
          type="password"
          required
          minLength={8}
          maxLength={72}
          autoComplete="new-password"
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="account-confirm" className="text-sm font-medium text-foreground">
          Confirm password
        </label>
        <input
          id="account-confirm"
          name="confirm"
          type="password"
          required
          minLength={8}
          maxLength={72}
          autoComplete="new-password"
          className={inputClass}
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Creating account..." : "Create account"}
      </button>

      <div aria-live="polite" className="min-h-5 text-sm">
        {state.status === "error" && (
          <p className="text-destructive">
            {state.message}{" "}
            {state.existingAccount && (
              <Link href="/auth/login?next=/account" className="font-medium text-primary underline underline-offset-4">
                Sign in
              </Link>
            )}
          </p>
        )}
      </div>
    </form>
  )
}
