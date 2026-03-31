'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import MasteryRadar from '@/app/dashboard/mastery-radar'
import EloChart from '@/app/dashboard/elo-chart'
import { Trophy, Zap, Share2, ArrowRight, UserCheck2, ChevronDown, Calendar, Star } from 'lucide-react'

// --- Types ---
interface ProfileData {
  user: {
    id:              string
    display_name:    string
    avatar_url:      string
    elo_rating:      number
    streak_count:    number
    reflection:      string
    unlocked_badges: string[]
  }
  stats:   any[]
  history: any[]
  metrics?: {
    total_attempts:    number
    solved_count:      number
    fail_count:        number
    accuracy_percent:  number
    weak_zone_count:   number
  }
}

export default function PublicProfilePage() {
  const params = useParams()
  const router = useRouter()
   // Preserve the actual route segment; server handles decoding/lookup.
   const username = (params.username as string) ?? ''
  const [data, setData]       = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied]   = useState(false)
  const [error, setError]     = useState<'not_found' | 'private' | null>(null)

   useEffect(() => {
      async function fetchProfile() {
         try {
            setError(null)
            const res = await fetch(`/api/u/${username}`)
            const json = await res.json()

            if (res.status === 404) {
              setError('not_found')
              setData(null)
              return
            }

            if (res.status === 403) {
              setError('private')
              setData(json)
              return
            }

            if (!res.ok) {
              setError('not_found')
              setData(null)
              return
            }

            setData(json)
         } catch (err) {
            console.error(err)
            setError('not_found')
            setData(null)
         } finally {
            setLoading(false)
         }
      }
      fetchProfile()
   }, [username])

   // Shareable link always uses the enforced username
   const copyLink = () => {
      const shareUrl = `${window.location.origin}/u/${username}`
      navigator.clipboard.writeText(shareUrl)
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
          <h1 className="text-4xl font-black text-white mb-2">
            {error === 'not_found' ? '404' : 'Profile Unavailable'}
          </h1>
          <p className="text-slate-500 mb-8">
            {error === 'not_found'
              ? 'This programmer hasn&apos;t created an Iteratr profile yet.'
              : 'This Iteratr profile is currently private.'}
          </p>
          <button onClick={() => router.push('/dashboard')} className="px-6 py-2 bg-brand text-white font-bold rounded-lg">
             Go Home
          </button>
       </div>
    )
  }

   const { user, stats, history, metrics } = data
   // Defensive: ensure unlocked_badges is always an array
   user.unlocked_badges = Array.isArray(user.unlocked_badges) ? user.unlocked_badges : []

   const totalAttempts = metrics?.total_attempts ?? stats.reduce((acc: number, s: any) => acc + (s.solved_count ?? 0) + (s.fail_count ?? 0), 0)
   const solvedCount   = metrics?.solved_count ?? stats.reduce((acc: number, s: any) => acc + (s.solved_count ?? 0), 0)
   const accuracyPct   = metrics?.accuracy_percent ?? (totalAttempts === 0 ? 0 : Math.round((solvedCount / totalAttempts) * 100))
   const weakZoneCount = metrics?.weak_zone_count ?? stats.filter((s: any) => s.is_weak_zone).length

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-brand selection:text-white pb-20">
      
      {/* 🧬 Header / Bio Section */}
      <div className="relative pt-24 pb-16 px-6 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[400px] bg-gradient-to-b from-brand/10 to-transparent blur-3xl rounded-full opacity-30 pointer-events-none" />
        
        <div className="max-w-6xl mx-auto relative z-10 flex flex-col items-center text-center">
          
          <div className="relative mb-6">
             <div className="absolute inset-0 bg-brand/50 blur-2xl opacity-20" />
             <div className={`relative w-32 h-32 rounded-3xl border-4 ${user.unlocked_badges.includes('interview_ready') ? 'border-brand shadow-[0_0_50px_-10px_rgba(45,78,245,0.5)]' : 'border-white/5'} bg-slate-900 shadow-2xl z-10 overflow-hidden transition-all duration-700`}>
               <Image 
                src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.display_name}`} 
                alt={user.display_name}
                width={128}
                height={128}
                unoptimized
                className="w-full h-full object-cover"
              />
             </div>
            {user.streak_count >= 5 && (
               <div className="absolute -bottom-2 -right-2 bg-orange-500 text-white p-2 rounded-xl shadow-lg shadow-orange-500/30 z-20 border-2 border-slate-950">
                  <Zap className="w-5 h-5 fill-current" />
               </div>
            )}
          </div>

          <h1 className="text-4xl font-black text-white tracking-tighter mb-2 underline decoration-brand/30 underline-offset-8 decoration-4">{user.display_name}</h1>
          <div className="flex items-center gap-2 mb-4 px-4 py-1.5 bg-white/5 rounded-full border border-white/5 text-sm font-bold text-slate-400">
             <Star className="w-4 h-4 text-brand fill-current" />
             Developer Portfolio · {user.elo_rating} Elo
          </div>

          {/* Badges Display */}
          <div className="flex gap-2 mb-8">
             {user.unlocked_badges.map(b => (
                <div key={b} className="px-3 py-1 bg-brand/10 text-brand text-[10px] font-black uppercase tracking-[0.2em] rounded-lg border border-brand/20 flex items-center gap-2 shadow-sm shadow-brand/10">
                   <Trophy size={10} />
                   {b.replace('_', ' ')}
                </div>
             ))}
             {user.unlocked_badges.length === 0 && (
                <div className="px-3 py-1 bg-white/5 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] rounded-lg border border-white/5">
                   No specific badges yet
                </div>
             )}
          </div>

          <p className="max-w-2xl text-lg text-slate-400 leading-relaxed font-medium italic">
            &quot;{user.reflection || 'The adaptive codebase reveals my true strengths.'}&quot;
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

      {/* KPI Strip */}
      <div className="max-w-6xl mx-auto px-6 -mt-10 mb-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Elo Rating', value: user.elo_rating.toLocaleString(), sub: 'technical index' },
            { label: 'Current Streak', value: `${user.streak_count}d`, sub: 'consecutive training' },
            { label: 'Questions Solved', value: solvedCount.toLocaleString(), sub: 'lifetime' },
            { label: 'Global Accuracy', value: `${accuracyPct}%`, sub: `${totalAttempts.toLocaleString()} attempts` },
          ].map(card => (
            <div
              key={card.label}
              className="bg-slate-900/70 border border-white/5 rounded-2xl px-4 py-3 md:px-5 md:py-4 flex flex-col gap-1 backdrop-blur-xl"
            >
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.25em]">{card.label}</p>
              <p className="text-xl md:text-2xl font-black text-white tracking-tight tabular-nums">{card.value}</p>
              <p className="text-[11px] text-slate-500 font-medium uppercase tracking-tight">{card.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 📊 Competitive Stats Grid */}
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Radar & Summary */}
        <div className="space-y-8">
           <div className="bg-slate-900/50 border border-white/5 p-8 rounded-[32px] backdrop-blur-xl group hover:border-brand/20 transition-colors">
             <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-brand/10 rounded-lg group-hover:scale-110 transition-transform">
                   <Trophy className="w-5 h-5 text-brand" />
                </div>
                <h2 className="text-xl font-bold text-white tracking-tight">Technical Mastery</h2>
             </div>
             <div className="h-[350px]">
                <MasteryRadar stats={stats} />
             </div>
           </div>

           <div className="grid grid-cols-2 gap-6">
              <div className="bg-slate-900/50 border border-white/5 p-6 rounded-3xl group">
                 <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Peak Rating</p>
                 <p className="text-3xl font-black text-white mb-2 group-hover:text-brand transition">{user.elo_rating}</p>
                 <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-brand" style={{ width: `${Math.min(100, (user.elo_rating / 2500) * 100)}%` }} />
                 </div>
              </div>
              <div className="bg-slate-900/50 border border-white/5 p-6 rounded-3xl group">
                 <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Current Streak</p>
                 <p className="text-3xl font-black text-orange-500 mb-2 group-hover:scale-105 transition-transform origin-left">{user.streak_count} Days</p>
                 <div className="flex gap-1">
                    {[1,2,3,4,5].map(i => (
                       <Zap key={i} className={`w-3 h-3 ${i <= user.streak_count ? 'text-orange-500 fill-current' : 'text-slate-800'}`} />
                    ))}
                 </div>
              </div>
           </div>
        </div>

        {/* Elo Trend chart */}
        <div className="bg-slate-900/50 border border-white/5 p-8 rounded-[32px] backdrop-blur-xl flex flex-col h-full hover:border-brand/20 transition-colors group">
           <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                 <Calendar className="w-5 h-5 text-purple-500" />
              </div>
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
