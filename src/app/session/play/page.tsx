'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback, Fragment } from 'react'
import type { MCQPayload, FillPayload, OrderPayload, CodePayload } from '@/types/database'
import Editor from '@monaco-editor/react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import { Code2, ChevronRight, Lightbulb, CheckCircle2, XCircle, Play, Send, LayoutList, GripVertical } from 'lucide-react'

interface SessionConfig {
  topics:            string[]
  subtopics?:        string[]
  difficulty:        string
  style:             string
  timer:             string
  language:          string
  customPrompt:      string
  current_question:  any
  question_number:   number
  total_questions:   number
  hints_used:        number
}

type Phase = 'answering' | 'submitted' | 'loading_next'

export default function PlayPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [config,        setConfig]      = useState<SessionConfig | null>(null)
  const [selected,      setSelected]    = useState<number | null>(null)
  const [fillAnswers,   setFillAnswers] = useState<string[]>([])
  const [orderSteps,    setOrderSteps]  = useState<string[]>([])
  const [draggedIdx,    setDraggedIdx]  = useState<number | null>(null)
  const [userCode,      setUserCode]    = useState<string>('')
  const [phase,         setPhase]       = useState<Phase>('answering')
  const [feedback,      setFeedback]    = useState<string>('')
  const [hint,          setHint]        = useState<string>('')
  const [hintLevel,     setHintLevel]   = useState(0)
  const [isCorrect,     setIsCorrect]   = useState<boolean | null>(null)
  const [eloChange,     setEloChange]   = useState<number | null>(null)
  const [eloAfter,      setEloAfter]    = useState<number | null>(null)
  const [loadingHint,   setLoadingHint] = useState(false)
  const [submitting,    setSubmitting]  = useState(false)
  const [startTime]                     = useState(Date.now())
  const [leftWidth,     setLeftWidth]   = useState(40) // Percentage
  const [isResizing,    setIsResizing]  = useState(false)
  const [running,       setRunning]     = useState(false)

  // ── PANEL RESIZING (Phase 3) ──────────────────────────────────
  const startResizing = useCallback(() => setIsResizing(true), [])
  const stopResizing = useCallback(() => setIsResizing(false), [])
  const resize = useCallback((mouseMoveEvent: MouseEvent) => {
    if (isResizing) {
      const newWidth = (mouseMoveEvent.clientX / window.innerWidth) * 100
      if (newWidth > 20 && newWidth < 80) setLeftWidth(newWidth)
    }
  }, [isResizing])

  useEffect(() => {
    window.addEventListener('mousemove', resize)
    window.addEventListener('mouseup', stopResizing)
    return () => {
      window.removeEventListener('mousemove', resize)
      window.removeEventListener('mouseup', stopResizing)
    }
  }, [resize, stopResizing])

  useEffect(() => {
    const raw = sessionStorage.getItem('session_config')
    if (!raw) { router.push('/session/new'); return }
    setConfig(JSON.parse(raw))
  }, [router])

  // Initialize special states when question changes
  // We put this BEFORE early returns to satisfy React Hook rules
  useEffect(() => {
    if (!config?.current_question) return
    const q = config.current_question
    if (q.type === 'order') {
      setOrderSteps((q.payload as OrderPayload).shuffled_steps)
    }
    if (q.type === 'code') {
      setUserCode((q.payload as CodePayload).scaffold)
    }
  }, [config?.current_question])

  if (status === 'loading' || !config) return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <div className="text-mid text-sm">Loading question...</div>
    </div>
  )

  if (!session) { router.push('/login'); return null }

  const question = config.current_question
  const isMCQ    = question.type === 'mcq'
  const isFill   = question.type === 'fill'
  const isOrder  = question.type === 'order'
  const isCode   = question.type === 'code'

  const handleRunCode = () => {
    if (!isCode || !userCode.trim() || running || submitting) return
    setRunning(true)
    setFeedback('Running hidden tests on Judge0...')

    fetch('/api/code/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question_id: question.id,
        user_code: userCode,
      }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => null)
        if (!res.ok) {
          const msg =
            data?.code === 'JUDGE0_NOT_CONFIGURED'
              ? 'Judge0 is not configured on this environment.'
              : data?.error || 'Judge0 execution failed.'
          setFeedback(msg)
          return
        }

        const summary = `Passed ${data.passed_count}/${data.total_count} hidden tests.`
        const firstFailed = (data.results || []).find((r: any) => !r.passed)
        if (firstFailed) {
          setFeedback(
            `${summary} First failing case: ${firstFailed.description}. Expected "${firstFailed.expected_output}", got "${firstFailed.actual_output}".`
          )
        } else {
          setFeedback(`${summary} All hidden tests passed. Proceed to final verification.`)
        }
      })
      .catch(() => {
        setFeedback('Judge0 request failed. Check network/config and try again.')
      })
      .finally(() => {
        setRunning(false)
      })
  }

  // ── Submit answer ─────────────────────────────────────────────
  const handleSubmit = async () => {
    const canSubmit = isMCQ 
      ? selected !== null 
      : isFill 
        ? fillAnswers.length > 0 && fillAnswers.every(a => a?.trim() !== '')
        : isCode
          ? userCode.trim().length > 0
          : true // Order always has steps
    if (!canSubmit || submitting) return
    setSubmitting(true)

    const timeTaken = Math.round((Date.now() - startTime) / 1000)
    const submittedAnswer = isMCQ 
      ? String(selected) 
      : isFill 
        ? JSON.stringify(fillAnswers)
        : isCode
          ? userCode
          : JSON.stringify(orderSteps)

    const res = await fetch('/api/attempt', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question_id:       question.id,
        submitted_answer:  submittedAnswer,
        hints_used:        hintLevel,
        time_taken_seconds: timeTaken,
      }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'API failure' }))
      alert(err.message || 'Failed to submit answer. Try again in a few seconds.')
      setSubmitting(false)
      return
    }

    const data = await res.json()
    setFeedback(data.feedback)
    setIsCorrect(data.is_correct)
    setEloChange(data.elo_change)
    setEloAfter(data.elo_after)
    setPhase('submitted')
    setSubmitting(false)
  }

  // ── Get hint ──────────────────────────────────────────────────
  const handleHint = async () => {
    if (hintLevel >= 4 || loadingHint) return
    setLoadingHint(true)

    const nextLevel = hintLevel + 1

    const res = await fetch('/api/hint', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question_id:  question.id,
        hint_level:   nextLevel,
        hints_so_far: hint ? [hint] : [],
      }),
    })

    const data = await res.json()
    setHint(data.hint)
    setHintLevel(nextLevel)
    setLoadingHint(false)
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

  // ── Next question ─────────────────────────────────────────────
  const handleNext = async () => {
    setPhase('loading_next')

    const nextNum = config.question_number + 1

    if (nextNum > config.total_questions) {
      sessionStorage.removeItem('session_config')
      router.push('/dashboard')
      return
    }

    const res = await fetch('/api/questions/generate', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic:        config.topics[Math.floor(Math.random() * config.topics.length)],
        subtopic:     config.subtopics?.[Math.floor(Math.random() * config.subtopics.length)],
        customPrompt: config.customPrompt || undefined,
        language:     config.language,
      }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'API failure' }))
      if (err.code === 'QUOTA_EXCEEDED') {
        alert(err.message)
        router.push('/subscribe')
      } else {
        alert(err.message || 'Failed to generate next question. Your Gemini quota might be exhausted.')
      }
      setPhase('submitted')
      return
    }

    const data = await res.json()

    const newConfig = {
      ...config,
      current_question: data.question,
      question_number:  nextNum,
      hints_used:       0,
    }
    sessionStorage.setItem('session_config', JSON.stringify(newConfig))
    setConfig(newConfig)
    setSelected(null)
    setFillAnswers([])
    setOrderSteps([])
    setUserCode('')
    setPhase('answering')
    setFeedback('')
    setHint('')
    setHintLevel(0)
    setIsCorrect(null)
    setEloChange(null)
    setEloAfter(null)
  }

  // ── Option style ──────────────────────────────────────────────
  const optionStyle = (index: number) => {
    const base = 'flex items-start gap-3 p-3.5 rounded-xl border transition cursor-pointer text-sm'
    if (phase === 'answering') {
      return base + (selected === index
        ? ' border-brand bg-brand-light'
        : ' border-border hover:border-brand')
    }
    
    const correctIdx = (question.payload as MCQPayload).correct_index
    if (index === correctIdx)  return base + ' border-green-400 bg-green-50'
    if (index === selected && !isCorrect) return base + ' border-red-400 bg-red-50'
    return base + ' border-border opacity-50'
  }

  const optionKeys = ['A', 'B', 'C', 'D']

  // ── Drag & Drop Handlers ──────────────────────────────────────
  const handleDragStart = (idx: number) => {
    if (phase !== 'answering') return
    setDraggedIdx(idx)
  }

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault()
    if (draggedIdx === null || draggedIdx === idx || phase !== 'answering') return
    
    const newSteps = [...orderSteps]
    const item = newSteps.splice(draggedIdx, 1)[0]
    newSteps.splice(idx, 0, item)
    setOrderSteps(newSteps)
    setDraggedIdx(idx)
  }

  // ── Render Problem Statement ──────────────────────────────────
  const renderStatement = () => {
    const markdownPlugins = [remarkGfm, remarkMath]
    const rehypePlugins   = [rehypeKatex]

    if (!isFill) {
      return (
        <div className="prose prose-slate prose-sm max-w-none prose-p:leading-relaxed prose-code:bg-slate-100 prose-code:text-brand-dark prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:font-bold prose-code:before:content-none prose-code:after:content-none prose-pre:bg-zinc-950 prose-pre:text-white">
          <ReactMarkdown 
            remarkPlugins={markdownPlugins} 
            rehypePlugins={rehypePlugins}
          >
            {question.problem_statement}
          </ReactMarkdown>
        </div>
      )
    }

    const parts = question.problem_statement.split('___')
    const payload = question.payload as FillPayload

    return (
      <div className="leading-relaxed">
        {parts.map((part: string, i: number) => {
          const isBlankCorrect = phase === 'submitted' && 
            fillAnswers[i]?.trim().toLowerCase() === payload.blanks[i]?.answer.toLowerCase()

          return (
            <Fragment key={i}>
              {/* Render the text part as markdown (inline) */}
              <div className="inline prose prose-slate prose-sm max-w-none">
                <ReactMarkdown 
                  remarkPlugins={markdownPlugins} 
                  rehypePlugins={rehypePlugins}
                  components={{
                    p: ({children}) => <span className="inline-block">{children}</span>
                  }}
                >
                  {part}
                </ReactMarkdown>
              </div>

              {i < parts.length - 1 && (
                <input
                  type="text"
                  placeholder="····"
                  autoFocus={i === 0}
                  value={fillAnswers[i] || ''}
                  disabled={phase !== 'answering' || submitting}
                  onChange={(e) => {
                    const vals = [...fillAnswers]
                    vals[i] = e.target.value
                    setFillAnswers(vals)
                  }}
                  className={`
                    inline-block mx-1.5 px-2 py-0.5 min-w-[60px] 
                    border-b-2 text-center focus:outline-none transition-all duration-200
                    font-mono font-black placeholder:text-slate-400
                    ${phase === 'answering'
                      ? 'border-slate-200 hover:border-slate-300 focus:border-brand bg-transparent text-brand'
                      : isBlankCorrect 
                        ? 'border-emerald-400 text-emerald-600 bg-emerald-50/50 rounded-t-lg shadow-inner'
                        : 'border-rose-400 text-rose-600 bg-rose-50/50 rounded-t-lg shadow-inner'
                    }
                  `}
                  style={{ width: `${Math.max(60, (fillAnswers[i]?.length || 0) * 12 + 10)}px` }}
                />
              )}
            </Fragment>
          )
        })}
      </div>
    )
  }

  // ── Code Space Layout ─────────────────────────────────────────
  if (isCode) {
    const payload = question.payload as CodePayload
    const monacoLang = payload.language === 'python' ? 'python' : payload.language === 'cpp' ? 'cpp' : 'javascript'

    return (
      <div className="h-screen flex flex-col bg-surface overflow-hidden">
        {/* Session topbar */}
        <header className="h-14 bg-white border-b border-border flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-4">
            <span className="text-xl font-black text-brand tracking-tighter">iteratr</span>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2">
              <span className="badge-blue capitalize">{question.topic?.replace(/_/g,' ')}</span>
              <span className="badge-purple uppercase font-bold text-[10px]">Code</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
             {/* Progress dots */}
            <div className="flex items-center gap-1.5">
              {Array.from({ length: config.total_questions }).map((_, i) => (
                <div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full transition ${
                    i < config.question_number - 1 ? 'bg-green-400'
                    : i === config.question_number - 1 ? 'bg-brand'
                    : 'bg-border'
                  }`}
                />
              ))}
              <span className="text-xs font-medium text-mid ml-2">
                {config.question_number} / {config.total_questions}
              </span>
            </div>
            <button
              onClick={() => { sessionStorage.removeItem('session_config'); router.push('/dashboard') }}
              className="text-xs font-semibold text-muted hover:text-dark transition"
            >
              Exit session
            </button>
          </div>
        </header>

        <main className={`flex-1 flex overflow-hidden ${isResizing ? 'select-none cursor-col-resize' : ''}`}>
          {/* Left Panel: Problem */}
          <div 
            className="border-r border-border bg-white overflow-y-auto p-8 custom-scrollbar relative"
            style={{ width: `${leftWidth}%` }}
          >
            <h1 className="text-2xl font-bold text-dark mb-4">{question.subtopic}</h1>
            <div className="prose prose-slate max-w-none mb-8 
              prose-p:text-[15px] prose-p:leading-relaxed prose-p:text-dark/90
              prose-h2:text-xl prose-h2:font-black prose-h2:tracking-tight prose-h2:mt-8 prose-h2:mb-4 prose-h2:text-dark
              prose-code:bg-slate-100 prose-code:text-brand-dark prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:font-bold prose-code:before:content-none prose-code:after:content-none
              prose-strong:text-dark prose-strong:font-black
              prose-pre:bg-zinc-950 prose-pre:border prose-pre:border-white/10 prose-pre:rounded-2xl prose-pre:p-4
              prose-blockquote:border-l-4 prose-blockquote:border-brand prose-blockquote:bg-brand-light/30 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-xl prose-blockquote:italic prose-blockquote:text-mid
            ">
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex]}
              >
                {question.problem_statement}
              </ReactMarkdown>
            </div>

            {/* Hint & Feedback Section */}
            {(hint || feedback) && (
              <div className="space-y-4">
                {hint && (
                  <div className="bg-amber-50/50 border border-amber-200 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="flex items-center gap-2 text-xs font-bold text-amber-700 uppercase tracking-widest">
                        <Lightbulb className="w-3.5 h-3.5" />
                        Socratic Hint — L{hintLevel}
                      </span>
                    </div>
                    <p className="text-[14px] text-amber-900 leading-relaxed font-medium">{hint}</p>
                  </div>
                )}
                {feedback && (
                  <div className={`border rounded-2xl p-6 transition-all duration-300 ${
                    isCorrect === true ? 'bg-emerald-50/50 border-emerald-200 shadow-sm shadow-emerald-100/20'
                    : isCorrect === false ? 'bg-rose-50/50 border-rose-200 shadow-sm shadow-rose-100/20'
                    : 'bg-indigo-50/50 border-indigo-200 shadow-sm shadow-indigo-100/20'
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${
                        isCorrect === true ? 'text-emerald-700'
                        : isCorrect === false ? 'text-rose-700'
                        : 'text-indigo-700'
                      }`}>
                        {isCorrect === true ? 'Judgment: Logic Verified' 
                          : isCorrect === false ? 'Judgment: Logic Failure' 
                          : 'Local Environment: Simulation'}
                      </p>
                      {isCorrect === null && running && (
                        <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                      )}
                    </div>
                    <p className={`text-[14px] leading-relaxed font-medium ${
                      isCorrect === true ? 'text-emerald-950'
                      : isCorrect === false ? 'text-rose-950'
                      : 'text-indigo-950'
                    }`}>{feedback}</p>
                    
                    {isCorrect === null && !running && feedback.includes("Proceed") && (
                      <div className="mt-4 pt-4 border-t border-indigo-100 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                        <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest">Compiler sanity check: Complete</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex-1 flex flex-col bg-[#1e1e1e] relative">
            {/* Draggable Divider */}
            <div
              onMouseDown={startResizing}
              className={`absolute top-0 left-0 w-1.5 h-full -ml-[3px] z-[60] cursor-col-resize transition-colors hover:bg-brand/50 group ${isResizing ? 'bg-brand' : ''}`}
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                 <div className="w-1 h-8 bg-brand/20 rounded-full" />
              </div>
            </div>
            {/* Editor Toolbar */}
            <div className="h-11 bg-[#252525] border-b border-[#333] flex items-center justify-between px-4 shrink-0">
               <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-1 bg-[#2d2d2d] rounded-md border border-[#3d3d3d]">
                    <Code2 className="w-3.5 h-3.5 text-blue-400" />
                    <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-widest">{payload.language}</span>
                  </div>
               </div>
               <div className="flex items-center gap-2">
                  {phase === 'answering' ? (
                    <>
                      <button
                        onClick={handleHint}
                        disabled={hintLevel >= 4 || loadingHint}
                        className="flex items-center gap-2 px-4 py-1.5 text-xs font-bold text-amber-200 hover:bg-amber-400/10 rounded-lg transition disabled:opacity-30"
                      >
                        {loadingHint ? '...' : (
                          <>
                            <Lightbulb className="w-3.5 h-3.5" />
                            {hintLevel === 0 ? 'Get Hint' : `Hint ${hintLevel + 1}`}
                          </>
                        )}
                      </button>
                      <button
                        onClick={handleRunCode}
                        disabled={running || submitting}
                        className="flex items-center gap-2 px-4 py-1.5 text-xs font-bold text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-700/50 border border-white/5 rounded-lg transition disabled:opacity-40"
                      >
                        {running ? 'Running...' : 'Run Code'}
                      </button>
                      <button
                        onClick={handleSubmit}
                        disabled={submitting || running || !userCode.trim()}
                        className="flex items-center gap-2 px-6 py-1.5 bg-brand text-white text-xs font-black rounded-lg hover:bg-brand-dark transition shadow-lg shadow-brand/20 disabled:opacity-40"
                      >
                        {submitting ? 'Verifying...' : 'Final Submit'}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleNext}
                      disabled={phase === 'loading_next'}
                      className="flex items-center gap-2 px-6 py-1.5 bg-brand text-white text-xs font-black rounded-lg hover:bg-brand-dark transition shadow-lg shadow-brand/20 disabled:opacity-50"
                    >
                      {phase === 'loading_next' ? 'Generating...' : (
                        <>
                          {config.question_number >= config.total_questions ? 'Finish Session' : 'Next Challenge'}
                          <ChevronRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  )}
               </div>
            </div>

            {/* Monaco Editor */}
            <div className="flex-1 overflow-hidden relative">
              <Editor
                height="100%"
                theme="iteratr-dark"
                language={monacoLang}
                value={userCode}
                onChange={(val) => setUserCode(val || '')}
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
                  automaticLayout: true,
                  readOnly: phase === 'submitted'
                }}
              />
              {submitting && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center z-10">
                   <div className="bg-zinc-900 border border-zinc-800 px-6 py-3 rounded-full flex items-center gap-3">
                      <div className="w-4 h-4 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs font-bold text-white tracking-widest uppercase">Executing on Judge0...</span>
                   </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface font-sans antialiased text-slate-900">
      {/* Session topbar */}
      <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/60 flex items-center justify-between px-8 sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <span className="text-2xl font-black text-brand tracking-tighter hover:opacity-90 transition cursor-default">itera<span className="text-slate-900">tr</span></span>
          <div className="h-6 w-px bg-slate-200" />
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-500">
              Session Live
            </span>
          </div>
        </div>

        {/* Progress Navigation */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/60 p-1.5 rounded-full shadow-inner">
            {Array.from({ length: config.total_questions }).map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  i < config.question_number - 1 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]'
                  : i === config.question_number - 1 ? 'bg-brand w-4 shadow-[0_0_12px_rgba(45,78,245,0.3)]'
                  : 'bg-slate-200'
                }`}
              />
            ))}
          </div>
          <span className="text-[11px] font-black text-slate-400 uppercase tracking-tighter">
            {config.question_number} <span className="text-slate-300 mx-0.5">/</span> {config.total_questions}
          </span>
        </div>

        <button
          onClick={() => { sessionStorage.removeItem('session_config'); router.push('/dashboard') }}
          className="group flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-400 hover:text-red-500 hover:bg-red-50/50 rounded-xl transition-all"
        >
          <XCircle size={14} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
          Exit Session
        </button>
      </header>

      {/* Main content wrapper */}
      <div className="max-w-4xl mx-auto px-3 py-4 flex flex-col min-h-[calc(100vh-64px)]">
        
        {/* Dynamic Question Area */}
        <div className="flex-1">
          <div className="bg-white border border-slate-200/60 rounded-[24px] shadow-xl shadow-slate-200/30 overflow-hidden relative group">
            <div className="absolute top-0 left-0 w-full h-1 bg-brand/10 group-hover:bg-brand/20 transition-colors" />
            
            <div className="p-4 md:p-6">
              {/* Question Header Meta */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-2 py-1 bg-brand/10 border border-brand/10 rounded-full">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
                    <span className="text-[10px] font-black text-brand uppercase tracking-widest leading-none">
                      {question.topic?.replace(/_/g,' ')}
                    </span>
                  </div>
                  <div className="px-2 py-1 bg-slate-100 rounded-full">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">
                      {question.type}
                    </span>
                  </div>
                </div>
                <div className="px-2 py-1 bg-amber-50 border border-amber-100 rounded-full flex items-center gap-2">
                   <LayoutList size={12} className="text-amber-600" />
                   <span className="text-[10px] font-black text-amber-700 font-mono tracking-tighter">
                     Elo {question.difficulty_elo}
                   </span>
                </div>
              </div>

              {/* Problem Container */}
              <div className="mb-6 min-h-[80px]">
                <div className="text-lg md:text-xl font-bold text-slate-900 leading-snug tracking-tight mb-1">
                  {question.subtopic}
                </div>
                <div className="pt-2 border-t border-slate-50">
                  {renderStatement()}
                </div>
              </div>

              {/* Interaction Elements */}
              <div className="space-y-2">
                {isMCQ && (
                  <div className="grid grid-cols-1 gap-2">
                    {(question.payload as MCQPayload).options.map((option: string, i: number) => (
                      <div
                        key={i}
                        className={optionStyle(i)}
                        onClick={() => phase === 'answering' && setSelected(i)}
                      >
                        <div className={`w-10 h-10 rounded-xl border flex items-center justify-center text-sm font-black transition-all shrink-0 ${
                          selected === i && phase === 'answering' 
                          ? 'bg-brand text-white border-brand shadow-[0_4px_12px_rgba(45,78,245,0.3)]' 
                          : 'bg-slate-50 border-slate-200 text-slate-400 group-hover:border-slate-300'
                        }`}>
                          {optionKeys[i]}
                        </div>
                        <span className="text-[15px] font-semibold text-slate-700 leading-tight py-1">{option}</span>
                        {phase === 'submitted' && (question.payload as MCQPayload).correct_index === i && (
                          <div className="ml-auto text-emerald-500 pr-2">
                            <CheckCircle2 size={24} />
                          </div>
                        )}
                        {phase === 'submitted' && selected === i && !isCorrect && (
                          <div className="ml-auto text-rose-500 pr-2">
                            <XCircle size={24} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {isOrder && (
                  <div className="space-y-2">
                    {orderSteps.map((step, i) => (
                      <div
                        key={step}
                        draggable={phase === 'answering'}
                        onDragStart={() => handleDragStart(i)}
                        onDragOver={(e) => handleDragOver(e, i)}
                        onDragEnd={() => setDraggedIdx(null)}
                        className={`flex items-center gap-4 p-5 rounded-[20px] border transition-all duration-300 ${
                          phase === 'answering'
                            ? 'bg-white border-slate-200 hover:border-brand hover:shadow-lg hover:shadow-slate-200/50 cursor-grab active:cursor-grabbing group/order'
                            : isCorrect
                              ? 'bg-emerald-50 border-emerald-200'
                              : 'bg-rose-50 border-rose-200'
                        } ${draggedIdx === i ? 'opacity-40 grayscale scale-[0.98]' : 'opacity-100'}`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black shrink-0 border transition-all ${
                          phase === 'answering'
                            ? 'bg-slate-50 border-slate-200 text-slate-400 group-hover/order:border-brand/30 group-hover/order:text-brand'
                            : isCorrect
                              ? 'bg-emerald-100 border-emerald-300 text-emerald-700'
                              : 'bg-rose-100 border-rose-300 text-rose-700'
                        }`}>
                          {i + 1}
                        </div>
                        <span className={`text-[15px] font-semibold flex-1 ${
                          phase === 'answering' ? 'text-slate-700' : isCorrect ? 'text-emerald-900' : 'text-rose-900'
                        }`}>
                          {step}
                        </span>
                        {phase === 'answering' && (
                          <div className="text-slate-300 group-hover/order:text-brand/40 transition-colors px-2 cursor-grab">
                            <GripVertical size={20} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {isFill && phase === 'submitted' && (
                  <div className="mt-4 pt-4 border-t border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">The Complete Solution</span>
                    <div className="flex flex-wrap gap-2">
                      {(question.payload as FillPayload).blanks.map((b, i) => (
                        <div key={i} className="flex items-center gap-2 px-3 py-1 bg-emerald-50/50 border border-emerald-100 rounded-xl">
                          <span className="text-[10px] font-black text-emerald-600 bg-emerald-100 w-5 h-5 flex items-center justify-center rounded-lg">{i + 1}</span>
                          <span className="text-xs font-bold text-emerald-800 font-mono tracking-tight">{b.answer}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Global Feedback & Action Container (Pinned to bottom or flowing) */}
        <div className="mt-10 space-y-6 pb-20">
          
          {/* Status Message */}
          <div className="flex flex-col gap-4">
            {hint && (
              <div className="bg-amber-50 border border-amber-200/60 rounded-[24px] p-6 shadow-sm animate-in zoom-in-95 duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                      <Lightbulb size={18} />
                    </div>
                    <span className="text-xs font-black text-amber-700 uppercase tracking-widest">
                      AI Mentor Hint · L{hintLevel}
                    </span>
                  </div>
                  <div className="flex gap-1.5">
                    {[1,2,3,4].map(l => (
                      <div key={l} className={`w-6 h-1 rounded-full transition-all duration-500 ${l <= hintLevel ? 'bg-amber-500' : 'bg-amber-200'}`} />
                    ))}
                  </div>
                </div>
                <p className="text-[15px] font-medium text-amber-950 leading-relaxed italic pr-4">
                  &quot;{hint}&quot;
                </p>
              </div>
            )}

            {feedback && phase === 'submitted' && (
              <div className={`rounded-[24px] overflow-hidden border shadow-xl animate-in slide-in-from-top-4 duration-500 ${
                isCorrect ? 'bg-emerald-50 border-emerald-200 shadow-emerald-100/50' : 'bg-rose-50 border-rose-200 shadow-rose-100/50'
              }`}>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {isCorrect ? (
                        <CheckCircle2 className="text-emerald-500" size={24} />
                      ) : (
                        <XCircle className="text-rose-500" size={24} />
                      )}
                      <span className={`text-[12px] font-black uppercase tracking-widest ${isCorrect ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {isCorrect ? 'Solution Verified' : 'Conceptual Misalignment'}
                      </span>
                    </div>
                    {eloChange !== null && (
                      <div className={`px-4 py-2 rounded-xl text-sm font-black shadow-sm ${
                        eloChange >= 0 ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                      }`}>
                        {eloChange >= 0 ? '▲' : '▼'}{Math.abs(eloChange)} Elo
                      </div>
                    )}
                  </div>
                  <p className="text-[15px] font-medium leading-relaxed text-slate-800 pr-12">
                    {feedback}
                  </p>
                  {eloAfter !== null && (
                    <div className="mt-4 pt-4 border-t border-slate-200/20 flex items-center justify-between">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Technical Rating</span>
                      <span className="text-xs font-black text-slate-600">NEW ELO: {eloAfter}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="flex gap-4 sticky bottom-8 p-3 bg-white/50 backdrop-blur-xl border border-white rounded-[28px] shadow-2xl">
            {phase === 'answering' && (
              <>
                <button
                  onClick={handleHint}
                  disabled={hintLevel >= 4 || loadingHint}
                  className="px-8 py-4 bg-white border border-slate-200 rounded-[20px] text-sm font-black text-slate-500 hover:text-brand hover:border-brand/40 hover:bg-brand/5 transition-all flex items-center gap-3 disabled:opacity-40 shadow-sm grow-0 shrink-0"
                >
                  <Lightbulb size={18} className={loadingHint ? 'animate-pulse' : ''} />
                  {loadingHint ? 'REASONING...' : hintLevel === 0 ? 'GET HINT' : `HINT ${hintLevel + 1}`}
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!(isMCQ ? selected !== null : isFill ? fillAnswers.length > 0 : true) || submitting}
                  className="flex-1 bg-brand text-white font-bold px-10 py-4 rounded-[20px] hover:bg-brand-dark transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-brand/30 hover:shadow-brand/40 active:scale-[0.98] flex items-center justify-center gap-3 text-base"
                >
                  {submitting ? (
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span className="tracking-widest uppercase text-xs">Verifying Logic...</span>
                    </div>
                  ) : (
                    <>
                      <Send size={18} />
                      SUBMIT SOLUTION
                    </>
                  )}
                </button>
              </>
            )}

            {(phase === 'submitted' || phase === 'loading_next') && (
              <button
                onClick={handleNext}
                disabled={phase === 'loading_next'}
                className="flex-1 bg-brand text-white font-black py-5 rounded-[22px] hover:bg-brand-dark transition-all duration-500 shadow-2xl shadow-brand/40 flex items-center justify-center gap-3 active:scale-[0.98] animate-in slide-in-from-bottom-4"
              >
                {phase === 'loading_next' ? (
                   <div className="flex items-center gap-3">
                     <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                     <span className="tracking-widest uppercase text-xs">Generating Neural Path...</span>
                   </div>
                ) : (
                  <>
                    <span className="tracking-tight text-lg">
                      {config.question_number >= config.total_questions ? 'FINISH & VIEW DASHBOARD' : 'NEXT CHALLENGE'}
                    </span>
                    <ChevronRight size={20} className="stroke-[3]" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
