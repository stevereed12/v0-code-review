"use client"

import Link from "next/link"
import { MobileMenu } from "./mobile-menu"

interface PageHeaderProps {
  currentPath?: string
}

export function PageHeader({ currentPath = "/" }: PageHeaderProps) {
  return (
    <header className="border-b border-[#131c2e] bg-[#060a10]">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
          <div className="w-3 h-3 bg-[#00e5ff] rounded-full animate-pulse" />
          <span className="font-mono text-lg tracking-wider text-white">WHITE 80</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/auth/login"
            className="hidden sm:block font-mono text-sm text-[#3d4f6b] hover:text-white transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/pricing"
            className="hidden sm:block font-mono text-sm bg-[#00e5ff] hover:bg-[#00e5ff]/90 text-[#060a10] px-4 py-2 rounded transition-colors"
          >
            Get Started
          </Link>
          <MobileMenu isLoggedIn={false} currentPath={currentPath} />
        </div>
      </div>
    </header>
  )
}
