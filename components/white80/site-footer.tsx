import Link from "next/link"

const PRODUCT_LINKS = [
  { href: "/pricing", label: "Pricing" },
  { href: "/faq", label: "FAQ" },
  { href: "/changelog", label: "Changelog" },
]

const COMPANY_LINKS = [
  { href: "/contact", label: "Contact" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
]

export function SiteFooter() {
  return (
    <footer className="border-t border-[#262620] bg-[#0a0a0a]">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row justify-between gap-10">
          {/* Brand */}
          <div className="max-w-xs">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2.5 h-2.5 bg-[#c8ff00]" />
              <span className="font-display text-2xl tracking-wide text-[#f4f0e6]">WHITE 80</span>
            </div>
            <p className="font-mono text-xs text-[#6e6a5e] leading-relaxed">
              Intelligence is the position. An AI research desk for self-directed traders.
            </p>
          </div>

          {/* Links */}
          <div className="flex gap-16">
            <nav aria-label="Product">
              <h3 className="font-mono text-[10px] tracking-[0.2em] text-[#6e6a5e] mb-4">PRODUCT</h3>
              <ul className="flex flex-col gap-2.5">
                {PRODUCT_LINKS.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="font-mono text-xs text-[#f4f0e6]/70 hover:text-[#c8ff00] transition-colors"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <nav aria-label="Company">
              <h3 className="font-mono text-[10px] tracking-[0.2em] text-[#6e6a5e] mb-4">COMPANY</h3>
              <ul className="flex flex-col gap-2.5">
                {COMPANY_LINKS.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="font-mono text-xs text-[#f4f0e6]/70 hover:text-[#c8ff00] transition-colors"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-[#262620] flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <p className="font-mono text-[10px] text-[#6e6a5e]">
            © {new Date().getFullYear()} White 80. All rights reserved.
          </p>
          <p className="font-mono text-[10px] text-[#6e6a5e]">
            Information intelligence platform. Not financial advice. Trade at your own risk.
          </p>
        </div>
      </div>
    </footer>
  )
}
