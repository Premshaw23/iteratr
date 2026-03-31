'use client'

import { signOut } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'
import type { UserRow, TopicStatsRow, EloHistoryRow } from '@/types/database'
import MasteryRadar from './mastery-radar'
import ActivityGrid from './activity-grid'
import EloChart from './elo-chart'
import { Trophy, Flame, Target, MessageSquare, Plus, ArrowRight, User } from 'lucide-react'

interface Props {
  user:           UserRow
  topicStats:     TopicStatsRow[]
  eloHistory:     EloHistoryRow[]
  interviewCount: number
}

export default function DashboardClient({ user, topicStats, eloHistory, interviewCount }: Props) {
  const weakZones = topicStats.filter(t => t.is_weak_zone)
  const eloPercent = Math.min(((user.elo_rating - 800) / (1800 - 800)) * 100, 100)
  const totalSolved = topicStats.reduce((acc, ts) => acc + ts.solved_count, 0)
  
  // Get distinct topics for radar logic
  const distinctTopics = Array.from(new Set(topicStats.map(s => s.topic)))

  return (
    <div className="min-h-screen gradient-mesh">

      {/* ── TOPBAR ─────────────────────────────────── */}
      <header className="h-16 bg-glass border-b border-border flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="text-2xl font-black text-brand tracking-tighter hover:opacity-90 transition group">
            itera<span className="text-dark transition-colors group-hover:text-brand">tr</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-1">
            {[
              { href: '/dashboard',   label: 'Dashboard' },
              { href: '/session/new',  label: 'Practice'  },
              { href: '/interview',   label: 'Interviews' },
            ].map(n => (
              <Link
                key={n.href}
                href={n.href}
                className="px-4 py-2 text-sm text-mid hover:text-dark hover:bg-surface rounded-lg font-medium transition active:scale-95"
              >
                {n.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {/* Streak Indicator */}
          {user.streak_count > 0 && (
            <div className="flex items-center gap-2 bg-amber-500/10 text-amber-700 border border-amber-500/20 px-3 py-1.5 rounded-full shadow-sm animate-pulse-slow">
              <Flame size={14} className="fill-amber-500 stroke-amber-600 animate-float" />
              <span className="text-sm font-bold">{user.streak_count}</span>
              <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Streak</span>
            </div>
          )}

          {/* User Menu */}
          <div className="relative group">
            <button className="flex items-center gap-2 p-1 pr-3 rounded-full border border-border bg-white hover:border-brand/30 hover:shadow-md transition group-hover:bg-surface">
              <div className="w-8 h-8 rounded-full bg-brand overflow-hidden shadow-inner flex items-center justify-center text-white text-xs font-bold border-2 border-white">
                {user.avatar_url ? (
                  <Image src={user.avatar_url} alt={user.display_name} width={32} height={32} unoptimized className="w-full h-full object-cover" />
                ) : (
                  user.display_name.slice(0, 2).toUpperCase()
                )}
              </div>
              <div className="flex flex-col items-start min-w-[60px]">
                <span className="text-xs font-bold text-dark leading-none">{user.display_name}</span>
                <span className="text-[10px] text-muted font-medium mt-0.5">Elo {user.elo_rating}</span>
              </div>
            </button>

            {/* Dropdown Menu */}
            <div className="absolute right-0 top-full pt-2 w-56 opacity-0 translate-y-2 invisible group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all z-50">
              <div className="bg-white border border-border rounded-2xl shadow-xl overflow-hidden p-1.5">
                <div className="px-3 py-2.5 mb-1 bg-surface/50 rounded-xl">
                  <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">Signed in as</p>
                  <p className="text-xs font-bold text-dark truncate">{user.email}</p>
                </div>

                <Link 
                  href={`/u/${user.display_name}`}
                  className="flex items-center gap-2.5 px-3 py-2 text-sm text-mid hover:text-brand hover:bg-brand-light rounded-xl transition"
                >
                  <User size={16} /> Profile Settings
                </Link>
                
                <Link 
                  href="/stats"
                  className="flex items-center gap-2.5 px-3 py-2 text-sm text-mid hover:text-brand hover:bg-brand-light rounded-xl transition"
                >
                  <Trophy size={16} /> Performance
                </Link>

                <div className="h-px bg-border my-1 mx-1" />

                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-xl transition font-medium text-left"
                >
                  <svg className="w-4 h-4 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex" style={{ height: 'calc(100vh - 64px)' }}>

        {/* ── SIDEBAR ─────────────────────────────────── */}
        <aside className="w-56 bg-white border-r border-border p-3 flex flex-col gap-1 overflow-y-auto">
          <p className="text-xs font-semibold text-muted uppercase tracking-wider px-2 mt-2 mb-1">Topics</p>
          {[
            { label: 'All topics',        color: '#2D4EF5', href: '/session/new' },
            { label: 'Arrays',            color: '#059669', href: '/session/new?topic=arrays' },
            { label: 'Trees',             color: '#7C3AED', href: '/session/new?topic=trees' },
            { label: 'Graphs',            color: '#D97706', href: '/session/new?topic=graphs' },
            { label: 'Dyn. programming',  color: '#DC2626', href: '/session/new?topic=dynamic_programming' },
            { label: 'Linked lists',      color: '#0891B2', href: '/session/new?topic=linked_lists' },
            { label: 'System design',     color: '#64748B', href: '/session/new?topic=system_design' },
          ].map(item => (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-mid hover:bg-surface hover:text-dark transition"
            >
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: item.color }} />
              {item.label}
            </Link>
          ))}

          <p className="text-xs font-semibold text-muted uppercase tracking-wider px-2 mt-4 mb-1">Quick actions</p>
          <Link href="/session/new" className="px-2 py-2 rounded-lg text-sm text-mid hover:bg-surface hover:text-dark transition">
            Start practice
          </Link>
          <Link href="/interview/new" className="px-2 py-2 rounded-lg text-sm text-mid hover:bg-surface hover:text-dark transition">
            Mock interview
          </Link>
          <Link href="/leaderboard" className="px-2 py-2 rounded-lg text-sm text-mid hover:bg-surface hover:text-dark transition font-medium">
            🏆 Leaderboard
          </Link>
          {weakZones.length > 0 && (
            <Link 
              href={`/session/new?mode=weak_zones&topics=${encodeURIComponent(Array.from(new Set(weakZones.map(z => z.topic))).join(','))}&subtopics=${encodeURIComponent(weakZones.map(z => z.subtopic).join(','))}`}
              className="px-2 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 transition"
            >
              Fix weak zones ({weakZones.length})
            </Link>
          )}
        </aside>

        {/* ── MAIN ─────────────────────────────────────── */}
        <main className="flex-1 p-6 overflow-y-auto">

          {/* Stats row */}
          <div className="grid grid-cols-4 gap-3 mb-4">
            {[
              { label: 'Elo rating',  value: user.elo_rating.toLocaleString(), sub: 'technical rating', icon: Trophy, color: 'text-brand'   },
              { label: 'Streak',      value: `${user.streak_count}d`,          sub: 'days active',     icon: Flame,  color: 'text-amber-600' },
              { label: 'Solved',      value: totalSolved,                      sub: 'questions',       icon: Target, color: 'text-emerald-600' },
              { label: 'Interviews',  value: interviewCount,                   sub: 'mock sessions',   icon: MessageSquare, color: 'text-purple-600' },
            ].map(s => (
              <div key={s.label} className="bg-white/80 backdrop-blur-md border border-border rounded-2xl p-4 flex flex-col justify-between card-hover shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] font-black text-muted uppercase tracking-widest">{s.label}</p>
                  <div className={`p-1.5 rounded-lg bg-slate-50 border border-slate-100 ${s.color}`}>
                    <s.icon size={14} />
                  </div>
                </div>
                <div>
                  <p className="text-3xl font-black text-dark tracking-tighter tabular-nums">{s.value}</p>
                  <p className={`text-[11px] mt-1 font-bold uppercase tracking-wide ${s.color}`}>{s.sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Activity Heatmap Grid */}
          <div className="bg-white border border-border rounded-xl p-4 mb-4 relative overflow-hidden group">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-brand/5 blur-3xl rounded-full" />
            <ActivityGrid streakCount={user.streak_count} />
          </div>

          <div className="gradient-brand text-white rounded-2xl p-6 mb-6 flex items-center gap-6 shadow-xl shadow-brand/20 relative overflow-hidden animate-pulse-slow">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-3xl rounded-full -mr-20 -mt-20" />
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-lg flex items-center justify-center text-white flex-shrink-0 animate-float shadow-inner">
              <Plus className="w-8 h-8" strokeWidth={3} />
            </div>
            <div className="flex-1 relative z-10">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70 mb-1">Today&apos;s challenge</p>
              <h3 className="text-xl font-black tracking-tight text-white mb-2">
                Elevate your skills starting today.
              </h3>
              <div className="flex gap-2">
                <span className="bg-white/20 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-white/20">Elo {user.elo_rating}</span>
                <span className="bg-emerald-400/20 text-emerald-100 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-emerald-400/20">+1.1x streak bonus</span>
              </div>
            </div>
            <Link
              href="/session/new"
              className="bg-white text-brand text-sm font-black px-8 py-3.5 rounded-xl hover:bg-brand-light transition-all flex-shrink-0 shadow-lg active:scale-95 uppercase tracking-widest"
            >
              Start Practice
            </Link>
          </div>

          {/* Two-col: Elo Trend + Recent Activity */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            
            {/* Elo Trend Chart */}
            <div className="bg-white border border-border rounded-xl p-4 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-bold text-dark tracking-tight">Technical Growth</p>
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 text-brand rounded-full border border-blue-100 uppercase tracking-widest text-[8px] font-black">
                   Elo Trend
                </div>
              </div>
              <div className="flex-1 min-h-[160px]">
                 <EloChart history={eloHistory} />
              </div>
            </div>

            {/* Recent History Table */}
            <div className="bg-white border border-border rounded-xl p-4 overflow-hidden flex flex-col">
              <p className="text-sm font-bold text-dark mb-4">Recent Activity</p>
              {eloHistory.length === 0 ? (
                <div className="flex-1 flex items-center justify-center p-8 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                  <p className="text-xs text-muted font-medium italic">No attempts yet. Start a session!</p>
                </div>
              ) : (
                <div className="space-y-1 overflow-y-auto max-h-[180px] scrollbar-thin">
                  {eloHistory.slice(0, 10).map(h => (
                    <div key={h.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition group">
                      <div className="flex flex-col truncate">
                        <span className="text-[11px] font-bold text-dark truncate leading-tight group-hover:text-brand transition">{h.reason}</span>
                        <span className="text-[9px] text-muted font-bold uppercase tracking-tighter mt-0.5" suppressHydrationWarning>
                          {new Date(h.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <span className={`text-[11px] font-black ml-2 tabular-nums flex-shrink-0 px-2 py-1 rounded-md ${
                        h.elo_change >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
                      }`}>
                        {h.elo_change >= 0 ? '▲' : '▼'} {Math.abs(h.elo_change)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {eloHistory.length > 10 && (
                <Link href="/stats" className="mt-2 text-center text-[10px] font-bold text-muted hover:text-brand transition uppercase tracking-widest block">
                  See all activity →
                </Link>
              )}
            </div>
          </div>

          {/* Topic Mastery Radar */}
          <div className="bg-white border border-border rounded-xl p-4 flex flex-col mb-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-bold text-dark">Topic Mastery</p>
              <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Aggregate View</span>
            </div>
            <div className="flex-1 min-h-[240px]">
              {topicStats.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-4">
                  <p className="text-xs text-muted italic">Complete your first session to unlock your Technical Mastery Radar.</p>
                </div>
              ) : (
                <MasteryRadar stats={topicStats} />
              )}
            </div>
          </div>

          {weakZones.length > 0 && (
            <div className="bg-red-50 border-l-4 border-red-400 rounded-r-xl p-4 mb-4">
              <p className="text-xs font-bold text-red-700 uppercase tracking-wider mb-2">
                Weak zones detected — {weakZones.length} topic{weakZones.length > 1 ? 's' : ''} need attention
              </p>
              <div className="flex flex-wrap gap-2">
                {weakZones.slice(0, 4).map(z => (
                  <span key={z.id} className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-full font-medium">
                    {z.subtopic} ({z.fail_count} fails)
                  </span>
                ))}
              </div>
              <Link 
                href={`/session/new?mode=weak_zones&topics=${encodeURIComponent(Array.from(new Set(weakZones.map(z => z.topic))).join(','))}&subtopics=${encodeURIComponent(weakZones.map(z => z.subtopic).join(','))}`}
                className="inline-flex items-center mt-3 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
              >
                Fix these now →
              </Link>
            </div>
          )}

          {/* Topic coverage */}
          <div className="bg-white border border-border rounded-xl p-4">
            <p className="text-sm font-semibold text-dark mb-4">Topic coverage</p>
            {topicStats.length === 0 ? (
              <p className="text-sm text-muted">No questions attempted yet. Pick a topic to start.</p>
            ) : (
              <div className="grid grid-cols-1 gap-y-3">
                {topicStats.map(ts => {
                  const total = ts.solved_count + ts.fail_count
                  const pct = total === 0 ? 0 : Math.round((ts.solved_count / total) * 100)
                  const barColor = pct >= 70 ? '#059669' : pct >= 40 ? '#D97706' : '#DC2626'
                  return (
                    <div key={ts.id} className="flex items-center gap-3">
                      <span className="text-xs text-mid w-48 flex-shrink-0 capitalize leading-tight">
                        {ts.subtopic.replace(/_/g, ' ')}
                      </span>
                      <div className="flex-1 h-1.5 bg-surface rounded-full overflow-hidden min-w-0">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: barColor }} />
                      </div>
                      <span className="text-xs font-semibold text-dark w-10 text-right flex-shrink-0">{pct}%</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

        </main>
      </div>
    </div>
  )
}
