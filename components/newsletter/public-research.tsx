import Link from "next/link"
import { SiteHeader } from "@/components/newsletter/site-header"
import { SiteFooter } from "@/components/white80/site-footer"
import { TrialLink } from "@/components/newsletter/growth-analytics"
import { ResearchSignup } from "@/components/newsletter/research-signup"
import { RESEARCH_PATH } from "@/lib/growth"

export function ResearchShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="landing min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
    </div>
  )
}

export function ResearchIntro({ label, title, children }: { label: string; title: string; children: React.ReactNode }) {
  return (
    <header className="mx-auto max-w-6xl px-4 pb-10 pt-14 md:pt-20">
      <p className="mb-4 font-mono text-sm text-muted-foreground">{label}</p>
      <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-balance md:text-6xl">{title}</h1>
      <div className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">{children}</div>
    </header>
  )
}

export function ResearchNext({ placement }: { placement: string }) {
  return (
    <div className="mx-auto grid max-w-6xl gap-5 px-4 py-12 md:grid-cols-2 md:py-16">
      {process.env.RESEND_RESEARCH_API_KEY && process.env.RESEND_RESEARCH_SEGMENT_ID && <ResearchSignup placement={placement} />}
      <section className="rounded-2xl border border-border bg-card p-6 md:p-8">
        <h2 className="text-2xl font-semibold tracking-tight">Get both briefs every trading day</h2>
        <p className="mt-2 text-muted-foreground">Try White 80 Pro for 7 days. Card required. $49/month afterward unless you cancel.</p>
        <div className="mt-5 flex flex-wrap items-center gap-4">
          <TrialLink placement={placement} className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90">
            Start free trial
          </TrialLink>
          {placement !== "research" && <Link href={RESEARCH_PATH} className="text-sm underline underline-offset-4">More research</Link>}
        </div>
      </section>
    </div>
  )
}
