"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"

function ErrorContent() {
  const searchParams = useSearchParams()
  const message = searchParams.get("message") || "An authentication error occurred"

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      {/* Header */}
      <header className="border-b border-[#262620]">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <Link href="/" className="inline-flex items-center gap-2 hover:opacity-90 transition-opacity">
            <div className="w-3 h-3 bg-[#c8ff00] rounded-full animate-pulse" />
            <span className="font-mono text-lg tracking-wider text-white">WHITE 80</span>
          </Link>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-[#141411] border border-[#f87171]/30 rounded-lg p-6 text-center">
            <div className="w-12 h-12 bg-[#f87171]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-[#f87171]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="font-mono text-lg text-white mb-2">Authentication Error</h2>
            <p className="text-[#6e6a5e] font-mono text-sm mb-6">
              {message}
            </p>
            <div className="space-y-3">
              <Link
                href="/auth/signup"
                className="block w-full bg-[#c8ff00] hover:bg-[#c8ff00]/90 text-[#0a0a0a] font-mono text-sm tracking-wider py-2.5 rounded transition-colors"
              >
                TRY AGAIN
              </Link>
              <Link
                href="/auth/login"
                className="block w-full bg-[#262620] hover:bg-[#1e1e19] text-white font-mono text-sm tracking-wider py-2.5 rounded transition-colors border border-[#262620]"
              >
                SIGN IN INSTEAD
              </Link>
              <Link
                href="/"
                className="block w-full text-[#6e6a5e] hover:text-white font-mono text-xs py-2 transition-colors"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#c8ff00] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ErrorContent />
    </Suspense>
  )
}
