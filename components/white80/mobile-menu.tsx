"use client"

import { useState, useEffect } from "react"
import { Menu, X, Crosshair, Eye, BarChart3, Briefcase, Settings, Key, CreditCard, Bell, FileText, History, DollarSign, HelpCircle, Mail, Shield, Scale, ChevronRight, Sparkles } from "lucide-react"
import Link from "next/link"

interface MobileMenuProps {
  isLoggedIn?: boolean
  currentPath?: string
}

const MENU_SECTIONS = [
  {
    title: "CORE",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: Crosshair },
      { name: "Scanner", href: "/dashboard?tab=tier1", icon: Eye },
      { name: "Watchlist", href: "/dashboard?tab=watchlist", icon: BarChart3 },
      { name: "Options Flow", href: "/dashboard?tab=signals", icon: Briefcase },
    ],
  },
  {
    title: "ACCOUNT",
    items: [
      { name: "Settings", href: "/dashboard?settings=true", icon: Settings },
      { name: "API Keys", href: "/dashboard?settings=api", icon: Key },
      { name: "Billing", href: "/dashboard?settings=billing", icon: CreditCard },
      { name: "Notifications", href: "/dashboard?settings=notifications", icon: Bell },
    ],
  },
  {
    title: "RESOURCES",
    items: [
      { name: "How It Works", href: "/#features", icon: FileText },
      { name: "Changelog", href: "/changelog", icon: History },
      { name: "Pricing", href: "/pricing", icon: DollarSign },
      { name: "FAQ", href: "/faq", icon: HelpCircle },
      { name: "Contact", href: "/contact", icon: Mail },
      { name: "Privacy Policy", href: "/privacy", icon: Shield },
      { name: "Terms of Service", href: "/terms", icon: Scale },
    ],
  },
]

export function MobileMenu({ isLoggedIn = false, currentPath = "/" }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Close on ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false)
    }
    if (isOpen) {
      document.addEventListener("keydown", handleEsc)
      document.body.style.overflow = "hidden"
    }
    return () => {
      document.removeEventListener("keydown", handleEsc)
      document.body.style.overflow = ""
    }
  }, [isOpen])

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 text-[#3d4f6b] hover:text-white transition-colors"
        aria-label="Open menu"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Side Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-sm bg-[#060a10] border-l border-[#131c2e] z-50 transform transition-transform duration-300 ease-out overflow-y-auto ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#131c2e]">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-[#00e5ff] rounded-full animate-pulse" />
            <span className="font-mono text-sm tracking-wider text-white">WHITE 80</span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 text-[#3d4f6b] hover:text-white transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Menu Sections */}
        <div className="p-4 space-y-6">
          {MENU_SECTIONS.map((section, sectionIndex) => (
            <div key={section.title}>
              <div className="font-mono text-[10px] tracking-[2px] text-[#3d4f6b] mb-3">
                {section.title}
              </div>
              <div className="space-y-1">
                {section.items.map((item, itemIndex) => {
                  const isActive = currentPath === item.href || currentPath.startsWith(item.href.split("?")[0])
                  const Icon = item.icon
                  const delay = (sectionIndex * section.items.length + itemIndex) * 30

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                        isActive
                          ? "bg-[#00e5ff]/10 text-[#00e5ff] border border-[#00e5ff]/30"
                          : "text-[#d6dff0] hover:bg-[#131c2e] hover:text-white"
                      }`}
                      style={{
                        animation: isOpen ? `slideIn 0.3s ease-out ${delay}ms both` : "none",
                      }}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? "text-[#00e5ff]" : "text-[#3d4f6b] group-hover:text-[#00e5ff]"}`} />
                      <span className="font-mono text-sm flex-1">{item.name}</span>
                      <ChevronRight className={`w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity ${isActive ? "opacity-100 text-[#00e5ff]" : "text-[#3d4f6b]"}`} />
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[#131c2e] bg-[#060a10]">
          {!isLoggedIn ? (
            <>
              <Link
                href="/pricing"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center gap-2 w-full bg-[#00e5ff] hover:bg-[#00e5ff]/90 text-[#060a10] font-mono text-sm py-3 rounded-lg transition-colors mb-3"
              >
                <Sparkles className="w-4 h-4" />
                START FREE TRIAL
              </Link>
              <div className="flex gap-3">
                <Link
                  href="/auth/login"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 text-center font-mono text-sm text-[#d6dff0] hover:text-white py-2 transition-colors border border-[#131c2e] rounded-lg"
                >
                  Sign In
                </Link>
                <Link
                  href="/pricing"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 text-center font-mono text-sm text-[#00e5ff] hover:text-[#00e5ff]/80 py-2 transition-colors border border-[#00e5ff]/30 rounded-lg"
                >
                  Sign Up
                </Link>
              </div>
            </>
          ) : (
            <Link
              href="/dashboard"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-center gap-2 w-full bg-[#00e5ff] hover:bg-[#00e5ff]/90 text-[#060a10] font-mono text-sm py-3 rounded-lg transition-colors"
            >
              GO TO DASHBOARD
            </Link>
          )}
        </div>
      </div>

      {/* Keyframes for staggered animation */}
      <style jsx global>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </>
  )
}
