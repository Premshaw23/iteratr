'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Editor from '@monaco-editor/react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import {
  ChevronLeft, Trophy, MessageCircle, Layout, Award,
  Clock, Sparkles, Code, MessageSquare, Share2
} from 'lucide-react'

interface Props {
  session: any
}

export default function ReplayClient({ session }: Props) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'chat' | 'code'>('chat')
  const [copied, setCopied] = useState(false)

  const config = session.config || {}
  const transcript = session.transcript || {}
  const history = transcript.history || []
  const observerNotes = transcript.observerNotes || []
  const scorecard = transcript.scorecard || {}
  const userCode = transcript.userCode || ''

  const topicStr = config.topic ? config.topic.replace(/_/g, ' ') : 'System Design'
  const subtopicStr = config.current_question?.subtopic || 'General Practice'
  const language = config.language || 'cpp'

  // Scorecard values
  const overallScore = scorecard.overall_score || 0
  const hireDecision = scorecard.hire_decision || 'N/A'
  const summary = scorecard.summary || ''
  const comms = scorecard.communication || { score: 0, feedback: '' }
  const logic = scorecard.logic || { score: 0, feedback: '' }
  const opt = scorecard.optimization || { score: 0, feedback: '' }

  // SVG Gauge calculations
  const r = 40
  const circ = 2 * Math.PI * r
  const dash = (overallScore / 100) * circ

  let decisionBadgeColor = 'bg-slate-500/10 text-slate-400 border-slate-500/20'
  if (hireDecision === 'Strong Hire') decisionBadgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
  else if (hireDecision === 'Hire') decisionBadgeColor = 'bg-green-500/10 text-green-400 border-green-500/20'
  else if (hireDecision === 'Leaning No Hire' || hireDecision === 'No Hire') decisionBadgeColor = 'bg-red-500/10 text-red-400 border-red-500/20'

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleEditorWillMount = (monaco: any) => {
    monaco.editor.defineTheme('iteratr-dark-theme', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '7c8590', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'ff7b72', fontStyle: 'bold' },
        { token: 'storage', foreground: 'ff7b72', fontStyle: 'bold' },
        { token: 'string', foreground: 'a5d6ff' },
        { token: 'number', foreground: '79c0ff' },
        { token: 'type', foreground: 'ffa657', fontStyle: 'italic' },
        { token: 'class', foreground: 'ffa657', fontStyle: 'bold' },
        { token: 'function', foreground: 'd2a8ff', fontStyle: 'bold' },
      ],
      colors: {
        'editor.background': '#0f172a',
        'editor.foreground': '#e2e8f0',
        'editorLineNumber.foreground': '#484f58',
        'editor.lineHighlightBackground': '#161b22',
        'editor.selectionBackground': '#388bfd33',
        'editorCursor.foreground': '#58a6ff',
      }
    })
  }

  return (
    <div className="min-h-screen bg-[#0b0f19] text-[#e2e8f0] flex flex-col font-sans">
      
      {/* Header */}
      <header className="h-16 border-b border-white/[0.08] bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 flex items-center justify-between px-8 shrink-0">
        <div className="flex items-center gap-4">
          <Link
            href="/interview"
            className="p-2 hover:bg-white/[0.04] rounded-lg transition text-slate-400 hover:text-white"
          >
            <ChevronLeft size={20} />
          </Link>
          <div className="h-4 w-px bg-white/[0.08]" />
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
              <Layout size={16} className="text-blue-500 animate-pulse" />
              Session Replay <span className="text-slate-400 font-medium">/ {subtopicStr}</span>
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono bg-white/[0.04] px-2.5 py-1 rounded-md border border-white/[0.08] text-slate-400 uppercase">
            {language}
          </span>
          <button
            onClick={handleShare}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg shadow-lg shadow-blue-500/20 transition-all active:scale-95"
          >
            <Share2 size={12} />
            {copied ? 'Copied Link!' : 'Share Replay'}
          </button>
        </div>
      </header>

      {/* Main Grid View */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* LEFT COLUMN: Scorecard Overview */}
        <section className="w-full lg:w-96 border-b lg:border-b-0 lg:border-r border-white/[0.08] bg-white/[0.01] p-6 lg:p-8 overflow-y-auto shrink-0 scrollbar-thin">
          <div className="mb-8 text-center">
            {/* Circular Gauge */}
            <div className="relative w-28 h-28 mx-auto mb-4">
              <svg width="112" height="112" viewBox="0 0 96 96" className="-rotate-90">
                <circle cx="48" cy="48" r={r} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="6"/>
                <circle
                  cx="48"
                  cy="48"
                  r={r}
                  fill="none"
                  stroke="url(#blue-indigo-grad)"
                  strokeWidth="6"
                  strokeDasharray={`${dash} ${circ}`}
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="blue-indigo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-white leading-none">{overallScore}%</span>
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider mt-1">Score</span>
              </div>
            </div>

            <h2 className="text-xl font-black text-white tracking-tight leading-snug">Evaluation Complete</h2>
            <p className="text-xs text-slate-400 mt-1 capitalize">{topicStr} Session</p>
            
            <div className="mt-4">
              <span className={`inline-flex px-3.5 py-1 rounded-full border text-xs font-black uppercase tracking-widest ${decisionBadgeColor}`}>
                {hireDecision}
              </span>
            </div>
          </div>

          <div className="h-px bg-white/[0.08] my-6" />

          {/* Criteria Breakdowns */}
          <div className="space-y-4 mb-6">
            {[
              { label: 'Communication', score: comms.score, feedback: comms.feedback, icon: MessageCircle, color: 'text-blue-400 bg-blue-500/10' },
              { label: 'Logic & Correctness', score: logic.score, feedback: logic.feedback, icon: Layout, color: 'text-purple-400 bg-purple-500/10' },
              { label: 'Optimization & Speed', score: opt.score, feedback: opt.feedback, icon: Award, color: 'text-emerald-400 bg-emerald-500/10' }
            ].map(crit => (
              <div key={crit.label} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`p-1 rounded-md ${crit.color}`}>
                      <crit.icon size={13} />
                    </div>
                    <span className="text-xs font-bold text-slate-300">{crit.label}</span>
                  </div>
                  <span className="text-xs font-black text-blue-400">{crit.score}/10</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed font-medium">{crit.feedback}</p>
              </div>
            ))}
          </div>

          {/* Interviewer Summary */}
          {summary && (
            <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-4">
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                <Sparkles size={11} className="animate-pulse" /> Lead Summary
              </p>
              <p className="text-xs text-slate-300 leading-relaxed italic font-medium">&quot;{summary}&quot;</p>
            </div>
          )}
        </section>

        {/* RIGHT COLUMN: Chat Timeline & Code Editor Tabs */}
        <section className="flex-1 flex flex-col bg-[#090d16] overflow-hidden relative">
          
          {/* Tab Selection */}
          <div className="h-12 bg-white/[0.02] border-b border-white/[0.08] flex items-center justify-between px-6 shrink-0">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('chat')}
                className={`px-4 h-12 text-xs font-bold transition flex items-center gap-2 border-b-2 ${
                  activeTab === 'chat'
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <MessageSquare size={13} />
                Dialogue Timeline
              </button>
              <button
                onClick={() => setActiveTab('code')}
                className={`px-4 h-12 text-xs font-bold transition flex items-center gap-2 border-b-2 ${
                  activeTab === 'code'
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Code size={13} />
                Final Submitted Code
              </button>
            </div>
          </div>

          {/* Tab Contents */}
          <div className="flex-1 overflow-hidden relative">
            
            {/* Tab: Chat Transcript */}
            {activeTab === 'chat' && (
              <div className="h-full overflow-y-auto p-6 space-y-6 scrollbar-thin">
                {history.map((m: any, i: number) => {
                  const isCandidate = m.role === 'candidate'
                  // Correlate observer notes to candidate answers for rendering
                  const candidateIndex = history.filter((x: any, idx: number) => x.role === 'candidate' && idx <= i).length
                  const correspondingNote = observerNotes[candidateIndex - 1]

                  return (
                    <div key={i} className="space-y-3">
                      <div className={`flex ${isCandidate ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-xl p-4 shadow-md border ${
                          isCandidate
                            ? 'bg-gradient-to-br from-blue-600/90 to-indigo-600/90 border-blue-500/20 text-white'
                            : 'bg-white/[0.03] border-white/[0.08] text-[#e2e8f0]'
                        }`}>
                          <div className={`font-semibold text-[8px] uppercase tracking-widest mb-2 flex items-center gap-1.5 ${
                            isCandidate ? 'text-white/60' : 'text-blue-400'
                          }`}>
                            {!isCandidate && <Sparkles size={9} />}
                            {isCandidate ? 'Your Response' : 'Interviewer'}
                          </div>
                          <div className={`markdown prose prose-sm max-w-none break-words overflow-hidden ${
                            isCandidate 
                              ? 'prose-p:text-white prose-strong:text-white prose-p:m-0' 
                              : 'prose-p:text-[#e2e8f0] prose-p:m-0'
                          } prose-pre:bg-black/20 prose-pre:p-3 prose-pre:rounded-lg prose-pre:text-xs prose-code:text-blue-300 prose-code:bg-white/5 prose-code:px-1 prose-code:py-0.5 prose-code:rounded`}>
                            <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                              {m.content}
                            </ReactMarkdown>
                          </div>
                        </div>
                      </div>

                      {/* Inline Grader Note if exists */}
                      {isCandidate && correspondingNote && (
                        <div className="flex justify-end">
                          <div className="max-w-[75%] bg-purple-500/10 border border-purple-500/20 rounded-xl p-3 text-left animate-in fade-in duration-300">
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="text-[8px] font-black tracking-widest text-purple-400 uppercase">Observer Observation</span>
                            </div>
                            <div className="markdown prose prose-sm max-w-none prose-p:text-[10px] prose-p:leading-normal prose-p:text-purple-200/90 prose-p:m-0">
                              <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                                {correspondingNote.text}
                              </ReactMarkdown>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Tab: Monaco Code View */}
            {activeTab === 'code' && (
              <div className="h-full bg-[#0f172a] border-t border-white/[0.05]">
                {userCode ? (
                  <Editor
                    height="100%"
                    theme="iteratr-dark-theme"
                    language={language}
                    value={userCode}
                    beforeMount={handleEditorWillMount}
                    options={{
                      readOnly: true,
                      fontSize: 14,
                      fontFamily: 'JetBrains Mono, Menlo, Monaco, monospace',
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      lineNumbers: 'on',
                      padding: { top: 20 },
                      lineHeight: 1.6,
                      domReadOnly: true,
                    }}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center p-10 text-center">
                    <p className="text-sm text-slate-500 italic">No source code was recorded during this interview session.</p>
                  </div>
                )}
              </div>
            )}

          </div>
        </section>

      </div>
    </div>
  )
}
