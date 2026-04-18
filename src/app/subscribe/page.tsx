'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Check, Sparkles, Zap, Shield, ChevronLeft, X, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import Button from '@/components/Button'
import Card from '@/components/Card'

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
    <div className="min-h-screen bg-white text-slate-900 selection:bg-blue-100 relative overflow-hidden font-sans">
      {/* Background Gradients */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-400/5 blur-[140px] rounded-full animate-pulse-slow" />
        <div className="absolute bottom-0 right-1/4 w-[700px] h-[700px] bg-purple-400/5 blur-[160px] rounded-full animate-float" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-16 lg:py-24">

        {/* Header */}
        <div className="flex flex-col items-center text-center mb-20">
          <button
            onClick={() => router.push('/dashboard')}
            className="group mb-8 flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-full text-xs font-bold text-slate-700 hover:border-slate-400 hover:bg-slate-50 transition"
          >
            <ChevronLeft size={14} />
            Back to Dashboard
          </button>

          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-full text-blue-600 text-xs font-bold uppercase tracking-wider mb-8">
            <Zap size={13} className="fill-blue-600" />
            Pro Tier
          </div>

          <h1 className="text-5xl lg:text-6xl font-bold mb-6 tracking-tight text-slate-900">
            Upgrade to Pro
          </h1>
          <p className="text-slate-600 max-w-2xl text-lg leading-relaxed mb-2">
            Unlock unlimited questions, priority AI feedback, and unlimited mock interviews.
          </p>
          <p className="text-slate-500 text-sm">
            Limited-time alpha offer: Get Pro for free
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">

          {/* Standard Tier */}
          <Card>
            <div className="mb-2">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Tier 01</span>
              <h3 className="text-2xl font-bold mt-2 mb-8 text-slate-900">Free</h3>
            </div>

            <div className="flex-1 mb-8">
              <ul className="space-y-4">
                {[
                  { label: '5 questions / day', active: true },
                  { label: 'Basic hints', active: true },
                  { label: 'Topic tracking', active: true },
                  { label: 'Public profile', active: true },
                  { label: 'Unlimited interviews', active: false },
                  { label: 'Priority feedback', active: false },
                ].map((f, i) => (
                  <li key={i} className={`flex items-center gap-3 text-sm font-medium ${f.active ? 'text-slate-700' : 'text-slate-500'}`}>
                    {f.active ? (
                      <div className="p-1 bg-blue-100 rounded"><Check size={14} className="text-blue-600" /></div>
                    ) : (
                      <div className="p-1 bg-slate-100 rounded"><X size={14} className="text-slate-400" /></div>
                    )}
                    {f.label}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <div className="text-3xl font-bold text-slate-900 mb-6">$0</div>
              <Button disabled variant="secondary" size="lg" className="w-full">
                Current Plan
              </Button>
            </div>
          </Card>

          {/* Pro Tier - Featured */}
          <div className="relative group">
            <Card variant="elevated">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-4 py-1 rounded-full z-10">
                Most Popular
              </div>

              <div className="mb-2 pt-4">
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Tier 02</span>
                <h3 className="text-2xl font-bold mt-2 mb-8 text-slate-900 flex items-center gap-2">
                  iteratr Pro
                  <Sparkles size={20} className="text-blue-600" />
                </h3>
              </div>

              <div className="flex-1 mb-8">
                <ul className="space-y-4">
                  {[
                    { label: 'Unlimited questions / day', active: true },
                    { label: 'Advanced AI hints', active: true },
                    { label: 'Unlimited interviews', active: true },
                    { label: 'Priority feedback', active: true },
                    { label: 'Weak zone recovery', active: true },
                    { label: 'Interview Ready badge', active: true },
                  ].map((f, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm font-medium text-slate-700">
                      <div className="p-1 bg-blue-100 rounded"><Check size={14} className="text-blue-600" /></div>
                      {f.label}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border-t border-slate-200 pt-6">
                <div className="mb-6 flex items-baseline gap-3">
                  <span className="text-4xl font-bold text-slate-900">$0</span>
                  <span className="text-lg text-slate-600 line-through">$19</span>
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                    Alpha Offer
                  </span>
                </div>
                <Button
                  onClick={handleUpgrade}
                  disabled={loading || success}
                  isLoading={loading}
                  variant="primary"
                  size="lg"
                  className="w-full"
                >
                  {success ? 'Upgraded!' : 'Upgrade to Pro'}
                </Button>
              </div>
            </Card>
          </div>

        </div>

        {/* Trust Footer */}
        <div className="mt-24 pt-12 border-t border-slate-200 flex flex-col lg:flex-row items-center justify-between gap-12">
          <div>
            <h4 className="text-xl font-bold text-slate-900 mb-1">iteratr</h4>
            <p className="text-sm text-slate-600">Master technical interviews with AI</p>
          </div>

          <div className="flex flex-col items-center lg:items-end gap-4">
            <div className="flex items-center gap-2 text-slate-700">
              <Shield size={18} className="text-blue-600" />
              <span className="text-xs font-bold uppercase">Secure Payments by Stripe</span>
            </div>
            <div className="flex gap-6 items-center text-slate-500">
              <span className="text-sm font-bold">VISA</span>
              <span className="text-sm font-bold">MasterCard</span>
              <span className="text-sm font-bold">Apple Pay</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
