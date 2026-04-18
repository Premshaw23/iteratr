'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Trophy, Zap, Crown, ChevronRight } from 'lucide-react'
import Button from '@/components/Button'

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
    if (index === 0) return 'border-amber-300 bg-amber-50 hover:bg-amber-100'
    if (index === 1) return 'border-slate-300 bg-slate-50 hover:bg-slate-100'
    if (index === 2) return 'border-orange-300 bg-orange-50 hover:bg-orange-100'
    return 'border-slate-200 bg-white hover:bg-slate-50'
  }

  const getRankTextColor = (index: number) => {
    if (index === 0) return 'text-amber-600'
    if (index === 1) return 'text-slate-600'
    if (index === 2) return 'text-orange-600'
    return 'text-slate-600'
  }

  const getRankIcon = (index: number) => {
    if (index === 0) return <Crown className="w-5 h-5 fill-current text-amber-600" />
    if (index === 1) return <Trophy className="w-5 h-5 text-slate-600" />
    if (index === 2) return <Trophy className="w-5 h-5 text-orange-600" />
    return <span className="text-xs font-bold text-slate-600">#{index + 1}</span>
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-20">

      {/* Header Section */}
      <div className="pt-24 pb-12 px-6 border-b border-slate-200">
        <div className="max-w-5xl mx-auto flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-full text-xs font-bold text-blue-600 uppercase tracking-widest mb-8">
            <Trophy className="w-3.5 h-3.5" />
            Global Skill Ranking
          </div>
          <h1 className="text-5xl lg:text-6xl font-bold text-slate-900 tracking-tight mb-4">
            Elite Engineers
          </h1>
          <p className="max-w-2xl text-slate-700 text-lg font-medium leading-relaxed">
            The world&apos;s highest-rated technical problem solvers. Compete, grow, and join the elite.
          </p>
        </div>
      </div>

      {/* Leaderboard Container */}
      <div className="max-w-4xl mx-auto px-6 py-16">

        {loading ? (
          <div className="space-y-3 py-10">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="h-20 bg-slate-200 border border-slate-300 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">

            {users.map((user, i) => (
              <div
                key={user.id}
                onClick={() => router.push(`/u/${user.id}`)}
                className={`group relative flex items-center gap-4 p-5 rounded-lg border transition-all cursor-pointer ${getRankStyle(i)}`}
              >
                {/* Rank Number / Icon */}
                <div className="w-10 h-10 flex items-center justify-center shrink-0">
                  {getRankIcon(i)}
                </div>

                {/* Avatar */}
                <div className="w-12 h-12 rounded-lg border border-slate-300 bg-slate-100 shrink-0 overflow-hidden">
                  <Image
                    src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.display_name}`}
                    alt={user.display_name}
                    width={48}
                    height={48}
                    unoptimized
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Name & Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-slate-900 truncate group-hover:text-blue-600 transition">
                    {user.display_name}
                  </h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs font-semibold text-slate-600 uppercase">Developer</span>
                    <div className="h-1 w-1 bg-slate-400 rounded-full" />
                    <div className="flex items-center gap-1 text-amber-600">
                      <Zap className="w-3 h-3 fill-current" />
                      <span className="text-[10px] font-bold uppercase">{user.streak_count} Day Streak</span>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="text-right flex items-center gap-6">
                  <div>
                    <p className="text-[10px] font-bold text-slate-600 uppercase mb-1">Elo Rating</p>
                    <p className="text-2xl font-bold text-slate-900">{user.elo_rating}</p>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition translate-x-2 group-hover:translate-x-0">
                    <ChevronRight className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* CTA Section */}
      <div className="max-w-4xl mx-auto px-6 mt-8">
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 p-12 rounded-lg relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">Ready to climb the leaderboard?</h2>
            <p className="text-slate-700 text-base mb-8 max-w-2xl">
              Join 2,400+ engineers solving adaptive problems and testing their skills.
            </p>

            <Button
              onClick={() => router.push('/session/new')}
              variant="primary"
              size="lg"
            >
              Start Training Now
            </Button>
          </div>
        </div>
      </div>

    </div>
  )
}
