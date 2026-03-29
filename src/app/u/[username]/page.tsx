'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import MasteryRadar from '@/app/dashboard/mastery-radar'
import EloChart from '@/app/dashboard/elo-chart'
import { Trophy, Zap, Share2, ArrowRight, UserCheck2, ChevronDown, Calendar, Star } from 'lucide-react'

// --- Types ---
interface ProfileData {
  user: {
    id:           string
    display_name: string
    avatar_url:   string
    elo_rating:   number
    streak_count: number
    reflection:   string
  }
  stats:   any[]
  history: any[]
}

export default function PublicProfilePage() {
  const params = useParams()
  const router = useRouter()
  const username = params.username as string
  const [data, setData]       = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied]   = useState(false)

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch(`/api/u/${username}`)
        if (!res.ok) throw new Error('Not found')
        const json = await res.json()
        setData(json)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [username])

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-slate-500 font-medium">
         <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-brand border-t-transparent rounded-full animate-spin" />
            Loading portfolio...
         </div>
      </div>
    )
  }

  if (!data) {
    return (
       <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
          <h1 className="text-4xl font-black text-white mb-2">404</h1>
          <p className="text-slate-500 mb-8">This programmer hasn't created a public Iteratr profile yet.</p>
          <button onClick={() => router.push('/dashboard')} className="px-6 py-2 bg-brand text-white font-bold rounded-lg">
             Go Home
          </button>
       </div>
    )
  }

  const { user, stats, history } = data

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-brand selection:text-white pb-20">
      
      {/* 🧬 Header / Bio Section */}
      <div className="relative pt-24 pb-16 px-6 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[400px] bg-gradient-to-b from-brand/10 to-transparent blur-3xl rounded-full opacity-30 pointer-events-none" />
        
        <div className="max-w-6xl mx-auto relative z-10 flex flex-col items-center text-center">
          
          <div className="relative mb-6">
             <div className="absolute inset-0 bg-brand/50 blur-2xl opacity-20" />
             <img 
              src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.display_name}`} 
              alt={user.display_name}
              className="w-32 h-32 rounded-3xl border-4 border-white/5 bg-slate-900 shadow-2xl relative z-10"
            />
            {user.streak_count >= 5 && (
               <div className="absolute -bottom-2 -right-2 bg-orange-500 text-white p-2 rounded-xl shadow-lg shadow-orange-500/30 z-20 border-2 border-slate-950">
                  <Zap className="w-5 h-5 fill-current" />
               </div>
            )}
          </div>

          <h1 className="text-4xl font-black text-white tracking-tighter mb-2">{user.display_name}</h1>
          <div className="flex items-center gap-2 mb-8 px-4 py-1.5 bg-white/5 rounded-full border border-white/5 text-sm font-bold text-slate-400">
             <Star className="w-4 h-4 text-brand fill-current" />
             Developer Portfolio · {user.elo_rating} Elo
          </div>

          <p className="max-w-2xl text-lg text-slate-400 leading-relaxed font-medium italic">
            "{user.reflection || 'The adaptive codebase reveals my true strengths.'}"
          </p>

          <div className="flex gap-4 mt-10">
             <button 
                onClick={copyLink}
                className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-sm font-bold transition"
             >
                <Share2 className="w-4 h-4" />
                {copied ? 'Link Copied!' : 'Share Portfolio'}
             </button>
             <button
                onClick={() => router.push('/login')}
                className="flex items-center gap-2 px-6 py-3 bg-brand text-white rounded-2xl text-sm font-black shadow-lg shadow-brand/20 hover:scale-[1.02] transition active:scale-95"
             >
                Start Training
                <ArrowRight className="w-4 h-4" />
             </button>
          </div>
        </div>
      </div>

      {/* 📊 Competitive Stats Grid */}
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Radar & Summary */}
        <div className="space-y-8">
           <div className="bg-slate-900/50 border border-white/5 p-8 rounded-[32px] backdrop-blur-xl">
             <div className="flex items-center gap-3 mb-8">
                <Trophy className="w-5 h-5 text-brand" />
                <h2 className="text-xl font-bold text-white tracking-tight">Technical Mastery</h2>
             </div>
             <div className="h-[350px]">
                <MasteryRadar stats={stats} />
             </div>
           </div>

           <div className="grid grid-cols-2 gap-6">
              <div className="bg-slate-900/50 border border-white/5 p-6 rounded-3xl">
                 <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Peak Rating</p>
                 <p className="text-3xl font-black text-white mb-2">{user.elo_rating}</p>
                 <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-brand" style={{ width: `${Math.min(100, (user.elo_rating / 2500) * 100)}%` }} />
                 </div>
              </div>
              <div className="bg-slate-900/50 border border-white/5 p-6 rounded-3xl">
                 <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Current Streak</p>
                 <p className="text-3xl font-black text-orange-500 mb-2">{user.streak_count} Days</p>
                 <div className="flex gap-1">
                    {[1,2,3,4,5].map(i => (
                       <Zap key={i} className={`w-3 h-3 ${i <= user.streak_count ? 'text-orange-500 fill-current' : 'text-slate-800'}`} />
                    ))}
                 </div>
              </div>
           </div>
        </div>

        {/* Elo Trend chart */}
        <div className="bg-slate-900/50 border border-white/5 p-8 rounded-[32px] backdrop-blur-xl flex flex-col h-full">
           <div className="flex items-center gap-3 mb-8">
              <Calendar className="w-5 h-5 text-purple-500" />
              <h2 className="text-xl font-bold text-white tracking-tight">Growth Velocity</h2>
           </div>
           <div className="flex-1 min-h-[400px]">
              <EloChart history={history} />
           </div>
        </div>

      </div>

      {/* 🏷️ Badge Section / Footer-ish */}
      <div className="max-w-6xl mx-auto px-6 mt-16 text-center">
         <div className="h-px w-full bg-gradient-to-r from-transparent via-white/5 to-transparent mb-12" />
         <p className="text-xs font-black text-slate-600 uppercase tracking-[0.3em] mb-4">Competency Verified By</p>
         <div className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl grayscale hover:grayscale-0 transition cursor-default">
            <span className="text-lg font-black text-white tracking-tighter">iteratr</span>
            <span className="text-xs font-bold text-slate-500">Adaptive AI Engine</span>
         </div>
      </div>

    </div>
  )
}
