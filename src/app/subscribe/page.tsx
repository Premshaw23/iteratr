'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Check, Sparkles, Zap, Shield, ArrowLeft, ChevronLeft, X, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function SubscribePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleUpgrade = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/checkout/session', { method: 'POST' })
      const { url } = await res.json()
      if (url) window.location.href = url
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-brand selection:text-white relative overflow-hidden font-sans">
      {/* ── BACKGROUND ─────────────────────────────────── */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-brand/20 blur-[120px] rounded-full animate-pulse-slow" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-purple-600/10 blur-[140px] rounded-full animate-float" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-12 lg:py-24">
        
        {/* ── HEADER ─────────────────────────────────────── */}
        <div className="flex flex-col items-center text-center mb-16 lg:mb-24">
          <button 
            onClick={() => router.push('/dashboard')}
            className="group mb-8 flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-premium"
          >
            <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </button>
          
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand/10 border border-brand/20 rounded-full text-brand text-[10px] font-black uppercase tracking-[0.3em] mb-6">
             <Zap size={12} className="fill-brand" />
             Adaptive Compute Tier
          </div>
          
          <h1 className="text-5xl lg:text-7xl font-black mb-6 tracking-tighter bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent italic">
            Optimize your technical career.
          </h1>
          <p className="text-slate-400 max-w-2xl text-lg lg:text-xl font-medium leading-relaxed">
            Switch to high-intensity evaluation cycles and senior-grade feedback. 
            Designed for engineers targeting tier-1 tech products.
          </p>
        </div>

        {/* ── PRICING CARDS ──────────────────────────────── */}
        <div className="grid lg:grid-cols-2 gap-8 items-stretch max-w-5xl mx-auto">
          
          {/* STANDARD TIER */}
          <div className="group relative p-8 lg:p-12 rounded-[2.5rem] bg-white/[0.02] border border-white/5 flex flex-col backdrop-blur-md hover:bg-white/[0.04] transition-premium">
            <div className="mb-0.5">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Tier 01</span>
              <h3 className="text-2xl font-black mt-2 mb-8">Standard Agent</h3>
            </div>
            
            <div className="flex-1">
              <ul className="space-y-5 mb-12">
                {[
                  { label: '150 Questions / Day', active: true },
                  { label: 'Basic Topic Radar', active: true },
                  { label: 'Shared Compute Engine', active: true },
                  { label: 'Public Profile', active: true },
                  { label: 'Senior Grade Feedback', active: false },
                  { label: 'Unlimited Interviews', active: false },
                ].map((f, i) => (
                  <li key={i} className={`flex items-center gap-3 text-sm font-bold ${f.active ? 'text-slate-300' : 'text-slate-600'}`}>
                    {f.active ? (
                      <div className="p-1 bg-white/10 rounded-md"><Check size={12} className="text-slate-400" /></div>
                    ) : (
                      <div className="p-1 bg-white/5 rounded-md"><X size={12} className="text-slate-700" /></div>
                    )}
                    {f.label}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-auto">
              <div className="flex items-baseline gap-2 mb-8">
                <span className="text-4xl font-black">$0</span>
                <span className="text-slate-500 text-sm font-bold uppercase tracking-widest">/ Freemium</span>
              </div>
              <button disabled className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-slate-500 text-xs font-black uppercase tracking-widest cursor-not-allowed">
                Default Active
              </button>
            </div>
          </div>

          {/* PRO TIER */}
          <div className="group relative p-8 lg:p-12 rounded-[2.5rem] bg-slate-900 border-2 border-brand/50 flex flex-col shadow-[0_0_80px_-20px_rgba(59,130,246,0.3)] overflow-hidden hover:scale-[1.02] transition-premium active:scale-100">
             {/* Animated Border/Glow */}
             <div className="absolute -top-24 -right-24 w-64 h-64 bg-brand/20 blur-[80px] rounded-full animate-pulse" />
             <div className="absolute top-0 right-0 px-8 py-2 bg-brand text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-bl-3xl shadow-xl z-20">
               Highly Recommended
             </div>

            <div className="relative z-10 mb-0.5">
              <span className="text-[10px] font-black text-brand uppercase tracking-[0.3em]">Tier 02</span>
              <h3 className="text-2xl font-black mt-2 mb-8 flex items-center gap-3">
                Iteratr Pro <Sparkles size={20} className="text-brand fill-brand" />
              </h3>
            </div>
            
            <div className="relative z-10 flex-1">
              <ul className="space-y-5 mb-12">
                {[
                  { label: '1,000 High-Compute Cycles / Day', active: true },
                  { label: 'Advanced Adaptive Radar', active: true },
                  { label: 'Priority AI Deduction Engine', active: true },
                  { label: 'Senior Grade Code Reflection', active: true },
                  { label: 'Unlimited Real-time Mock Interviews', active: true },
                  { label: 'Pro Verification Badge', active: true },
                ].map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm font-black text-white">
                    <div className="p-1 bg-brand rounded-md shadow-lg shadow-brand/20">
                      <Check size={12} className="text-white" />
                    </div>
                    {f.label}
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative z-10 mt-auto">
              <div className="flex items-baseline gap-2 mb-8">
                <span className="text-5xl font-black text-white">$0</span>
                <span className="text-slate-500 text-sm font-bold line-through ml-2">$19</span>
                <span className="bg-brand/20 text-brand text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest animate-pulse ml-4 border border-brand/20">
                  Lifetime Alpha Early Access 
                </span>
              </div>
              <button 
                onClick={handleUpgrade}
                disabled={loading || success}
                className={`group relative w-full py-5 rounded-2xl bg-brand text-white text-sm font-black uppercase tracking-[0.2em] shadow-2xl shadow-brand/40 overflow-hidden transition-premium active:scale-95 ${loading || success ? 'opacity-50 cursor-wait' : 'hover:bg-brand-dark'}`}
              >
                <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {success ? 'Portfolio Upgraded' : loading ? 'Redirecting to Secure Payment...' : 'Begin Secure Upgrade'}
                  <ArrowRight size={16} />
                </span>
              </button>
            </div>
          </div>

        </div>

        {/* ── FOOTER TRUST ──────────────────────────────── */}
        <div className="mt-24 lg:mt-32 pt-12 border-t border-white/5 flex flex-col lg:flex-row items-center justify-between gap-12 text-center lg:text-left">
          <div className="flex flex-col gap-2">
            <h4 className="text-lg font-black italic tracking-tighter">iteratr.</h4>
            <p className="text-sm text-slate-500 font-medium italic">High-performance technical auditioning.</p>
          </div>
          
          <div className="flex flex-col items-center lg:items-end gap-4">
             <div className="flex items-center gap-2 text-slate-400 mb-2">
                <Shield size={18} className="text-brand" />
                <span className="text-[10px] font-black uppercase tracking-widest">Bank-Grade 256-bit Encryption</span>
             </div>
             <div className="flex gap-6 items-center opacity-30 invert hover:opacity-100 transition-opacity">
               <Image
                 src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg"
                 alt="Stripe"
                 width={88}
                 height={24}
                 className="h-6 w-auto"
                 unoptimized
               />
                <span className="font-bold text-xl">VISA</span>
                <span className="font-bold text-xl">MasterCard</span>
                <span className="font-bold text-xl">Apple Pay</span>
             </div>
          </div>
        </div>

      </div>
    </div>
  )
}
