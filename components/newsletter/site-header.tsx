import Link from "next/link"

const NAV = [
  { href: "#briefs", label: "The Briefs" },
  { href: "#sample", label: "Sample" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
]

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-4 py-4">
        <Link href="/" className="flex items-center gap-2" aria-label="White 80 home">
          <span className="h-3 w-3 bg-primary" aria-hidden="true" />
          <span className="font-display text-2xl tracking-wide text-foreground">WHITE 80</span>
        </Link>

        <nav aria-label="Primary" className="hidden md:block">
          <ul className="flex items-center gap-8">
            {NAV.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className="font-mono text-xs tracking-wider text-muted-foreground transition-colors hover:text-foreground"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-4">
          <Link
            href="/auth/login"
            className="font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            Sign In
          </Link>
          <a
            href="#signup"
            className="bg-primary px-4 py-2 font-mono text-xs tracking-wider text-primary-foreground transition-colors hover:bg-primary/85"
          >
            FREE TRIAL
          </a>
        </div>
      </div>
    </header>
  )
}
