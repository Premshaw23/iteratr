'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Trophy, Zap, Crown, ArrowUpRight, TrendingUp, Search, UserCheck2, ChevronRight, LayoutGrid, List } from 'lucide-react'

interface UserRank {
  id:           string
  display_name: string
  avatar_url:   string
  elo_rating:   number
  streak_count: number
}

export default function LeaderboardPage() {
  const [users, setUsers]   = useState<UserRank[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const res = await fetch('/api/leaderboard')
        const data = await res.json()
        setUsers(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchLeaderboard()
  }, [])

  const getRankStyle = (index: number) => {
    if (index === 0) return 'border-amber-400/30 bg-amber-400/5 text-amber-500 hover:bg-amber-400/10'
    if (index === 1) return 'border-slate-300/30 bg-slate-300/5 text-slate-300 hover:bg-slate-300/10'
    if (index === 2) return 'border-orange-400/30 bg-orange-400/5 text-orange-500 hover:bg-orange-400/10'
    return 'border-white/5 bg-slate-900/40 text-slate-400 hover:white/10 hover:border-white/10'
  }

  const getRankIcon = (index: number) => {
    if (index === 0) return <Crown className="w-5 h-5 fill-current" />
    if (index === 1) return <Trophy className="w-5 h-5" />
    if (index === 2) return <Trophy className="w-5 h-5" />
    return <span className="text-xs font-black">#{index + 1}</span>
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-brand selection:text-white pb-20">
      
      {/* 🚀 Header Section */}
      <div className="pt-24 pb-12 px-6">
        <div className="max-w-5xl mx-auto flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand/10 border border-brand/20 rounded-full text-xs font-black text-brand uppercase tracking-widest mb-6">
             <Trophy className="w-3.5 h-3.5" />
             Global Skill Ranking
          </div>
          <h1 className="text-5xl font-black text-white tracking-tighter mb-4">Elite Graph of Engineers</h1>
          <p className="max-w-xl text-slate-400 text-lg font-medium leading-relaxed">
            The world&apos;s highest-rated technical problem solvers. Compete, grow, and join the elite.
          </p>
        </div>
      </div>

      {/* 🏆 Leaderboard Container */}
      <div className="max-w-4xl mx-auto px-6">
        
        {loading ? (
          <div className="space-y-3 py-10 animate-pulse">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="h-20 bg-slate-900/50 border border-white/5 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="space-y-3 relative">
            
            {/* Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[300px] bg-brand/5 blur-3xl rounded-full -z-10" />

            {users.map((user, i) => (
              <div 
                key={user.id}
                onClick={() => router.push(`/u/${user.id}`)}
                className={`group relative flex items-center gap-4 p-5 rounded-3xl border transition-all cursor-pointer ${getRankStyle(i)}`}
              >
                {/* Rank Number / Icon */}
                <div className="w-10 h-10 flex items-center justify-center shrink-0">
                   {getRankIcon(i)}
                </div>

                {/* Avatar */}
                <div className="w-12 h-12 rounded-2xl border border-white/10 bg-slate-800 shrink-0 overflow-hidden relative">
                  <Image 
                    src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.display_name}`} 
                    alt={user.display_name}
                    width={48}
                    height={48}
                    unoptimized
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Name & Elo */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-white truncate group-hover:text-brand transition">{user.display_name}</h3>
                  <div className="flex items-center gap-3">
                     <span className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-none">Developer</span>
                     <div className="h-1 w-1 bg-slate-700 rounded-full" />
                     <div className="flex items-center gap-1 text-orange-500">
                        <Zap className="w-3 h-3 fill-current" />
                        <span className="text-[10px] font-black uppercase">{user.streak_count} Day Streak</span>
                     </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="text-right flex items-center gap-6 pr-4">
                   <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Skill Rating</p>
                      <p className="text-xl font-black text-white">{user.elo_rating}</p>
                   </div>
                   <div className="opacity-0 group-hover:opacity-100 transition translate-x-3 group-hover:translate-x-0">
                      <ChevronRight className="w-5 h-5 text-brand" />
                   </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* 📥 Registration / CTA */}
      <div className="max-w-4xl mx-auto px-6 mt-16 text-center">
         <div className="bg-slate-900 border border-white/5 p-12 rounded-[40px] relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand/5 blur-3xl rounded-full -z-5 group-hover:scale-110 transition duration-1000" />
            
            <h2 className="text-2xl font-black text-white mb-3">Think you&apos;ve got what it takes?</h2>
            <p className="text-slate-500 text-sm mb-8 font-medium">Join 2,400+ engineers solving adaptive problems and testing their grit.</p>
            
            <button 
              onClick={() => router.push('/session/new')}
              className="px-8 py-3 bg-brand text-white font-black rounded-2xl shadow-xl shadow-brand/20 hover:scale-[1.03] transition active:scale-95 text-sm"
            >
               Start Training Now
            </button>
         </div>
      </div>

    </div>
  )
}
