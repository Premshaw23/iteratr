'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import type { TopicStatsRow, EloHistoryRow } from '@/types/database'
import EloChart from '../dashboard/elo-chart'
import MasteryRadar from '../dashboard/mastery-radar'
import { Trophy, Target, TrendingUp, ChevronLeft } from 'lucide-react'
import Card from '@/components/Card'

export default function StatsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<TopicStatsRow[]>([])
  const [history, setHistory] = useState<EloHistoryRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
    if (status === 'authenticated') {
      Promise.all([
        fetch('/api/user/stats').then(res => res.json()),
        fetch('/api/dashboard/history').then(res => res.json()),
      ]).then(([statsData, historyData]) => {
        setStats(statsData)
        setHistory(historyData)
        setLoading(false)
      }).catch(err => {
        console.error(err)
        setLoading(false)
      })
    }
  }, [status, router])

  if (loading) return null

  const totalAttempts = stats.reduce((acc, s) => acc + s.solved_count + s.fail_count, 0)
  const accuracy = totalAttempts === 0 ? 0 : Math.round((stats.reduce((acc, s) => acc + s.solved_count, 0) / totalAttempts) * 100)
  const currentRating = history.length > 0 ? history[0].elo_after : 1000

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-10 transition-colors duration-300">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition mb-8 group"
        >
          <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" /> Back to Dashboard
        </button>

        <div className="mb-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">Performance Analytics</h1>
            <p className="text-slate-500 font-medium text-sm md:text-base">Track your growth across all technical domains</p>
          </div>
          <div className="px-4 py-2 bg-blue-50 border border-blue-100 rounded-2xl flex items-center gap-2 self-start md:self-auto shadow-sm">
            <TrendingUp size={16} className="text-blue-600 animate-pulse" />
            <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Live Tracking Active</span>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            { label: 'Accuracy', value: `${accuracy}%`, sub: 'solve rate', icon: Target, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
            { label: 'Questions Attempted', value: totalAttempts, sub: 'lifetime total', icon: Trophy, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100' },
            { label: 'Current Rating', value: currentRating, sub: 'Elo rating', icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100' },
          ].map(s => (
            <Card key={s.label} variant="hover" className="p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{s.label}</p>
                <div className={`p-2 rounded-xl border ${s.bg}`}>
                  <s.icon className={`w-5 h-5 ${s.color}`} />
                </div>
              </div>
              <p className="text-4xl font-extrabold text-slate-900 tracking-tight mb-1">{s.value}</p>
              <p className="text-xs text-slate-500 font-semibold">{s.sub}</p>
            </Card>
          ))}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="p-6 border border-slate-100 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-6 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-blue-500 rounded-full" />
              Elo Growth Trend
            </h3>
            <div className="h-64">
              <EloChart history={history} />
            </div>
          </Card>

          <Card className="p-6 border border-slate-100 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-6 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-indigo-500 rounded-full" />
              Domain Mastery Map
            </h3>
            <div className="h-64">
              <MasteryRadar stats={stats} />
            </div>
          </Card>
        </div>

        {/* Detailed Table */}
        <Card className="p-6 border border-slate-100 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-6 flex items-center gap-2">
            <span className="w-1.5 h-4 bg-slate-900 rounded-full" />
            Topic Breakdown
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <th className="pb-4 text-left">Topic / Subtopic</th>
                  <th className="pb-4 px-2">Solved</th>
                  <th className="pb-4 px-2">Fails</th>
                  <th className="pb-4 px-2">Mastery</th>
                  <th className="pb-4 px-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats.map(s => {
                  const total = s.solved_count + s.fail_count
                  const pct = total === 0 ? 0 : Math.round((s.solved_count / total) * 100)
                  return (
                    <tr key={s.id} className="group hover:bg-slate-50/50 transition">
                      <td className="py-4">
                        <p className="font-bold text-slate-900">{s.subtopic.replace(/_/g, ' ')}</p>
                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-wide mt-1">{s.topic}</p>
                      </td>
                      <td className="py-4 px-2 text-slate-700 font-semibold tabular-nums">{s.solved_count}</td>
                      <td className="py-4 px-2 text-slate-700 font-semibold tabular-nums">{s.fail_count}</td>
                      <td className="py-4 px-2">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 max-w-[100px] h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold tabular-nums w-7 text-right text-slate-700">{pct}%</span>
                        </div>
                      </td>
                      <td className="py-4 px-2 text-right">
                        {s.is_weak_zone ? (
                          <span className="inline-block px-3 py-1 bg-red-50 text-red-700 text-xs font-bold rounded-md border border-red-200">
                            Weak Zone
                          </span>
                        ) : pct >= 80 ? (
                          <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-md border border-emerald-200">
                            Mastered
                          </span>
                        ) : (
                          <span className="inline-block px-3 py-1 bg-slate-50 text-slate-600 text-xs font-bold rounded-md border border-slate-200">
                            Growing
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  )
}
