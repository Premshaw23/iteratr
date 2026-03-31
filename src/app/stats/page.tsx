'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import type { TopicStatsRow, EloHistoryRow } from '@/types/database'
import EloChart from '../dashboard/elo-chart'
import MasteryRadar from '../dashboard/mastery-radar'
import { Trophy, Target, TrendingUp, ChevronLeft } from 'lucide-react'

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
    <div className="min-h-screen bg-surface p-6 font-sans">
      <div className="max-w-5xl mx-auto">
        <button 
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-1 text-sm text-muted hover:text-dark transition mb-6"
        >
          <ChevronLeft size={16} /> Back to Dashboard
        </button>

        <h1 className="text-3xl font-black text-dark tracking-tight mb-8">Performance Analytics</h1>

        <div className="grid grid-cols-3 gap-6 mb-8">
          {[
            { label: 'Total Accuracy', value: `${accuracy}%`, sub: 'semantic match', icon: Target, color: 'text-emerald-600' },
            { label: 'Questions Attempted', value: totalAttempts, sub: 'lifetime total', icon: Trophy, color: 'text-brand' },
            { label: 'Current Rating', value: currentRating, sub: 'CSR Standard', icon: TrendingUp, color: 'text-amber-600' },
          ].map(s => (
            <div key={s.label} className="bg-white border border-border rounded-2xl p-6 shadow-sm">
               <div className="flex items-center justify-between mb-2">
                 <p className="text-[10px] font-bold text-muted uppercase tracking-widest">{s.label}</p>
                 <s.icon className={`w-4 h-4 ${s.color}`} />
               </div>
               <p className="text-3xl font-black text-dark tracking-tighter">{s.value}</p>
               <p className="text-[11px] text-muted font-bold mt-1 uppercase tracking-tight">{s.sub}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
           <div className="bg-white border border-border rounded-2xl p-6 shadow-sm">
              <p className="text-sm font-bold text-dark mb-6">Elo Growth Trend</p>
              <div className="h-64">
                <EloChart history={history} />
              </div>
           </div>
           <div className="bg-white border border-border rounded-2xl p-6 shadow-sm">
              <p className="text-sm font-bold text-dark mb-6">Domain Mastery Map</p>
              <div className="h-64">
                <MasteryRadar stats={stats} />
              </div>
           </div>
        </div>

        <div className="bg-white border border-border rounded-2xl p-6 shadow-sm overflow-hidden">
           <p className="text-sm font-bold text-dark mb-6">Detailed Topic Breakdown</p>
           <table className="w-full text-left">
              <thead>
                 <tr className="text-[10px] font-bold text-muted uppercase tracking-widest border-b border-border">
                    <th className="pb-3 text-left">Topic / Subtopic</th>
                    <th className="pb-3">Solved</th>
                    <th className="pb-3">Fails</th>
                    <th className="pb-3">Mastery</th>
                    <th className="pb-3 text-right">Status</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                 {stats.map(s => {
                    const total = s.solved_count + s.fail_count
                    const pct = total === 0 ? 0 : Math.round((s.solved_count / total) * 100)
                    return (
                      <tr key={s.id} className="text-sm group hover:bg-slate-50/50 transition">
                         <td className="py-4">
                            <p className="font-bold text-dark">{s.subtopic.replace(/_/g, ' ')}</p>
                            <p className="text-[10px] text-muted uppercase font-black tracking-tighter">{s.topic}</p>
                         </td>
                         <td className="py-4 tabular-nums text-mid font-medium">{s.solved_count}</td>
                         <td className="py-4 tabular-nums text-mid font-medium">{s.fail_count}</td>
                         <td className="py-4">
                            <div className="flex items-center gap-2">
                               <div className="flex-1 max-w-[80px] h-1 bg-slate-100 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full ${pct >= 70 ? 'bg-emerald-500' : pct >= 40 ? 'bg-amber-500' : 'bg-red-500'}`} 
                                    style={{ width: `${pct}%` }} 
                                  />
                               </div>
                               <span className="text-[11px] font-bold tabular-nums">{pct}%</span>
                            </div>
                         </td>
                         <td className="py-4 text-right">
                            {s.is_weak_zone ? (
                               <span className="px-2 py-0.5 bg-red-50 text-red-700 text-[10px] font-bold rounded-lg border border-red-100 animate-pulse">WEAK ZONE</span>
                            ) : pct >= 80 ? (
                               <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-lg border border-emerald-100">MASTERED</span>
                            ) : (
                               <span className="px-2 py-0.5 bg-slate-50 text-slate-500 text-[10px] font-bold rounded-lg border border-border">GROWING</span>
                            )}
                         </td>
                      </tr>
                    )
                 })}
              </tbody>
           </table>
        </div>
      </div>
    </div>
  )
}
