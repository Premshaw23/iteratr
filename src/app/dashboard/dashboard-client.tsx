'use client'

import { signOut } from 'next-auth/react'
import Link from 'next/link'
import type { UserRow, TopicStatsRow, EloHistoryRow } from '@/types/database'

interface Props {
  user:        UserRow
  topicStats:  TopicStatsRow[]
  eloHistory:  EloHistoryRow[]
}

export default function DashboardClient({ user, topicStats, eloHistory }: Props) {
  const weakZones = topicStats.filter(t => t.is_weak_zone)
  const eloPercent = Math.min(((user.elo_rating - 800) / (1800 - 800)) * 100, 100)

  return (
    <div className="min-h-screen bg-surface">

      {/* ── TOPBAR ─────────────────────────────────── */}
      <header className="h-13 bg-white border-b border-border flex items-center justify-between px-6 sticky top-0 z-10">
        <span className="text-xl font-bold text-brand">iteratr</span>
        <nav className="flex gap-7">
          {[
            { href: '/dashboard',  label: 'Dashboard' },
            { href: '/session/new', label: 'Practice'  },
            { href: '/interview',  label: 'Interview'  },
            { href: `/u/${user.display_name}`, label: 'Profile' },
          ].map(n => (
            <Link
              key={n.href}
              href={n.href}
              className="text-sm text-mid hover:text-dark font-medium transition"
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          {user.streak_count > 0 && (
            <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 rounded-full font-medium">
              🔥 {user.streak_count} day streak
            </span>
          )}
          <div className="relative group">
            <div className="w-8 h-8 rounded-full bg-brand-light flex items-center justify-center text-brand font-bold text-xs cursor-pointer">
              {user.display_name.slice(0, 2).toUpperCase()}
            </div>
            {/* Dropdown */}
            <div className="absolute right-0 top-10 w-40 bg-white border border-border rounded-xl shadow-sm opacity-0 group-hover:opacity-100 transition pointer-events-none group-hover:pointer-events-auto">
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="w-full text-left px-4 py-3 text-sm text-mid hover:text-dark hover:bg-surface rounded-xl transition"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex" style={{ height: 'calc(100vh - 52px)' }}>

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
          {weakZones.length > 0 && (
            <Link href="/session/new?mode=weak_zones" className="px-2 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 transition">
              Fix weak zones ({weakZones.length})
            </Link>
          )}
        </aside>

        {/* ── MAIN ─────────────────────────────────────── */}
        <main className="flex-1 p-6 overflow-y-auto">

          {/* Stats row */}
          <div className="grid grid-cols-4 gap-3 mb-4">
            {[
              { label: 'Elo rating',  value: user.elo_rating.toLocaleString(), sub: 'your rating',   color: 'text-brand'   },
              { label: 'Streak',      value: `${user.streak_count}d`,          sub: 'days active',   color: 'text-amber-600' },
              { label: 'Solved',      value: '—',                              sub: 'questions',     color: 'text-mid'     },
              { label: 'Interviews',  value: '—',                              sub: 'mock sessions', color: 'text-mid'     },
            ].map(s => (
              <div key={s.label} className="bg-white border border-border rounded-xl p-4">
                <p className="text-xs text-muted mb-1">{s.label}</p>
                <p className="text-3xl font-bold text-dark">{s.value}</p>
                <p className={`text-xs mt-1 font-medium ${s.color}`}>{s.sub}</p>
              </div>
            ))}
          </div>

          {/* Daily challenge banner */}
          <div className="bg-white border border-border rounded-xl p-4 mb-4 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-brand-light flex items-center justify-center text-brand text-xl font-bold flex-shrink-0">
              ★
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted mb-0.5">Today&apos;s challenge</p>
              <p className="text-sm font-semibold text-dark">
                Complete a session to start your daily challenge
              </p>
              <div className="flex gap-2 mt-2">
                <span className="badge-blue">Elo {user.elo_rating}</span>
                <span className="badge-green">+1.1x streak bonus</span>
              </div>
            </div>
            <Link
              href="/session/new"
              className="bg-brand text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-brand-dark transition flex-shrink-0"
            >
              Start →
            </Link>
          </div>

          {/* Two-col: Elo progress + Recent changes */}
          <div className="grid grid-cols-2 gap-4 mb-4">

            {/* Elo progress */}
            <div className="bg-white border border-border rounded-xl p-4">
              <p className="text-sm font-semibold text-dark mb-3">Elo progress</p>
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-3xl font-bold text-dark">{user.elo_rating.toLocaleString()}</span>
                <span className="text-xs text-green-600 font-medium">current rating</span>
              </div>
              <div className="h-1.5 bg-surface rounded-full overflow-hidden mb-2">
                <div className="h-full bg-brand rounded-full transition-all" style={{ width: `${eloPercent}%` }} />
              </div>
              <div className="flex justify-between text-xs text-muted">
                <span>800 foundation</span>
                <span>{user.elo_rating} now</span>
                <span>1800 expert</span>
              </div>
            </div>

            {/* Recent Elo changes */}
            <div className="bg-white border border-border rounded-xl p-4">
              <p className="text-sm font-semibold text-dark mb-3">Recent Elo changes</p>
              {eloHistory.length === 0 ? (
                <p className="text-sm text-muted">No attempts yet. Start a session!</p>
              ) : (
                <div className="space-y-2">
                  {eloHistory.map(h => (
                    <div key={h.id} className="flex items-center justify-between text-sm">
                      <span className="text-mid truncate">{h.reason}</span>
                      <span className={`font-semibold ml-2 flex-shrink-0 ${h.elo_change >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {h.elo_change >= 0 ? '+' : ''}{h.elo_change}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Weak zones alert */}
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
              <Link href="/session/new?mode=weak_zones" className="inline-block mt-3 text-xs font-semibold text-red-700 hover:underline">
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
              <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                {topicStats.map(ts => {
                  const total = ts.solved_count + ts.fail_count
                  const pct = total === 0 ? 0 : Math.round((ts.solved_count / total) * 100)
                  const barColor = pct >= 70 ? '#059669' : pct >= 40 ? '#D97706' : '#DC2626'
                  return (
                    <div key={ts.id} className="flex items-center gap-3">
                      <span className="text-xs text-mid w-28 flex-shrink-0 capitalize">
                        {ts.subtopic.replace(/_/g, ' ')}
                      </span>
                      <div className="flex-1 h-1.5 bg-surface rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: barColor }} />
                      </div>
                      <span className="text-xs font-semibold text-dark w-8 text-right">{pct}%</span>
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
