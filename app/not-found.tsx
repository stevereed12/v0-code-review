import Link from "next/link"
import { PageHeader } from "@/components/white80/page-header"
import { SiteFooter } from "@/components/white80/site-footer"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      <PageHeader />
      <main className="flex-1 flex items-center justify-center px-4 py-24">
        <div className="text-center max-w-md">
          <p className="font-mono text-[10px] tracking-[0.3em] text-[#c8ff00] mb-4">SIGNAL LOST</p>
          <h1 className="font-display text-8xl md:text-9xl text-[#f4f0e6] leading-none mb-4">404</h1>
          <p className="font-mono text-sm text-[#6e6a5e] mb-10 leading-relaxed">
            This page is not on the tape. The play got called back — head to the desk instead.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/"
              className="font-mono text-sm bg-[#c8ff00] hover:bg-[#d9ff4d] text-[#0a0a0a] px-8 py-3 transition-colors"
            >
              BACK TO HOME
            </Link>
            <Link
              href="/dashboard"
              className="font-mono text-sm text-[#f4f0e6] border border-[#262620] hover:border-[#c8ff00]/50 px-8 py-3 transition-colors"
            >
              GO TO THE DESK
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
