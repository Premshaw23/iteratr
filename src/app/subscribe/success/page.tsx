import { Suspense } from 'react'
import SubscribeSuccessClient from './success-client'

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
          <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin mb-6" />
          <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-xs">
            Verifying Technical Quota Upgrade...
          </p>
        </div>
      }
    >
      <SubscribeSuccessClient />
    </Suspense>
  )
}
