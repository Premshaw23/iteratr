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
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition mb-8"
        >
          <ChevronLeft size={16} /> Back to Dashboard
        </button>

        <div className="mb-10">
          <h1 className="text-5xl font-bold text-slate-900 mb-2">Performance Analytics</h1>
          <p className="text-slate-600">Track your growth across all technical domains</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            { label: 'Accuracy', value: `${accuracy}%`, sub: 'solve rate', icon: Target, color: 'text-emerald-600' },
            { label: 'Questions Attempted', value: totalAttempts, sub: 'lifetime total', icon: Trophy, color: 'text-blue-600' },
            { label: 'Current Rating', value: currentRating, sub: 'Elo rating', icon: TrendingUp, color: 'text-amber-600' },
          ].map(s => (
            <Card key={s.label} variant="hover">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">{s.label}</p>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <p className="text-3xl font-bold text-slate-900 mb-1">{s.value}</p>
              <p className="text-xs text-slate-600 font-medium">{s.sub}</p>
            </Card>
          ))}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <p className="text-sm font-bold text-slate-900 mb-6">Elo Growth Trend</p>
            <div className="h-64">
              <EloChart history={history} />
            </div>
          </Card>

          <Card>
            <p className="text-sm font-bold text-slate-900 mb-6">Domain Mastery Map</p>
            <div className="h-64">
              <MasteryRadar stats={stats} />
            </div>
          </Card>
        </div>

        {/* Detailed Table */}
        <Card>
          <p className="text-sm font-bold text-slate-900 mb-6">Topic Breakdown</p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wide">
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
                    <tr key={s.id} className="group hover:bg-slate-50 transition">
                      <td className="py-4">
                        <p className="font-semibold text-slate-900">{s.subtopic.replace(/_/g, ' ')}</p>
                        <p className="text-xs text-slate-600 uppercase font-bold mt-1">{s.topic}</p>
                      </td>
                      <td className="py-4 px-2 text-slate-700 font-medium tabular-nums">{s.solved_count}</td>
                      <td className="py-4 px-2 text-slate-700 font-medium tabular-nums">{s.fail_count}</td>
                      <td className="py-4 px-2">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 max-w-[100px] h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold tabular-nums w-7 text-right">{pct}%</span>
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
