'use client'

import Link from 'next/link'
import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Keep console logging for debugging; UI stays user-friendly.
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen bg-[#08090d] text-white flex items-center justify-center px-6">
      <div className="w-full max-w-2xl">
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
          <span className="h-2 w-2 rounded-full bg-rose-400" />
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-300">
            Runtime_error
          </span>
          {error.digest && (
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
              {error.digest}
            </span>
          )}
        </div>

        <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-[0.95]">
          Something broke.
        </h1>
        <p className="mt-5 text-slate-400 text-base md:text-lg leading-relaxed max-w-xl">
          This page hit an unexpected error. Try again — if it keeps happening, go back home and re-enter the flow.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center rounded-xl bg-white text-slate-950 px-5 py-3 text-sm font-black uppercase tracking-widest hover:bg-slate-200 transition"
          >
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-black uppercase tracking-widest text-white hover:bg-white/10 transition"
          >
            Go home
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-transparent px-5 py-3 text-sm font-bold uppercase tracking-widest text-slate-300 hover:text-white hover:bg-white/5 transition"
          >
            Sign in
          </Link>
        </div>

        <div className="mt-12 border-t border-white/10 pt-6 text-[11px] text-slate-500 uppercase tracking-[0.25em]">
          iteratr · error_boundary
        </div>
      </div>
    </div>
  )
}

