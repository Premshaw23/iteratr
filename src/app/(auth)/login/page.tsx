'use client'

import Link from 'next/link'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Button from '@/components/Button'
import Spinner from '@/components/Spinner'

export default function LoginPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState<'google' | 'github' | null>(null)

  useEffect(() => {
    if (session) router.push('/dashboard')
  }, [session, router])

  if (status === 'loading') return null

  const handleSignIn = async (provider: 'google' | 'github') => {
    setLoading(provider)
    await signIn(provider, { callbackUrl: '/dashboard' })
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Top bar with home button */}
        <div className="mb-8 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-100 transition"
          >
            <span className="text-xs">←</span>
            Home
          </Link>
          <span className="uppercase tracking-widest text-[10px] font-semibold text-slate-500">
            iteratr login
          </span>
        </div>

        {/* Logo / headline */}
        <div className="mb-10 text-left">
          <h1 className="text-5xl font-bold tracking-tight">
            <span className="text-slate-900">iter</span>
            <span className="text-blue-600">atr</span>
          </h1>
          <p className="mt-3 text-xs font-semibold uppercase tracking-widest text-slate-600">
            Adaptive technical mentor
          </p>
        </div>

        {/* Card */}
        <div className="card shadow-lg p-8 mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Sign in to continue</h2>
          <p className="text-sm text-slate-600 mb-8">
            Your Elo rating, weak zones, and mock interviews are all tied to this account.
          </p>

          {/* Google */}
          <Button
            onClick={() => handleSignIn('google')}
            disabled={loading !== null}
            variant="secondary"
            size="md"
            className="w-full mb-3 justify-center"
          >
            {loading === 'google' ? <Spinner size="sm" /> : <GoogleIcon />}
            Continue with Google
          </Button>

          {/* GitHub */}
          <Button
            onClick={() => handleSignIn('github')}
            disabled={loading !== null}
            variant="secondary"
            size="md"
            className="w-full justify-center"
          >
            {loading === 'github' ? <Spinner size="sm" /> : <GitHubIcon />}
            Continue with GitHub
          </Button>

          {/* Divider */}
          <div className="mt-8 pt-6 border-t border-slate-200 text-center text-xs text-slate-500">
            No password needed. One click and you&apos;re in.
          </div>
        </div>

        {/* Feature hints */}
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            { icon: '⚡', label: 'Elo tracking' },
            { icon: '🧠', label: 'Socratic hints' },
            { icon: '🎯', label: 'Mock interviews' },
          ].map((f) => (
            <div
              key={f.label}
              className="rounded-md border border-slate-200 bg-slate-50 px-2 py-4"
            >
              <div className="mb-2 text-xl">{f.icon}</div>
              <div className="font-medium text-xs uppercase tracking-wider text-slate-700">
                {f.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
      <path fill="#FBBC05" d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z"/>
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"/>
    </svg>
  )
}

function GitHubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
    </svg>
  )
}
