'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CheckCircle2, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react'
import Link from 'next/link'

export default function SubscribeSuccessClient() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const sessionId = searchParams.get('session_id')
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')

  useEffect(() => {
    async function verifySession() {
      if (!sessionId) {
        setStatus('error')
        return
      }

      try {
        const res = await fetch(`/api/checkout/verify?session_id=${sessionId}`)
        setStatus(res.ok ? 'success' : 'error')
      } catch {
        setStatus('error')
      }
    }

    verifySession()
  }, [sessionId])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin mb-6" />
        <p className="text-mid font-bold uppercase tracking-[0.2em] text-xs">
          Verifying Technical Quota Upgrade...
        </p>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mb-6">
          <ShieldCheck size={32} />
        </div>
        <h1 className="text-2xl font-black text-dark mb-2">Verification Pending</h1>
        <p className="text-mid max-w-sm mb-8">
          The payment engine is still finalizing your session. Your Pro status will be activated once the network confirms
          fulfillment.
        </p>
        <Link
          href="/dashboard"
          className="px-8 py-3 bg-brand text-white font-black rounded-xl text-sm transition active:scale-95 hover:bg-brand-dark"
        >
          Return to Dashboard
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Glow effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center text-center animate-in zoom-in-95 duration-700">
        <div className="w-20 h-20 bg-brand text-white rounded-[28px] flex items-center justify-center mb-8 shadow-2xl shadow-brand/40 ring-8 ring-brand/5">
          <Sparkles size={40} className="animate-pulse" />
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-100 border border-emerald-200 rounded-full text-emerald-700 text-[10px] font-black uppercase tracking-[0.2em] mb-4">
          <CheckCircle2 size={12} /> Transaction Secured
        </div>

        <h1 className="text-4xl font-black text-dark tracking-tighter mb-4">Technical Elevation Complete</h1>
        <p className="text-mid max-w-md text-lg font-medium leading-relaxed mb-12">
          Your account has been upgraded to the Pro Tier. Unlimited cycles and high-fidelity interviews are now active on your
          workspace.
        </p>

        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-3 px-10 py-4 bg-brand text-white font-black rounded-2xl text-sm transition-all shadow-xl shadow-brand/20 hover:bg-brand-dark active:scale-95 group"
        >
          Initialize Pro Workspace
          <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  )
}

