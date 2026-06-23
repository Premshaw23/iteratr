'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Trophy, Zap, Crown, ChevronRight } from 'lucide-react'
import Button from '@/components/Button'
import Card from '@/components/Card'

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

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 pb-20 transition-colors duration-300">

      {/* Header Section */}
      <div className="pt-24 pb-12 px-6 border-b border-slate-200 bg-white">
        <div className="max-w-5xl mx-auto flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-full text-xs font-bold text-blue-600 uppercase tracking-widest mb-8 shadow-sm">
            <Trophy className="w-3.5 h-3.5" />
            Global Skill Ranking
          </div>
          <h1 className="text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight mb-4">
            Elite Engineers
          </h1>
          <p className="max-w-2xl text-slate-500 text-lg font-medium leading-relaxed">
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
          <div className="space-y-10">
            
            {/* Top 3 Podium Grid */}
            {users.length >= 3 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end pt-6">
                
                {/* 2nd Place Card */}
                <Card
                  onClick={() => router.push(`/u/${users[1].id}`)}
                  className="p-6 cursor-pointer border border-slate-200/60 bg-gradient-to-br from-slate-50/50 to-white flex flex-col items-center text-center relative overflow-hidden group hover:shadow-md transition-all duration-300 md:order-1 h-[280px] justify-center"
                >
                  <div className="absolute top-4 left-4 px-2 py-0.5 bg-slate-100 border border-slate-200 text-[10px] font-black text-slate-500 rounded-md">
                    2ND
                  </div>
                  <div className="w-20 h-20 rounded-2xl border-2 border-slate-300 bg-slate-50 overflow-hidden mb-4 shrink-0 shadow-sm group-hover:scale-105 transition-transform duration-300">
                    <Image
                      src={users[1].avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${users[1].display_name}`}
                      alt={users[1].display_name}
                      width={80}
                      height={80}
                      unoptimized
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition truncate w-full px-2">
                    {users[1].display_name}
                  </h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">Silver Tier</p>
                  <div className="mt-4 px-3 py-1 bg-slate-100 rounded-full text-xs font-black text-slate-700">
                    {users[1].elo_rating} Elo
                  </div>
                </Card>

                {/* 1st Place Card - Main Focus */}
                <Card
                  onClick={() => router.push(`/u/${users[0].id}`)}
                  className="p-8 cursor-pointer border-2 border-amber-300 bg-gradient-to-br from-amber-50/30 to-white flex flex-col items-center text-center relative overflow-hidden group hover:shadow-lg shadow-amber-100/30 transition-all duration-300 md:order-2 h-[320px] justify-center md:-translate-y-4 scale-105"
                >
                  <div className="absolute top-4 left-4 px-2 py-0.5 bg-amber-100 border border-amber-200 text-[10px] font-black text-amber-700 rounded-md">
                    CHAMPION
                  </div>
                  <div className="absolute top-4 right-4 text-amber-500 animate-float">
                    <Crown size={20} className="fill-current" />
                  </div>
                  <div className="w-24 h-24 rounded-2xl border-4 border-amber-300 bg-amber-50/50 overflow-hidden mb-4 shrink-0 shadow-md group-hover:scale-105 transition-transform duration-300">
                    <Image
                      src={users[0].avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${users[0].display_name}`}
                      alt={users[0].display_name}
                      width={96}
                      height={96}
                      unoptimized
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="text-lg font-extrabold text-slate-900 group-hover:text-amber-600 transition truncate w-full px-2">
                    {users[0].display_name}
                  </h3>
                  <p className="text-xs text-amber-600 font-bold uppercase tracking-wider mt-1">Gold Champion</p>
                  <div className="mt-4 px-4 py-1.5 bg-amber-500 text-white rounded-full text-sm font-black shadow-md shadow-amber-500/10">
                    {users[0].elo_rating} Elo
                  </div>
                </Card>

                {/* 3rd Place Card */}
                <Card
                  onClick={() => router.push(`/u/${users[2].id}`)}
                  className="p-6 cursor-pointer border border-slate-200/60 bg-gradient-to-br from-orange-50/20 to-white flex flex-col items-center text-center relative overflow-hidden group hover:shadow-md transition-all duration-300 md:order-3 h-[280px] justify-center"
                >
                  <div className="absolute top-4 left-4 px-2 py-0.5 bg-orange-50 border border-orange-100 text-[10px] font-black text-orange-600 rounded-md">
                    3RD
                  </div>
                  <div className="w-20 h-20 rounded-2xl border-2 border-orange-300 bg-orange-50 overflow-hidden mb-4 shrink-0 shadow-sm group-hover:scale-105 transition-transform duration-300">
                    <Image
                      src={users[2].avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${users[2].display_name}`}
                      alt={users[2].display_name}
                      width={80}
                      height={80}
                      unoptimized
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition truncate w-full px-2">
                    {users[2].display_name}
                  </h3>
                  <p className="text-xs text-orange-600/80 font-bold uppercase tracking-wider mt-1">Bronze Tier</p>
                  <div className="mt-4 px-3 py-1 bg-orange-50 rounded-full text-xs font-black text-orange-700">
                    {users[2].elo_rating} Elo
                  </div>
                </Card>
              </div>
            )}

            {/* List for remaining ranks */}
            <Card className="p-0 border border-slate-200 overflow-hidden shadow-sm">
              <div className="divide-y divide-slate-100">
                {users.slice(users.length >= 3 ? 3 : 0).map((user, i) => {
                  const actualRank = users.length >= 3 ? i + 3 : i
                  return (
                    <div
                      key={user.id}
                      onClick={() => router.push(`/u/${user.id}`)}
                      className="group flex items-center gap-4 p-5 hover:bg-slate-50/50 transition-colors cursor-pointer"
                    >
                      {/* Rank Number */}
                      <div className="w-10 h-10 flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-slate-400">#{actualRank + 1}</span>
                      </div>

                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-xl border border-slate-200 bg-slate-50 shrink-0 overflow-hidden shadow-sm">
                        <Image
                          src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.display_name}`}
                          alt={user.display_name}
                          width={40}
                          height={40}
                          unoptimized
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Name & Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-bold text-slate-800 truncate group-hover:text-blue-600 transition">
                          {user.display_name}
                        </h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Developer</span>
                          <div className="h-1 w-1 bg-slate-300 rounded-full" />
                          <div className="flex items-center gap-1 text-amber-600">
                            <Zap className="w-3 h-3 fill-current" />
                            <span className="text-[10px] font-bold uppercase">{user.streak_count} Day Streak</span>
                          </div>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="text-right flex items-center gap-4">
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Elo Rating</p>
                          <p className="text-lg font-bold text-slate-800 tabular-nums">{user.elo_rating}</p>
                        </div>
                        <div className="text-slate-300 group-hover:text-blue-500 transition translate-x-1 group-hover:translate-x-0">
                          <ChevronRight className="w-5 h-5" />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          </div>
        )}

      </div>

      {/* CTA Section */}
      <div className="max-w-4xl mx-auto px-6">
        <div className="bg-gradient-to-br from-blue-50/50 to-purple-50/50 border border-blue-100 p-12 rounded-2xl relative overflow-hidden text-center md:text-left">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Ready to climb the leaderboard?</h2>
              <p className="text-slate-500 text-sm max-w-xl font-medium">
                Join 2,400+ engineers solving adaptive problems and testing their skills.
              </p>
            </div>

            <Button
              onClick={() => router.push('/session/new')}
              variant="primary"
              size="lg"
              className="shrink-0"
            >
              Start Training Now
            </Button>
          </div>
        </div>
      </div>

    </div>
  )
}
