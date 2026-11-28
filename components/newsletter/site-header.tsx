import Link from "next/link"
import { RESEARCH_PATH } from "@/lib/growth"
import { TrialLink } from "@/components/newsletter/growth-analytics"

const NAV = [
  { href: "/#briefs", label: "The briefs" },
  { href: RESEARCH_PATH, label: "Research" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/#faq", label: "FAQ" },
]

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-4 py-3">
        <Link href="/" className="flex items-center gap-2" aria-label="White 80 home">
          <span className="h-2.5 w-2.5 rounded-full bg-accent ring-1 ring-foreground/20" aria-hidden="true" />
          <span className="font-display text-xl tracking-wide text-foreground">WHITE 80</span>
        </Link>

        <nav aria-label="Primary" className="hidden md:block">
          <ul className="flex items-center gap-7">
            {NAV.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-4">
          <Link
            href="/auth/login?next=/account"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Sign in
          </Link>
          <TrialLink
            placement="header"
            className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-85"
          >
            Free trial
          </TrialLink>
        </div>
      </div>
    </header>
  )
}
