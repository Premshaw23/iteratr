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
        customPrompt: config.customPrompt || undefined,
        language:     config.language,
      }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'API failure' }))
      alert(err.message || 'Failed to generate next question. Your Gemini quota might be exhausted.')
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
        <div className="prose prose-slate prose-sm max-w-none prose-p:leading-relaxed prose-code:bg-surface prose-code:px-1 prose-code:rounded prose-pre:bg-zinc-900 prose-pre:text-white">
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
                  autoFocus={i === 0}
                  value={fillAnswers[i] || ''}
                  disabled={phase !== 'answering' || submitting}
                  onChange={(e) => {
                    const vals = [...fillAnswers]
                    vals[i] = e.target.value
                    setFillAnswers(vals)
                  }}
                  className={`mx-1 px-2 py-0.5 min-w-[80px] border-b-2 text-center focus:outline-none transition ${
                    phase === 'answering'
                      ? 'border-brand/30 focus:border-brand bg-brand/5'
                      : isBlankCorrect 
                        ? 'border-green-400 text-green-700 bg-green-50 shadow-inner rounded-md'
                        : 'border-red-400 text-red-700 bg-red-50 shadow-inner rounded-md'
                  }`}
                  style={{ width: `${Math.max(80, (fillAnswers[i]?.length || 0) * 10 + 20)}px` }}
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

        <main className="flex-1 flex overflow-hidden">
          {/* Left Panel: Problem */}
          <div className="w-[450px] lg:w-[500px] border-r border-border bg-white overflow-y-auto p-8 custom-scrollbar">
            <h1 className="text-2xl font-bold text-dark mb-4">{question.subtopic}</h1>
            <div className="prose prose-sm prose-slate max-w-none mb-8">
              {/* Note: In a real app we'd use react-markdown here */}
              <div className="whitespace-pre-wrap text-[15px] leading-relaxed text-dark/80">
                {question.problem_statement}
              </div>
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
                  <div className={`border rounded-2xl p-6 ${isCorrect ? 'bg-green-50/50 border-green-200' : 'bg-red-50/50 border-red-200'}`}>
                    <p className={`text-xs font-black uppercase tracking-widest mb-2 ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                      {isCorrect ? 'Logic Verified' : 'Logic Failure'}
                    </p>
                    <p className="text-[14px] leading-relaxed text-dark font-medium">{feedback}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Panel: Editor */}
          <div className="flex-1 flex flex-col bg-[#1e1e1e]">
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
                        onClick={handleSubmit}
                        disabled={submitting || !userCode.trim()}
                        className="flex items-center gap-2 px-6 py-1.5 bg-brand text-white text-xs font-black rounded-lg hover:bg-brand-dark transition disabled:opacity-40"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        Run & Verify
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleNext}
                      className="flex items-center gap-2 px-6 py-1.5 bg-brand text-white text-xs font-black rounded-lg hover:bg-brand-dark transition shadow-lg shadow-brand/20"
                    >
                      {config.question_number >= config.total_questions ? 'Finish Session' : 'Next Challenge'}
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
               </div>
            </div>

            {/* Monaco Editor */}
            <div className="flex-1 overflow-hidden relative">
              <Editor
                height="100%"
                defaultLanguage={monacoLang}
                theme="vs-dark"
                value={userCode}
                onChange={(val) => setUserCode(val || '')}
                options={{
                  fontSize: 14,
                  fontFamily: 'JetBrains Mono, Menlo, monospace',
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  padding: { top: 20 },
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
    <div className="min-h-screen bg-surface">

      {/* Session topbar */}
      <header className="h-12 bg-white border-b border-border flex items-center justify-between px-5">
        <span className="text-lg font-bold text-brand">iteratr</span>

        {/* Progress dots */}
        <div className="flex items-center gap-2">
          {Array.from({ length: config.total_questions }).map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition ${
                i < config.question_number - 1 ? 'bg-green-400'
                : i === config.question_number - 1 ? 'bg-brand'
                : 'bg-border'
              }`}
            />
          ))}
          <span className="text-xs text-mid ml-2">
            {config.question_number} / {config.total_questions}
          </span>
        </div>

        <button
          onClick={() => { sessionStorage.removeItem('session_config'); router.push('/dashboard') }}
          className="text-xs text-muted hover:text-dark"
        >
          Exit session
        </button>
      </header>

      {/* Main content */}
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Question card */}
        <div className="bg-white border border-border rounded-2xl p-6 mb-4">

          {/* Meta badges */}
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="badge-blue capitalize">{question.topic?.replace(/_/g,' ')}</span>
            <span className="badge-purple font-bold uppercase tracking-tight">{question.type}</span>
            <span className="badge-amber font-mono">Elo {question.difficulty_elo}</span>
          </div>

          {/* Question Statement */}
          <div className="mb-6">
            {renderStatement()}
          </div>

          {/* MCQ Options */}
          {isMCQ && (
            <div className="space-y-2">
              {(question.payload as MCQPayload).options.map((option: string, i: number) => (
                <div
                  key={i}
                  className={optionStyle(i)}
                  onClick={() => phase === 'answering' && setSelected(i)}
                >
                  <span className={`w-6 h-6 rounded-md border flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    selected === i && phase === 'answering' ? 'bg-brand text-white border-brand' : 'border-border text-muted'
                  }`}>
                    {optionKeys[i]}
                  </span>
                  <span className="text-dark">{option}</span>
                </div>
              ))}
            </div>
          )}

          {/* Drag to Order List */}
          {isOrder && (
            <div className="space-y-2">
              {orderSteps.map((step, i) => (
                <div
                  key={step}
                  draggable={phase === 'answering'}
                  onDragStart={() => handleDragStart(i)}
                  onDragOver={(e) => handleDragOver(e, i)}
                  onDragEnd={() => setDraggedIdx(null)}
                  className={`flex items-center gap-3 p-4 rounded-xl border transition group ${
                    phase === 'answering'
                      ? 'bg-white border-border hover:border-brand cursor-grab active:cursor-grabbing'
                      : isCorrect
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                  } ${draggedIdx === i ? 'opacity-40 grayscale scale-[0.98]' : 'opacity-100'}`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 border transition ${
                    phase === 'answering'
                      ? 'bg-surface border-border text-muted group-hover:border-brand group-hover:text-brand'
                      : isCorrect
                        ? 'bg-green-100 border-green-300 text-green-700'
                        : 'bg-red-100 border-red-300 text-red-700'
                  }`}>
                    {i + 1}
                  </div>
                  <span className={`text-sm font-medium ${
                    phase === 'answering' ? 'text-dark' : isCorrect ? 'text-green-900' : 'text-red-900'
                  }`}>
                    {step}
                  </span>
                  {phase === 'answering' && (
                    <div className="ml-auto text-border group-hover:text-brand transition">
                      ::
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {isFill && phase === 'submitted' && (
            <div className="mt-6 pt-5 border-t border-zinc-100">
              <span className="text-[12px] font-bold text-zinc-400 uppercase tracking-widest block mb-3">Expected Solutions</span>
              <div className="flex flex-wrap gap-2">
                {(question.payload as FillPayload).blanks.map((b, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-green-50/50 border border-green-100 rounded-lg">
                    <span className="text-[10px] font-black text-green-600 bg-green-100 w-5 h-5 flex items-center justify-center rounded-md">{i + 1}</span>
                    <span className="text-sm font-bold text-green-800">{b.answer}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Hint panel */}
        {hint && (
          <div className="bg-amber-50 border-l-4 border-amber-400 rounded-r-xl p-4 mb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">
                Hint — level {hintLevel} of 4
              </span>
              <div className="flex gap-1">
                {[1,2,3,4].map(l => (
                  <div key={l} className={`w-5 h-1 rounded ${l <= hintLevel ? 'bg-amber-500' : 'bg-amber-200'}`} />
                ))}
              </div>
            </div>
            <p className="text-sm text-amber-900 leading-relaxed">{hint}</p>
          </div>
        )}

        {/* Feedback panel */}
        {feedback && phase === 'submitted' && (
          <div className={`border-l-4 rounded-r-xl p-4 mb-4 ${
            isCorrect
              ? 'bg-green-50 border-green-400'
              : 'bg-red-50 border-red-400'
          }`}>
            <p className="text-xs font-bold uppercase tracking-wider mb-1 ${isCorrect ? 'text-green-700' : 'text-red-700'}">
              {isCorrect ? '✓ Correct' : '✗ Not quite'}
            </p>
            <p className="text-sm leading-relaxed text-dark">{feedback}</p>

            {/* Elo change */}
            {eloChange !== null && (
              <div className="mt-3 flex items-center gap-2">
                <span className={`text-sm font-bold ${eloChange >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {eloChange >= 0 ? '+' : ''}{eloChange} Elo
                </span>
                <span className="text-xs text-muted">→ {eloAfter} total</span>
              </div>
            )}
          </div>
        )}

        {/* Loading next */}
        {phase === 'loading_next' && (
          <div className="bg-white border border-border rounded-xl p-4 mb-4 text-center text-sm text-mid">
            Generating next question...
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3">
          {phase === 'answering' && (
            <>
              <button
                onClick={handleSubmit}
                disabled={!(isMCQ ? selected !== null : isFill ? fillAnswers.length > 0 : true) || submitting}
                className="flex-1 bg-brand text-white font-semibold py-3 rounded-xl hover:bg-brand-dark transition disabled:opacity-40 disabled:cursor-not-allowed text-sm"
              >
                {submitting ? 'Checking...' : 'Submit answer'}
              </button>
              <button
                onClick={handleHint}
                disabled={hintLevel >= 4 || loadingHint}
                className="px-5 py-3 border border-border rounded-xl text-sm font-medium text-mid hover:bg-surface transition disabled:opacity-40"
              >
                {loadingHint ? '...' : hintLevel === 0 ? 'Get hint' : `Hint ${hintLevel + 1}`}
              </button>
            </>
          )}

          {phase === 'submitted' && (
            <button
              onClick={handleNext}
              className="flex-1 bg-brand text-white font-semibold py-3 rounded-xl hover:bg-brand-dark transition text-sm"
            >
              {config.question_number >= config.total_questions ? 'Finish session' : 'Next question →'}
            </button>
          )}
        </div>

      </div>
    </div>
  )
}
