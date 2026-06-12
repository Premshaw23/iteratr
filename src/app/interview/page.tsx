import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import Link from 'next/link'
import { Trophy, MessageSquare, Calendar, Sparkles, ChevronRight, Layout, Zap, Flame, Award } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function InterviewDashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) redirect('/login')

  // Fetch full user data
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id, elo_rating')
    .eq('email', session.user.email)
    .single()

  if (!user) redirect('/login')

  // Fetch past mock interview sessions
  const { data: sessions } = await supabaseAdmin
    .from('sessions')
    .select('*')
    .eq('user_id', user.id)
    .eq('session_type', 'interview')
    .order('created_at', { ascending: false })

  const pastSessions = sessions || []
  const completedSessions = pastSessions.filter(s => s.completed)

  // Calculations
  const totalCompleted = completedSessions.length
  let avgScore = 0
  let hireCount = 0

  if (totalCompleted > 0) {
    const sumScores = completedSessions.reduce((acc, s) => {
      const transcript = s.transcript as any
      const scorecard = transcript?.scorecard
      if (scorecard?.overall_score) {
        return acc + scorecard.overall_score
      }
      const codeScore = s.score_code || 0
      const commsScore = s.score_comms || 0
      const speedScore = s.score_speed || 0
      return acc + Math.round((codeScore + commsScore + speedScore) / 3)
    }, 0)
    avgScore = Math.round(sumScores / totalCompleted)

    hireCount = completedSessions.filter(s => {
      const transcript = s.transcript as any
      const scorecard = transcript?.scorecard
      const decision = scorecard?.hire_decision || ''
      return decision === 'Strong Hire' || decision === 'Hire'
    }).length
  }

  const successRate = totalCompleted === 0 ? 0 : Math.round((hireCount / totalCompleted) * 100)

  return (
    <div className="min-h-screen bg-[#0b0f19] text-[#e2e8f0] pb-12">
      {/* Top Navigation Bar */}
      <header className="h-16 border-b border-white/[0.08] bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 flex items-center justify-between px-8">
        <div className="flex items-center gap-10">
          <Link href="/dashboard" className="flex items-center gap-2 text-2xl font-black text-blue-500 tracking-tighter hover:opacity-90 transition group">
            <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:rotate-12 transition">
              <Zap size={18} className="text-white fill-current" />
            </div>
            <span>itera<span className="text-white">tr</span></span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {[
              { href: '/dashboard', label: 'Dashboard' },
              { href: '/session/new', label: 'Practice' },
              { href: '/interview', label: 'Interviews', active: true }
            ].map(n => (
              <Link
                key={n.href}
                href={n.href}
                className={`relative px-4 py-2 text-sm transition font-semibold flex items-center gap-2 group ${
                  n.active ? 'text-blue-500 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {n.label}
                {n.active && (
                  <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                )}
                {!n.active && (
                  <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-blue-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-center rounded-full opacity-50" />
                )}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-xs font-bold">
            <Flame size={12} className="fill-current" />
            <span>Elo {user.elo_rating}</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-6 pt-10">
        
        {/* Breadcrumb & Intro */}
        <div className="mb-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-blue-500 uppercase tracking-widest mb-2">
              <Sparkles size={14} className="animate-pulse" />
              <span>Simulated Environments</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-2">
              AI Technical Interviewer
            </h1>
            <p className="text-slate-400 text-sm md:text-base max-w-xl">
              Face real-time technical questions, follow-up pressure, and code reviews, backed by detailed grader metrics.
            </p>
          </div>
          <Link
            href="/interview/new"
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/20 transition-all transform active:scale-95 whitespace-nowrap"
          >
            Start New Interview
            <ChevronRight size={16} />
          </Link>
        </div>

        {/* Analytics Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[
            { label: 'Completed Interviews', value: totalCompleted, desc: 'evaluations total', icon: Layout, color: 'text-blue-500', bg: 'bg-blue-500/10 border-blue-500/20' },
            { label: 'Average Score', value: `${avgScore}%`, desc: 'across all categories', icon: Award, color: 'text-purple-500', bg: 'bg-purple-500/10 border-purple-500/20' },
            { label: 'Hire Decision Rate', value: `${successRate}%`, desc: 'passed evaluations', icon: Trophy, color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/20' },
          ].map(stat => (
            <div key={stat.label} className={`rounded-2xl border bg-white/[0.02] backdrop-blur-md p-6 flex flex-col justify-between hover:shadow-xl hover:-translate-y-1 transition duration-300 ${stat.bg}`}>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</span>
                <div className={`p-2 rounded-xl bg-white/[0.03] ${stat.color}`}>
                  <stat.icon size={16} />
                </div>
              </div>
              <div>
                <p className="text-4xl font-black text-white tracking-tight leading-none">{stat.value}</p>
                <p className="text-xs text-slate-400 mt-2 font-medium">{stat.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Session History */}
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-md p-6 md:p-8">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Calendar size={18} className="text-blue-500" />
            Interview History
          </h2>

          {pastSessions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/[0.08] p-12 text-center">
              <MessageSquare className="w-10 h-10 text-slate-500 mx-auto mb-4" />
              <h3 className="text-base font-bold text-white mb-1">No interview history</h3>
              <p className="text-xs text-slate-400 mb-6 max-w-sm mx-auto">
                You haven&apos;t conducted any mock interviews yet. Set up your configuration and face the AI interviewer.
              </p>
              <Link
                href="/interview/new"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg transition"
              >
                Configure First Session
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/[0.08] text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <th className="pb-4 pl-2">Session Domain</th>
                    <th className="pb-4">Language</th>
                    <th className="pb-4">Status</th>
                    <th className="pb-4">Overall Score</th>
                    <th className="pb-4">Result</th>
                    <th className="pb-4 pr-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {pastSessions.map(s => {
                    const dateStr = new Date(s.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })
                    const config = (s.config || {}) as any
                    const transcript = s.transcript as any
                    const topicStr = config.topic 
                      ? config.topic.replace(/_/g, ' ') 
                      : (config.topics && config.topics[0] 
                        ? config.topics[0].replace(/_/g, ' ') 
                        : 'System Design')
                    const subtopicStr = config.current_question?.subtopic || 'General Practice'
                    const scorecard = transcript?.scorecard
                    const overallScore = scorecard?.overall_score || 0
                    const hireDecision = scorecard?.hire_decision || 'N/A'

                    let decisionBadgeColor = 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                    if (hireDecision === 'Strong Hire') decisionBadgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    else if (hireDecision === 'Hire') decisionBadgeColor = 'bg-green-500/10 text-green-400 border-green-500/20'
                    else if (hireDecision === 'Leaning No Hire' || hireDecision === 'No Hire') decisionBadgeColor = 'bg-red-500/10 text-red-400 border-red-500/20'

                    return (
                      <tr key={s.id} className="group hover:bg-white/[0.02] transition duration-200">
                        <td className="py-4 pl-2">
                          <p className="font-bold text-white group-hover:text-blue-400 transition capitalize">{topicStr}</p>
                          <p className="text-xs text-slate-400 mt-1 capitalize font-medium">{subtopicStr}</p>
                        </td>
                        <td className="py-4 font-mono text-xs text-slate-400 uppercase">{config.language || 'cpp'}</td>
                        <td className="py-4">
                          {s.completed ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-black uppercase tracking-wider">
                              COMPLETED
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-black uppercase tracking-wider">
                              IN PROGRESS
                            </span>
                          )}
                        </td>
                        <td className="py-4 font-black text-white tabular-nums">
                          {s.completed ? `${overallScore}%` : '—'}
                        </td>
                        <td className="py-4">
                          {s.completed ? (
                            <span className={`inline-flex px-2.5 py-0.5 rounded-md border text-[10px] font-black uppercase tracking-wider ${decisionBadgeColor}`}>
                              {hireDecision}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-500 font-medium">Incomplete</span>
                          )}
                        </td>
                        <td className="py-4 pr-2 text-right">
                          {s.completed ? (
                            <Link
                              href={`/interview/replay/${s.id}`}
                              className="inline-flex items-center justify-center px-4 py-2 bg-white/[0.04] hover:bg-blue-600 hover:text-white border border-white/[0.08] text-xs font-bold rounded-lg transition"
                            >
                              View Replay
                            </Link>
                          ) : (
                            <Link
                              href="/interview/play"
                              className="inline-flex items-center justify-center px-4 py-2 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/20 text-xs font-bold rounded-lg transition"
                            >
                              Resume
                            </Link>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </main>
    </div>
  )
}
