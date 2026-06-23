'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Zap } from 'lucide-react'

interface NavbarProps {
  session: any
  cta: string
}

export default function Navbar({ session, cta }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    // Check initial state in case of page reload/restore
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/80 backdrop-blur-md border-b border-slate-200/50 py-3 shadow-sm'
          : 'bg-transparent border-b border-transparent py-5'
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 no-underline group">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white shadow-sm shadow-blue-500/10 group-hover:scale-105 transition-transform duration-200">
            <Zap size={15} className="fill-current" />
          </div>
          <span className="text-xl font-bold tracking-tight text-blue-600">
            itera<span className="text-slate-900">tr</span>
          </span>
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-8">
          <Link
            href="#features"
            className="text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors"
          >
            Features
          </Link>
          <Link
            href="#how-it-works"
            className="text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors"
          >
            Methodology
          </Link>
          <Link
            href="/leaderboard"
            className="text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors"
          >
            Leaderboard
          </Link>
          <Link
            href="#pricing"
            className="text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors"
          >
            Pricing
          </Link>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-3">
          {!session && (
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-bold text-slate-500 rounded-xl transition-all hover:text-slate-900 hover:bg-slate-100"
            >
              Sign in
            </Link>
          )}
          <Link
            href={cta}
            className="btn-primary px-5 py-2.5 text-sm font-bold inline-flex items-center gap-2 rounded-xl shadow-md shadow-blue-500/10"
          >
            {session ? 'Dashboard' : 'Start free'}
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
              <path
                d="M2 7h10M7 2l5 5-5 5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </div>
      </div>
    </nav>
  )
}
