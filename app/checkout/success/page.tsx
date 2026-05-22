"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { CheckCircle2 } from "lucide-react"
import Link from "next/link"

function SuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const sessionId = searchParams.get("session_id")
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    if (!sessionId) {
      router.push("/pricing")
      return
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          router.push(`/onboarding?session_id=${sessionId}`)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [sessionId, router])

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "radial-gradient(ellipse at top, #151e30, #05070e 70%)" }}
    >
      <div className="max-w-md w-full text-center">
        {/* Logo */}
        <Link href="/" className="inline-flex items-center gap-2 mb-8">
          <div className="w-3 h-3 bg-[#00e5ff] rounded-full animate-pulse" />
          <span className="font-mono text-xl tracking-wider text-white">WHITE 80</span>
        </Link>

        {/* Success Card */}
        <div className="bg-[#0c1020] border border-[#131c2e] rounded-lg p-8">
          <div className="w-16 h-16 bg-[#00ffaa]/15 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-[#00ffaa]" />
          </div>

          <h1 className="text-2xl font-bold text-white mb-2">
            Welcome to White 80!
          </h1>
          <p className="text-[#3d4f6b] mb-6">
            Your 7-day free trial has started. Let&apos;s get you set up.
          </p>

          <div className="bg-[#090c14] border border-[#131c2e] rounded p-4 mb-6">
            <p className="text-sm text-[#d6dff0] mb-2">
              Next step: Connect your API keys
            </p>
            <p className="text-xs text-[#3d4f6b]">
              You&apos;ll need Polygon (free) and Anthropic keys to power the platform.
            </p>
          </div>

          <Link
            href={`/onboarding?session_id=${sessionId}`}
            className="block w-full bg-[#00e5ff] hover:bg-[#00e5ff]/90 text-[#060a10] font-mono text-sm tracking-wider py-3 rounded transition-colors mb-3"
          >
            CONTINUE TO SETUP
          </Link>

          <p className="text-xs text-[#3d4f6b]">
            Auto-redirecting in {countdown}s...
          </p>
        </div>

        <p className="text-xs text-[#3d4f6b] mt-6">
          Questions? Contact support@white80.io
        </p>
      </div>
    </div>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ background: "radial-gradient(ellipse at top, #151e30, #05070e 70%)" }}
      >
        <div className="w-8 h-8 border-2 border-[#00e5ff] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}
