"use client"

import Link from "next/link"
import { MobileMenu } from "./mobile-menu"

interface PageHeaderProps {
  currentPath?: string
}

export function PageHeader({ currentPath = "/" }: PageHeaderProps) {
  return (
    <header className="border-b border-[#262620] bg-[#0a0a0a]/95 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
          <div className="w-3 h-3 bg-[#c8ff00] animate-pulse" />
          <span className="font-display text-2xl tracking-wide text-[#f4f0e6]">WHITE 80</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/auth/login"
            className="hidden sm:block font-mono text-sm text-[#6e6a5e] hover:text-[#f4f0e6] transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/pricing"
            className="hidden sm:block font-mono text-sm bg-[#c8ff00] hover:bg-[#d9ff4d] text-[#0a0a0a] px-4 py-2 transition-colors"
          >
            Get Started
          </Link>
          <MobileMenu isLoggedIn={false} currentPath={currentPath} />
        </div>
      </div>
    </header>
  )
}
