'use client'

import { useEffect, useState } from 'react'
import { signOut } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'
import type { UserRow, TopicStatsRow, EloHistoryRow } from '@/types/database'
import MasteryRadar from './mastery-radar'
import ActivityGrid from './activity-grid'
import EloChart from './elo-chart'
import { 
  Trophy, Flame, Target, MessageSquare, Plus, ArrowRight, User, Sparkles, Zap, 
  Search, Layout, List, GitBranch, Share2, Cpu, Link2, Server, LogOut, ChevronRight, Check
} from 'lucide-react'
import { usePathname, useSearchParams } from 'next/navigation'

interface Props {
  user:           UserRow
  topicStats:     TopicStatsRow[]
  eloHistory:     EloHistoryRow[]
  interviewCount: number
}

export default function DashboardClient({ user, topicStats, eloHistory, interviewCount }: Props) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const activeTopic = searchParams.get('topic')
  const weakZones = topicStats.filter(t => t.is_weak_zone)
  const eloPercent = Math.min(((user.elo_rating - 800) / (1800 - 800)) * 100, 100)
  const totalSolved = topicStats.reduce((acc, ts) => acc + ts.solved_count, 0)
  const [resettingReflection, setResettingReflection] = useState(false)
  const [reflectionResetDone, setReflectionResetDone] = useState(false)
  const [reflectionText, setReflectionText] = useState<string | null>(null)
  const [reflectionLoading, setReflectionLoading] = useState(true)
  const [reflectionError, setReflectionError] = useState<string | null>(null)
  
  // Get distinct topics for radar logic
  const distinctTopics = Array.from(new Set(topicStats.map(s => s.topic)))

  const navLinks = [
    { href: '/dashboard',   label: 'Dashboard' },
    { href: '/session/new',  label: 'Practice'  },
    { href: '/interview',   label: 'Interviews' },
  ]

  const topics = [
    { label: 'Arrays',            icon: List,       color: 'text-emerald-500',  bg: 'bg-emerald-500/10',  topic: 'arrays' },
    { label: 'Trees',             icon: GitBranch,  color: 'text-purple-500',   bg: 'bg-purple-500/10',   topic: 'trees' },
    { label: 'Graphs',            icon: Share2,     color: 'text-amber-500',    bg: 'bg-amber-500/10',    topic: 'graphs' },
    { label: 'DP',                icon: Cpu,        color: 'text-rose-500',     bg: 'bg-rose-500/10',     topic: 'dynamic_programming' },
    { label: 'Linked Lists',      icon: Link2,      color: 'text-cyan-500',     bg: 'bg-cyan-500/10',     topic: 'linked_lists' },
    { label: 'System Design',     icon: Server,     color: 'text-slate-500',    bg: 'bg-slate-500/10',    topic: 'system_design' },
  ]

  const level = Math.max(1, Math.floor((user.elo_rating - 800) / 150) + 1)
  const title =
    level >= 7 ? 'System Architect' :
    level >= 5 ? 'Senior Problem Solver' :
    level >= 3 ? 'Algorithmic Builder' :
    'Foundations'

  async function refreshReflection() {
    setReflectionLoading(true)
    setReflectionError(null)
    try {
      const res = await fetch('/api/user/me', { cache: 'no-store' })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setReflectionText(data?.reflection_text ?? null)
    } catch {
      setReflectionError('Failed to load reflection.')
    } finally {
      setReflectionLoading(false)
    }
  }

  async function onResetReflection() {
    if (resettingReflection) return
    const ok = window.confirm('Reset reflection? This clears your saved reflection so it can regenerate fresh.')
    if (!ok) return
    setResettingReflection(true)
    setReflectionResetDone(false)
    try {
      const res = await fetch('/api/user/reset-reflection', { method: 'POST' })
      if (!res.ok) {
        throw new Error(await res.text())
      }
      setReflectionResetDone(true)
      setReflectionText(null)
      setTimeout(() => setReflectionResetDone(false), 2500)
    } catch {
      // Keep UI minimal; user can retry.
      setReflectionResetDone(false)
    } finally {
      setResettingReflection(false)
    }
  }

  useEffect(() => {
    refreshReflection()
  }, [])

  return (
    <div className="min-h-screen gradient-mesh">

      {/* ── TOPBAR ─────────────────────────────────── */}
      <header className="h-16 bg-glass-heavy border-b border-border/50 flex items-center justify-between px-6 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-10">
          <Link href="/" className="flex items-center gap-2 text-2xl font-black text-brand tracking-tighter hover:opacity-90 transition-premium group">
            <div className="w-8 h-8 bg-brand rounded-xl flex items-center justify-center shadow-lg shadow-brand/20 group-hover:rotate-12 transition-premium">
              <Zap size={18} className="text-white fill-current" />
            </div>
            <span>itera<span className="text-dark">tr</span></span>
          </Link>
          
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map(n => {
              const isActive = pathname === n.href
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={`relative px-4 py-2 text-sm transition-premium flex items-center gap-2 group ${
                    isActive ? 'text-brand font-bold' : 'text-mid hover:text-dark'
                  }`}
                >
                  {n.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-brand rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                  )}
                  {!isActive && (
                    <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-brand scale-x-0 group-hover:scale-x-100 transition-transform origin-center rounded-full opacity-50" />
                  )}
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="flex items-center gap-6">
          {/* Quick Search Mockup */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-surface border border-border rounded-xl text-muted text-xs cursor-text hover:border-brand/30 transition-premium group">
            <Search size={14} className="group-hover:text-brand transition-colors" />
            <span>Search topics...</span>
            <span className="ml-4 px-1.5 py-0.5 bg-white border border-border rounded text-[10px] font-bold">⌘K</span>
          </div>
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
            <button className="flex items-center gap-3 p-1 pr-4 rounded-2xl border border-border bg-white hover:border-brand/40 hover:shadow-xl hover:shadow-brand/5 shadow-sm transition-premium active:scale-95 group-hover:bg-surface/50">
              <div className="w-9 h-9 rounded-xl bg-brand overflow-hidden shadow-inner flex items-center justify-center text-white text-xs font-bold border-2 border-white ring-2 ring-brand/5">
                {user.avatar_url ? (
                  <Image src={user.avatar_url} alt={user.display_name} width={36} height={36} unoptimized className="w-full h-full object-cover" />
                ) : (
                  user.display_name.slice(0, 2).toUpperCase()
                )}
              </div>
              <div className="flex flex-col items-start">
                <span className="text-xs font-black text-dark leading-none">{user.display_name}</span>
                <div className="flex items-center gap-1 mt-1">
                   <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                   <span className="text-[10px] text-muted font-bold tracking-tighter">Elo {user.elo_rating}</span>
                </div>
              </div>
              <ChevronRight size={14} className="text-muted ml-1 group-hover:rotate-90 transition-transform" />
            </button>

            {/* Dropdown Menu */}
            <div className="absolute right-0 top-full pt-2 w-64 opacity-0 translate-y-3 invisible group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-premium z-50">
              <div className="bg-white/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl overflow-hidden p-2 ring-1 ring-black/5">
                <div className="px-3 py-3 mb-2 bg-brand-light/50 rounded-xl border border-brand/5">
                  <p className="text-[10px] font-black text-brand uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <Sparkles size={10} /> Active Session
                  </p>
                  <p className="text-xs font-bold text-dark truncate">{user.email}</p>
                </div>

                <div className="space-y-1">
                  <Link 
                    href={`/u/${encodeURIComponent(user.id || user.display_name)}`}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm text-mid hover:text-brand hover:bg-brand-light rounded-xl transition-premium group/item"
                  >
                    <div className="p-1.5 rounded-lg bg-surface group-hover/item:bg-brand/10 transition-colors">
                      <User size={16} />
                    </div>
                    <span>Public Profile</span>
                  </Link>
                  
                  <Link 
                    href="/stats"
                    className="flex items-center gap-3 px-3 py-2.5 text-sm text-mid hover:text-brand hover:bg-brand-light rounded-xl transition-premium group/item"
                  >
                    <div className="p-1.5 rounded-lg bg-surface group-hover/item:bg-brand/10 transition-colors">
                      <Trophy size={16} />
                    </div>
                    <span>Technical Analytics</span>
                  </Link>

                  {Array.isArray(user.unlocked_badges) && user.unlocked_badges.length > 0 && (
                    <div className="mx-3 mb-2 mt-1">
                      <p className="text-[9px] font-black text-muted uppercase tracking-[0.2em] mb-1.5">Badges</p>
                      <div className="flex flex-wrap gap-1.5">
                        {user.unlocked_badges.includes('interview_ready') && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-black uppercase tracking-widest">
                            <Trophy size={10} /> Interview Ready
                          </span>
                        )}
                        {user.unlocked_badges.filter(b => b !== 'interview_ready').map(b => (
                          <span key={b} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-[9px] font-black uppercase tracking-widest">
                            {b.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={onResetReflection}
                    disabled={resettingReflection}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl transition-premium font-bold text-left group/item ${
                      resettingReflection
                        ? 'text-slate-400 bg-slate-50 cursor-not-allowed'
                        : reflectionResetDone
                          ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                          : 'text-mid hover:text-brand hover:bg-brand-light'
                    }`}
                    title="Clears your saved reflection so it can regenerate fresh."
                  >
                    <div
                      className={`p-1.5 rounded-lg transition-colors ${
                        resettingReflection
                          ? 'bg-white'
                          : reflectionResetDone
                            ? 'bg-emerald-100'
                            : 'bg-surface group-hover/item:bg-brand/10'
                      }`}
                    >
                      <Sparkles size={16} />
                    </div>
                    <span>{reflectionResetDone ? 'Reflection cleared' : (resettingReflection ? 'Clearing reflection…' : 'Reset reflection')}</span>
                  </button>
                </div>

                <div className="h-px bg-border my-2 mx-2" />

                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-premium font-bold text-left group/logout"
                >
                  <div className="p-1.5 rounded-lg bg-red-100/50 group-hover/logout:bg-red-100 transition-colors">
                    <LogOut size={16} />
                  </div>
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex" style={{ height: 'calc(100vh - 64px)' }}>

        {/* ── SIDEBAR ─────────────────────────────────── */}
        <aside className="w-60 bg-white border-r border-border/50 p-3 flex flex-col gap-3 overflow-y-auto scrollbar-thin">
          <div className="space-y-0.5">
            <p className="text-[9px] font-black text-muted uppercase tracking-[0.2em] px-2 mb-2">Topic Curriculum</p>
            <Link
              href="/session/new"
              className={`flex items-center justify-between px-3 py-1.5 rounded-xl text-sm transition-premium group ${
                pathname === '/session/new' && !activeTopic 
                ? 'sidebar-link-active' 
                : 'text-mid hover:bg-surface hover:text-dark'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className={`w-7 h-7 rounded-lg ${pathname === '/session/new' && !activeTopic ? 'bg-brand text-white' : 'bg-brand/10 text-brand'} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <Layout size={14} />
                </div>
                <span className="font-bold text-xs">All Topics</span>
              </div>
              <ChevronRight size={12} className={`transition-all ${pathname === '/session/new' && !activeTopic ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0'} text-brand`} />
            </Link>

            {topics.map(t => {
              const stat = topicStats.find(s => s.topic === t.topic)
              const solved = stat?.solved_count || 0
              const isActive = activeTopic === t.topic
              return (
                <Link
                  key={t.topic}
                  href={`/session/new?topic=${t.topic}`}
                  className={`flex items-center justify-between px-3 py-1.5 rounded-xl text-sm transition-premium group ${
                    isActive ? 'sidebar-link-active' : 'text-mid hover:bg-surface hover:text-dark'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-7 h-7 rounded-lg ${isActive ? 'bg-brand text-white' : `${t.bg} ${t.color}`} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <t.icon size={14} />
                    </div>
                    <span className="font-semibold text-xs">{t.label}</span>
                  </div>
                  {solved > 0 && !isActive && (
                    <span className="text-[9px] font-black px-1 py-0.5 rounded-md bg-surface border border-border group-hover:border-brand/20 group-hover:text-brand transition-colors">
                      {solved}
                    </span>
                  )}
                  {isActive && (
                    <ChevronRight size={12} className="text-white opacity-60" />
                  )}
                </Link>
              )
            })}
          </div>

          <div>
            <p className="text-[9px] font-black text-muted uppercase tracking-[0.2em] px-2 mb-2">Commander</p>
            <div className="space-y-0.5">
              {[
                { label: 'Technical Stats',  icon: Trophy,  href: '/stats' },
                { label: 'Mock Interviews', icon: MessageSquare, href: '/interview' },
                { label: 'Leaderboard',    icon: Trophy,  href: '/leaderboard' },
              ].map(item => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-sm text-mid hover:bg-surface hover:text-dark transition-premium group"
                >
                  <item.icon size={14} className="text-muted group-hover:text-brand transition-colors" />
                  <span className="font-semibold text-xs">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-auto pt-2 border-t border-border/50">
            {user.is_pro ? (
              <div className="px-3 py-3 bg-slate-900 border border-brand/20 rounded-2xl flex flex-col gap-2 relative overflow-hidden group">
                <div className="absolute -top-10 -right-10 w-24 h-24 bg-brand/10 blur-2xl rounded-full" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1 bg-brand rounded-lg shadow-lg shadow-brand/20 group-hover:rotate-12 transition-transform">
                      <Sparkles size={11} className="text-white fill-current" />
                    </div>
                    <span className="text-[8px] font-black text-brand uppercase tracking-[0.2em]">Iteratr Pro Tier</span>
                  </div>
                  <span className="text-[7px] font-black text-emerald-500 uppercase">Active</span>
                </div>
                <div className="mt-1">
                   <div className="flex items-center justify-between mb-1 px-0.5">
                      <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Compute Quota</span>
                      <span className="text-[7px] font-black text-brand uppercase tracking-widest">1,000 / DAY</span>
                    </div>
                    <div className="h-1 w-full bg-brand/10 rounded-full overflow-hidden">
                      <div className="h-full w-[85%] bg-brand animate-shimmer" />
                    </div>
                </div>
              </div>
            ) : (
              <Link 
                href="/subscribe" 
                className="group relative block p-3 rounded-2xl bg-slate-900 border border-white/10 shadow-2xl overflow-hidden transition-premium hover:-translate-y-1 active:scale-95"
              >
                {/* Refined Background Elements */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-brand/30 blur-[40px] rounded-full -mr-10 -mt-10 group-hover:bg-brand/40 transition-colors" />

                <div className="relative z-10 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black text-brand uppercase tracking-[0.2em]">Iteratr Pro</span>
                      <h4 className="text-xs font-black text-white leading-tight">Upgrade Engines</h4>
                    </div>
                    <div className="p-1 rounded-lg bg-white/5 border border-white/10 group-hover:bg-brand transition-colors group-hover:border-brand">
                      <Zap size={12} className="text-white fill-brand group-hover:fill-white" />
                    </div>
                  </div>

                  <p className="text-[8px] text-slate-400 font-bold leading-tight uppercase tracking-tighter">
                    Senior evaluation (1000/day).
                  </p>

                  <div className="mt-0.5">
                    <div className="flex items-center justify-between mb-1 px-0.5">
                      <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Compute</span>
                      <span className="text-[7px] font-black text-brand uppercase tracking-widest group-hover:animate-pulse">1,000 CYCLES</span>
                    </div>
                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden border border-white/[0.03]">
                      <div className="h-full w-full bg-gradient-to-r from-brand via-indigo-400 to-brand animate-shimmer opacity-80" />
                    </div>
                  </div>
                </div>
              </Link>
            )}

            {weakZones.length > 0 && (
              <Link 
                href={`/session/new?mode=weak_zones&topics=${encodeURIComponent(Array.from(new Set(weakZones.map(z => z.topic))).join(','))}&subtopics=${encodeURIComponent(weakZones.map(z => z.subtopic).join(','))}`}
                className="mt-3 flex items-center justify-between px-3 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-100 hover:bg-red-100 transition-colors group"
              >
                <div className="flex items-center gap-2">
                   <Target size={14} className="animate-pulse" />
                   <span>Fix Weak Zones ({weakZones.length})</span>
                </div>
                <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            )}
          </div>
        </aside>

        {/* ── MAIN ─────────────────────────────────────── */}
        <main className="flex-1 p-6 overflow-y-auto">

          {/* Stats row */}
          <div className="grid grid-cols-4 gap-3 mb-4">
            {[
              { 
                label: 'Elo rating',  
                value: user.elo_rating.toLocaleString(), 
                sub: `Level ${level} · ${title}`, 
                icon: Trophy, 
                color: 'text-brand'   
              },
              { 
                label: 'Streak',      
                value: `${user.streak_count}d`,          
                sub: user.streak_freeze_available ? 'FREEZE ACTIVE ❄️' : 'days active',     
                icon: Flame,  
                color: user.streak_freeze_available ? 'text-blue-600' : 'text-amber-600' 
              },
              { label: 'Solved',      value: totalSolved,                      sub: 'questions',       icon: Target, color: 'text-emerald-600' },
              { 
                label: 'Daily Quota', 
                value: `${eloHistory.filter(h => new Date(h.created_at).toDateString() === new Date().toDateString()).length} / ${user.is_pro ? 1000 : 150}`, 
                sub: 'cycles used today', 
                icon: Zap, 
                color: 'text-indigo-600' 
              },
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

          {/* Reflection / Memory */}
          <div className="bg-white border border-border rounded-2xl p-4 mb-4 overflow-hidden relative">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-brand/5 blur-3xl rounded-full" />
            <div className="relative">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-brand/10 text-brand border border-brand/10">
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-dark tracking-tight">Reflection & Memory</p>
                    <p className="text-[10px] font-bold text-muted uppercase tracking-widest mt-0.5">
                      Regenerates automatically every 5 attempts
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={refreshReflection}
                    disabled={reflectionLoading}
                    className={`px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest border transition-premium ${
                      reflectionLoading
                        ? 'bg-slate-50 text-slate-400 border-slate-100 cursor-not-allowed'
                        : 'bg-white hover:bg-surface text-mid hover:text-dark border-border'
                    }`}
                  >
                    Refresh
                  </button>
                  <button
                    type="button"
                    onClick={onResetReflection}
                    disabled={resettingReflection}
                    className={`px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest border transition-premium ${
                      resettingReflection
                        ? 'bg-slate-50 text-slate-400 border-slate-100 cursor-not-allowed'
                        : reflectionResetDone
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                          : 'bg-brand text-white border-brand hover:opacity-95'
                    }`}
                  >
                    {reflectionResetDone ? 'Cleared' : (resettingReflection ? 'Clearing…' : 'Reset')}
                  </button>
                </div>
              </div>

              <div className="bg-slate-50/60 border border-slate-100 rounded-2xl p-4">
                {reflectionLoading ? (
                  <p className="text-xs text-muted font-semibold italic">Loading reflection…</p>
                ) : reflectionError ? (
                  <p className="text-xs text-red-600 font-bold">{reflectionError}</p>
                ) : reflectionText ? (
                  <p className="text-sm text-slate-700 font-semibold leading-relaxed">
                    &quot;{reflectionText}&quot;
                  </p>
                ) : (
                  <p className="text-xs text-muted font-semibold italic">
                    No reflection saved yet. Complete a few attempts to generate one.
                  </p>
                )}
              </div>
            </div>
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
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70 mb-1">Today&apos;s Daily Challenge ❄️</p>
              <h3 className="text-xl font-black tracking-tight text-white mb-2">
                Ground your skills with the community challenge.
              </h3>
              <div className="flex gap-2">
                <span className="bg-white/20 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-white/20">Elo {user.elo_rating}</span>
                <span className="bg-emerald-400/20 text-emerald-100 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-emerald-400/20">Priority Evaluation Node</span>
              </div>
            </div>
            {eloHistory.filter(h => new Date(h.created_at).toDateString() === new Date().toDateString()).length > 0 ? (
              <div className="relative z-10 bg-white/20 text-white backdrop-blur-md text-sm font-black px-8 py-3.5 rounded-xl flex-shrink-0 shadow-lg border border-white/20 uppercase tracking-widest cursor-default flex items-center gap-2">
                <Check size={16} /> Completed
              </div>
            ) : (
              <Link
                href="/session/new?mode=daily"
                className="relative z-10 bg-white text-brand text-sm font-black px-8 py-3.5 rounded-xl hover:bg-brand-light transition-all flex-shrink-0 shadow-lg active:scale-95 uppercase tracking-widest"
              >
                Play Daily
              </Link>
            )}
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

          {/* Topic Coverage Section */}
          <div className="bg-white/80 backdrop-blur-md border border-border rounded-3xl p-6 shadow-sm overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 blur-3xl rounded-full" />
            
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-lg font-black text-dark tracking-tight">Competency Heatmap</h3>
                <p className="text-[10px] font-bold text-muted uppercase tracking-widest mt-1">Topic-level performance across the curriculum</p>
              </div>
              <div className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-widest">
                {topicStats.length} Subtopics Tracked
              </div>
            </div>

            {topicStats.length === 0 ? (
              <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-12 text-center">
                 <Target className="w-8 h-8 text-slate-300 mx-auto mb-4" />
                 <p className="text-xs text-muted font-medium italic">No questions attempted yet. Pick a topic to begin your evaluation.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {topicStats.map(ts => {
                  const total = ts.solved_count + ts.fail_count
                  const pct = total === 0 ? 0 : Math.round((ts.solved_count / total) * 100)
                  const barColor = pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                  const textColor = pct >= 80 ? 'text-emerald-700' : pct >= 50 ? 'text-amber-700' : 'text-rose-700'
                  const bgColor = pct >= 80 ? 'bg-emerald-50/50' : pct >= 50 ? 'bg-amber-50/50' : 'bg-rose-50/50'

                  return (
                    <div key={ts.id} className={`group p-4 rounded-2xl border border-transparent transition-all hover:bg-white hover:border-border hover:shadow-lg active:scale-[0.98] ${bgColor}`}>
                      <div className="flex items-center justify-between mb-3">
                         <div className="bg-white p-1.5 rounded-lg shadow-sm border border-slate-100 group-hover:scale-110 transition-transform">
                            <Target size={14} className={textColor} />
                         </div>
                         <span className={`text-[10px] font-black uppercase tracking-widest ${textColor}`}>
                            {pct}% Mastered
                         </span>
                      </div>
                      
                      <div className="mb-4">
                        <div className="text-xs font-black text-dark truncate capitalize mb-1 pr-2">
                          {ts.subtopic.replace(/_/g, ' ')}
                        </div>
                        <div className="text-[10px] text-muted font-bold uppercase tracking-tighter">
                          {ts.solved_count} solved · {total} attempts
                        </div>
                      </div>

                      <div className="h-1.5 w-full bg-slate-200/50 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-700 ease-out ${barColor}`} 
                          style={{ width: `${pct}%` }} 
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            
            <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
               <div className="flex gap-4">
                  {[
                    { label: 'Mastered', color: 'bg-emerald-500' },
                    { label: 'Developing', color: 'bg-amber-500' },
                    { label: 'Critical', color: 'bg-rose-500' },
                  ].map(l => (
                    <div key={l.label} className="flex items-center gap-1.5">
                       <div className={`w-1.5 h-1.5 rounded-full ${l.color}`} />
                       <span className="text-[9px] font-black text-muted uppercase tracking-widest">{l.label}</span>
                    </div>
                  ))}
               </div>
               <Link href="/stats" className="text-[10px] font-black text-brand uppercase tracking-[0.2em] hover:underline underline-offset-4">
                 Full Curriculum Analysis →
               </Link>
            </div>
          </div>

        </main>
      </div>
    </div>
  )
}
