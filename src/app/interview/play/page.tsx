'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import Editor from '@monaco-editor/react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import { Send, ChevronLeft, Layout, Trophy, MessageCircle, BookOpen, ChevronDown, ChevronUp, Sparkles } from 'lucide-react'

interface Message {
  role: 'interviewer' | 'candidate'
  content: string
}

export default function InterviewPlayPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [problem, setProblem] = useState<any>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [userCode, setUserCode] = useState('')
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [evaluating, setEvaluating] = useState(false)
  const [scorecard, setScorecard] = useState<any>(null)
  const [showProblem, setShowProblem] = useState(true)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const [leftWidth, setLeftWidth] = useState(50)
  const [isResizing, setIsResizing] = useState(false)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return
      const newWidth = (e.clientX / window.innerWidth) * 100
      if (newWidth > 25 && newWidth < 75) setLeftWidth(newWidth)
    }
    const handleMouseUp = () => setIsResizing(false)

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing])

  useEffect(() => {
    const configRaw = sessionStorage.getItem('interview_config')
    if (!configRaw) {
      router.push('/interview/new')
      return
    }

    const config = JSON.parse(configRaw)
    setProblem(config.current_question)
    
    // Restore state from sessionStorage if it exists
    const savedCode = sessionStorage.getItem('curr_interview_code')
    const savedMsgs = sessionStorage.getItem('curr_interview_msgs')

    if (savedCode) {
      setUserCode(savedCode)
    } else {
      setUserCode(config.current_question.payload.scaffold || '')
    }

    if (savedMsgs) {
      setMessages(JSON.parse(savedMsgs))
    } else {
      // Initial greeting
      setMessages([{ 
        role: 'interviewer', 
        content: `Hello ${session?.user?.name || 'there'}! I'm your interviewer today. We'll be working on: **${config.current_question.subtopic}**. \n\nWhenever you're ready, take a look at the problem description above the editor. How would you approach this?`
      }])
    }
  }, [session])

  // Sync state to sessionStorage
  useEffect(() => {
    if (userCode) sessionStorage.setItem('curr_interview_code', userCode)
  }, [userCode])

  useEffect(() => {
    if (messages.length > 0) sessionStorage.setItem('curr_interview_msgs', JSON.stringify(messages))
  }, [messages])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!input.trim() || loading) return

    const newMessages: Message[] = [...messages, { role: 'candidate', content: input }]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/interview/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problem: problem.problem_statement,
          history: newMessages,
          userCode,
          style: 'neutral'
        })
      })

      const data = await res.json()
      let cleanContent = data.content as string
      
      // Check for Task Update marker: [TASK_UPDATE: ... ] to modify the persistent right panel
      const updateMatch = cleanContent.match(/\[TASK_UPDATE:\s([\s\S]+?)\]/)
      if (updateMatch) {
         setProblem((prev: any) => ({ ...prev, problem_statement: updateMatch[1].trim() }))
         cleanContent = cleanContent.replace(updateMatch[0], '').trim()
      }

      setMessages([...newMessages, { role: 'interviewer', content: cleanContent }])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleFinish = async () => {
    setEvaluating(true)
    try {
      const res = await fetch('/api/interview/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problem: problem.problem_statement,
          history: messages,
          userCode
        })
      })
      const data = await res.json()
      setScorecard(data)
    } catch (err) {
      console.error(err)
    } finally {
      setEvaluating(false)
    }
  }

  const handleEditorWillMount = (monaco: any) => {
    monaco.editor.defineTheme('iteratr-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6272a4', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'ff79c6', fontStyle: 'bold' },
        { token: 'number', foreground: 'bd93f9' },
        { token: 'string', foreground: 'f1fa8c' },
        { token: 'operators', foreground: '50fa7b' }
      ],
      colors: {
        'editor.background': '#020617', // Match slate-950
        'editor.foreground': '#f8f8f2',
        'editorLineNumber.foreground': '#44475a',
        'editor.selectionBackground': '#44475a',
        'editor.lineHighlightBackground': '#1e293b', // Match slate-900ish
        'editorCursor.foreground': '#2D4EF5', // Match brand
      }
    })
  }

  const clearSession = () => {
    sessionStorage.removeItem('curr_interview_code')
    sessionStorage.removeItem('curr_interview_msgs')
    sessionStorage.removeItem('interview_config')
  }

  if (status === 'loading' || !problem) return null

  return (
    <div className="h-screen bg-slate-950 flex flex-col font-sans text-slate-200">
      
      {/* Navbar */}
      <header className="h-14 bg-slate-900 border-b border-white/5 px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/dashboard')} className="text-slate-400 hover:text-white transition">
            <ChevronLeft size={20} />
          </button>
          <div className="h-4 w-px bg-white/10" />
          <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
            <Layout size={16} className="text-brand" />
            Iteratr Interview <span className="text-slate-500 font-medium">/ {problem.subtopic}</span>
          </h1>
        </div>
        <div className="flex gap-2">
           <div className="px-3 py-1 bg-white/5 rounded-full border border-white/10 text-[10px] uppercase font-black tracking-widest text-slate-400">
             LIVE SESSION
           </div>
        </div>
      </header>

      <main className={`flex-1 flex overflow-hidden ${isResizing ? 'select-none cursor-col-resize' : ''}`}>
        
        {/* LEFT: CHAT AREA */}
        <section 
          className="border-r border-white/5 flex flex-col bg-slate-950 relative"
          style={{ width: `${leftWidth}%` }}
        >
          <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-none">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'candidate' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed ${
                  m.role === 'candidate' 
                    ? 'bg-brand text-white' 
                    : 'bg-slate-900 border border-white/5 text-slate-300'
                }`}>
                  <div className="font-bold text-[10px] uppercase tracking-widest mb-1 opacity-60">
                    {m.role === 'interviewer' ? 'Interviewer' : 'You'}
                  </div>
                  <div className="markdown prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                      {m.content}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-900 border border-white/5 rounded-2xl p-4 animate-pulse">
                   <div className="w-12 h-2 bg-slate-800 rounded mb-2" />
                   <div className="w-24 h-2 bg-slate-800 rounded" />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleSend} className="p-4 bg-slate-900 border-t border-white/10 shrink-0">
            <div className="relative group">
               <input 
                 type="text" 
                 placeholder="Reply to interviewer or ask for a hint..." 
                 className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand/50 transition pr-12 text-white"
                 value={input}
                 onChange={e => setInput(e.target.value)}
                 disabled={loading}
               />
               <button 
                 type="submit"
                 disabled={!input.trim() || loading}
                 className="absolute right-2 top-2 w-8 h-8 rounded-lg bg-brand text-white flex items-center justify-center disabled:opacity-50 transition hover:bg-brand-dark"
               >
                 <Send size={16} />
               </button>
            </div>
          </form>
        </section>

        {/* RIGHT: EDITOR AREA */}
        <section className="flex-1 flex flex-col bg-slate-900 overflow-hidden relative">
          {/* Draggable Divider */}
          <div
            onMouseDown={() => setIsResizing(true)}
            className={`absolute top-0 left-0 w-1.5 h-full -ml-[3px] z-[60] cursor-col-resize transition-colors hover:bg-brand/50 ${isResizing ? 'bg-brand' : ''}`}
          />
          
          {/* Header */}
          <div className="h-10 bg-slate-900/50 border-b border-white/5 flex items-center px-4 justify-between shrink-0">
             <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Active in IDE
                </span>
             </div>
             <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                {problem.payload.language} interpreter active
             </div>
          </div>

          {/* Collapsible Problem Panel */}
          <div className={`border-b border-white/10 bg-slate-950 transition-all duration-300 flex flex-col ${showProblem ? 'max-h-[40%] overflow-y-auto' : 'max-h-0 overflow-hidden'}`}>
             <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                   <BookOpen size={14} className="text-brand" />
                   <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Problem Description</h3>
                </div>
                <div className="markdown prose prose-invert prose-sm max-w-none prose-p:leading-relaxed">
                   <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                      {problem.problem_statement}
                   </ReactMarkdown>
                </div>
             </div>
          </div>

          {/* Toggle Button for Problem */}
          <button 
            onClick={() => setShowProblem(!showProblem)}
            className="h-6 bg-slate-950/80 hover:bg-slate-900 border-b border-white/5 flex items-center justify-center text-[10px] font-bold text-slate-500 uppercase tracking-widest gap-2 transition"
          >
            {showProblem ? <><ChevronUp size={12}/> Hide Problem</> : <><ChevronDown size={12}/> View Problem Statement</>}
          </button>

          <div className="flex-1 overflow-hidden relative">
            <Editor
              height="100%"
              theme="iteratr-dark"
              language={problem.payload.language}
              value={userCode}
              onChange={val => setUserCode(val || '')}
              beforeMount={handleEditorWillMount}
              options={{
                fontSize: 14,
                fontFamily: 'JetBrains Mono, Menlo, Monaco, monospace',
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                lineNumbers: 'on',
                glyphMargin: true,
                folding: true,
                padding: { top: 20 },
                lineHeight: 1.6,
                cursorBlinking: 'smooth',
                cursorSmoothCaretAnimation: 'on',
              }}
            />
          </div>
          
          {/* Footer Controls */}
          <div className="h-16 bg-slate-950 border-t border-white/5 flex items-center px-6 justify-between shrink-0 shadow-[0_-10px_20px_0_rgba(0,0,0,0.5)] z-10">
             <div className="flex items-center gap-6">
                <div className="flex flex-col">
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">SESSION STATUS</p>
                   <p className="text-xs font-bold text-green-500">IN PROGRESS</p>
                </div>
             </div>
             <div className="flex gap-3">
                <button 
                  onClick={() => { clearSession(); router.push('/dashboard') }}
                  className="px-6 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition text-xs font-bold"
                >
                  End Session
                </button>
                <button 
                  onClick={handleFinish}
                  disabled={evaluating}
                  className="px-6 py-2 rounded-lg bg-brand hover:bg-brand-dark transition text-xs font-bold text-white shadow-lg shadow-brand/20 disabled:opacity-50"
                >
                  {evaluating ? 'Evaluating...' : 'Submit Solution'}
                </button>
             </div>
          </div>
        </section>

      </main>

      {/* SCORECARD OVERLAY */}
      {scorecard && (
        <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-6 overflow-y-auto">
           <div className="w-full max-w-2xl bg-slate-900 border border-white/10 rounded-3xl p-8 shadow-2xl relative">
              <div className="text-center mb-10">
                 <div className="inline-flex items-center justify-center w-20 h-20 bg-brand/10 rounded-full mb-4 border border-brand/20">
                    <Trophy size={40} className="text-brand" />
                 </div>
                 <h2 className="text-3xl font-black text-white tracking-tighter">Your Performance Scorecard</h2>
                 <p className="text-slate-400 font-medium">Session: {problem.subtopic}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                 {[
                   { label: 'Overall Score', value: `${scorecard.overall_score}%`, color: 'text-white' },
                   { label: 'Decision',      value: scorecard.hire_decision,    color: scorecard.hire_decision.includes('No') ? 'text-red-500' : 'text-green-500' }
                 ].map(s => (
                   <div key={s.label} className="bg-slate-950/50 border border-white/5 rounded-2xl p-4 text-center">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{s.label}</p>
                      <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
                   </div>
                 ))}
              </div>

              <div className="space-y-4 mb-10">
                 {[
                   { label: 'Communication', ...scorecard.communication, icon: MessageCircle },
                   { label: 'Logic & Code',  ...scorecard.logic,         icon: Layout },
                   { label: 'Optimization',  ...scorecard.optimization,  icon: Trophy }
                 ].map(crit => (
                   <div key={crit.label} className="bg-slate-950/50 border border-white/5 rounded-2xl p-5">
                      <div className="flex items-center justify-between mb-2">
                         <div className="flex items-center gap-2">
                            <crit.icon size={16} className="text-brand" />
                            <span className="text-sm font-bold text-white">{crit.label}</span>
                         </div>
                         <span className="text-xs font-black text-brand bg-brand/10 px-2 py-0.5 rounded-full">{crit.score}/10</span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed font-medium">{crit.feedback}</p>
                   </div>
                 ))}

                 <div className="bg-brand/5 border border-brand/10 rounded-2xl p-5">
                    <p className="text-[10px] font-black text-brand uppercase tracking-widest mb-2">Lead Interviewer Summary</p>
                    <p className="text-sm text-slate-300 leading-relaxed italic">&quot;{scorecard.summary}&quot;</p>
                 </div>
              </div>

              <div className="flex gap-3">
                 <button 
                   onClick={() => { clearSession(); router.push('/dashboard') }}
                   className="flex-1 py-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-bold transition"
                 >
                   Back to Dashboard
                 </button>
                 <button 
                   onClick={() => { clearSession(); window.location.reload() }}
                   className="flex-1 py-4 rounded-2xl bg-brand hover:bg-brand-dark text-sm font-bold text-white transition shadow-lg shadow-brand/20"
                 >
                   Try Another Session
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  )
}
