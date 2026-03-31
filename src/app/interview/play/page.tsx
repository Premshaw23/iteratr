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

import io from 'socket.io-client'

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
  const [running, setRunning] = useState(false)
  const [showProblem, setShowProblem] = useState(true)
  const [typingStatus, setTypingStatus] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [graderAlert, setGraderAlert] = useState<string | null>(null)
  const [observerOpen, setObserverOpen] = useState(true)
  const [observerNotes, setObserverNotes] = useState<Array<{ at: number; text: string }>>([])
  const [taskNum, setTaskNum] = useState(1)
  const [newTaskPulse, setNewTaskPulse] = useState(false)
  const [editorKey, setEditorKey] = useState(0)
  const socketRef = useRef<any>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const [leftWidth, setLeftWidth] = useState(45)
  const [isResizing, setIsResizing] = useState(false)
  const interviewSessionIdRef = useRef<string>('test-session')

  useEffect(() => {
    const stored = localStorage.getItem('interview_sessionId')
    if (stored) {
      interviewSessionIdRef.current = stored
    }
  }, [])

  // ── WebSocket Logic ──
  useEffect(() => {
    // Connect to local WebSocket server
    const socket = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001')
    socketRef.current = socket

    socket.on('connect', () => {
      console.log('Connected to iteratr WebSocket server')
      setIsConnected(true)
      socket.emit('start-interview', { sessionId: interviewSessionIdRef.current })
    })

    socket.on('disconnect', () => {
      console.log('Disconnected from iteratr WebSocket server')
      setIsConnected(false)
    })

    socket.on('interviewer-typing', (data: { status: string }) => setTypingStatus(data.status))

    socket.on('interviewer-message', (data: { content: string }) => {
      let content = data.content

      // 🕵️ Detect [TASK_UPDATE: ...]
      const taskMatch = content.match(/\[TASK_UPDATE:\s*([\s\S]*?)\]/)
      if (taskMatch) {
        const newDesc = taskMatch[1].trim()

        // 🛠️ Search for new code scaffold inside content
        const codeBlockMatch = content.match(/```(?:[a-zA-Z]*)\n?([\s\S]*?)\n?```/)
        if (codeBlockMatch) {
          const newScaffold = codeBlockMatch[1].trim()
          setUserCode(newScaffold)
        }

        setProblem((prev: any) => ({ ...prev, problem_statement: newDesc }))
        setTaskNum(prev => prev + 1)
        setEditorKey(prev => prev + 1)
        setNewTaskPulse(true)
        setTimeout(() => setNewTaskPulse(false), 8000)

        // Remove the tag from the content shown in chat
        content = content.replace(/\[TASK_UPDATE:\s*[\s\S]*?\]/, '').trim()
      }

      setMessages(prev => {
        // Fallback if the interviewer ONLY sent a task update and no text
        const finalContent = content || "I've updated the task above. Let's focus on the new requirements."
        return [...prev, { role: 'interviewer', content: finalContent }]
      })
      setLoading(false)
      setTypingStatus(null)
    })

    socket.on('grader-feedback', (data: { observation: string, score: number }) => {
      const text = `${data.observation} (Score: ${data.score})`
      setGraderAlert(text)
      setObserverNotes(prev => [...prev.slice(-24), { at: Date.now(), text }])
      setTimeout(() => setGraderAlert(null), 8000)
    })

    return () => {
      socket.disconnect()
    }
  }, [])

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

  // Restore state from storage if it exists
  useEffect(() => {
    const configRaw = localStorage.getItem('interview_config')
    if (!configRaw) {
      router.push('/interview/new')
      return
    }

    const config = JSON.parse(configRaw)

    // Restore problem state
    const savedProblem = localStorage.getItem('curr_interview_problem')
    const savedTaskNum = localStorage.getItem('curr_interview_taskNum')

    if (savedProblem) {
      setProblem(JSON.parse(savedProblem))
    } else {
      setProblem(config.current_question)
    }

    if (savedTaskNum) {
      setTaskNum(parseInt(savedTaskNum))
    }

    // Restore state from storage if it exists
    const savedCode = localStorage.getItem('curr_interview_code')
    const savedMsgs = localStorage.getItem('curr_interview_msgs')

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
  }, [session, router])

  // Sync state to storage
  useEffect(() => {
    if (problem) localStorage.setItem('curr_interview_problem', JSON.stringify(problem))
  }, [problem])

  useEffect(() => {
    localStorage.setItem('curr_interview_taskNum', taskNum.toString())
  }, [taskNum])

  useEffect(() => {
    if (userCode) localStorage.setItem('curr_interview_code', userCode)
  }, [userCode])

  useEffect(() => {
    if (messages.length > 0) localStorage.setItem('curr_interview_msgs', JSON.stringify(messages))
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

    // Emitter: Real-time update
    if (socketRef.current?.connected) {
      socketRef.current.emit('chat-message', {
        sessionId: interviewSessionIdRef.current,
        message: input,
        history: newMessages,
        userCode,
        problem: problem.problem_statement
      })
    } else {
      // Fallback to REST if WS is down
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
        setMessages([...newMessages, { role: 'interviewer', content: data.content }])
        if (data?.grader_notes) {
          const text = `Silent grader: ${String(data.grader_notes)}`
          setObserverNotes(prev => [...prev.slice(-24), { at: Date.now(), text }])
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
  }

  const handleRunCode = () => {
    if (!userCode.trim() || running) return
    setRunning(true)
    setGraderAlert("Connecting to Judge0 API...")

    // Add a local timeout for the frontend fetch as well
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('TIMEOUT')), 25000)
    )

    const fetchPromise = fetch('/api/code/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question_id: problem.id,
        user_code: userCode,
      }),
    })

    Promise.race([fetchPromise, timeoutPromise])
      .then(async (res: any) => {
        if (!res.ok) {
          const data = await res.json().catch(() => null)
          throw new Error(data?.error || 'Judge0 execution failed.')
        }
        const data = await res.json()
        const summary = `Passed ${data.passed_count}/${data.total_count} tests.`
        const firstFailed = (data.results || []).find((r: any) => !r.passed)
        
        if (data.is_ai_verified) {
          setGraderAlert(`AI Verified: ${data.ai_feedback || 'Logic looks correct!'}`)
        } else if (firstFailed) {
          setGraderAlert(`${summary} Failing: ${firstFailed.description}. Expected "${firstFailed.expected_output}", got "${firstFailed.actual_output || 'no output'}"`)
        } else {
          setGraderAlert(`${summary} All tests passed locally! Ready for final evaluation.`)
        }
      })
      .catch((err: any) => {
        console.error(err)
        if (err.message === 'TIMEOUT') {
          setGraderAlert("Execution is taking longer than expected. The Judge0 public API might be overloaded, but I'll continue checking your logic.")
        } else {
          setGraderAlert(`Run Error: ${err.message}. I'll use logic verification for your final submission.`)
        }
      })
      .finally(() => {
        setRunning(false)
        setTimeout(() => setGraderAlert(null), 8000)
      })
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
        { token: 'keyword.control', foreground: 'ff79c6', fontStyle: 'bold' },
        { token: 'keyword.declaration', foreground: 'ff79c6', fontStyle: 'bold' },
        { token: 'storage', foreground: 'ff79c6', fontStyle: 'bold' },
        { token: 'storage.type', foreground: '8be9fd', fontStyle: 'italic' },
        { token: 'number', foreground: 'bd93f9' },
        { token: 'string', foreground: 'f1fa8c' },
        { token: 'operators', foreground: '50fa7b' },
        { token: 'delimiter', foreground: 'f8f8f2' },
        { token: 'type', foreground: '8be9fd', fontStyle: 'italic' },
        { token: 'class', foreground: '50fa7b', fontStyle: 'bold' },
        { token: 'function', foreground: '2D4EF5', fontStyle: 'bold' },
        { token: 'entity.name.function', foreground: '2D4EF5', fontStyle: 'bold' },
        { token: 'variable', foreground: 'f8f8f2' },
        { token: 'variable.parameter', foreground: 'ffb86c' },
        { token: 'constant', foreground: 'bd93f9' },
        { token: 'regexp', foreground: 'f1fa8c' },
        { token: 'identifier', foreground: 'f8f8f2' },
      ],
      colors: {
        'editor.background': '#020617', // Match slate-950
        'editor.foreground': '#f8f8f2',
        'editorLineNumber.foreground': '#334155',
        'editor.selectionBackground': '#2D4EF533',
        'editor.lineHighlightBackground': '#0f172a',
        'editorCursor.foreground': '#2D4EF5',
        'editorIndentGuide.background': '#1e293b',
        'editorIndentGuide.activeBackground': '#334155',
      }
    })
  }

  const clearSession = () => {
    localStorage.removeItem('curr_interview_code')
    localStorage.removeItem('curr_interview_msgs')
    localStorage.removeItem('curr_interview_problem')
    localStorage.removeItem('curr_interview_taskNum')
    localStorage.removeItem('interview_config')
    localStorage.removeItem('interview_sessionId')
  }

  if (status === 'loading' || !problem) return null

  return (
    <div className="h-screen bg-slate-950 flex flex-col font-sans text-slate-200">

      {/* Grader Alert System Notification */}
      {graderAlert && (
        <div className="fixed top-20 right-6 z-[100] max-w-[300px] bg-purple-600/90 text-white px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md border border-purple-400/20 flex items-start gap-4 animate-in fade-in slide-in-from-right-8 duration-500">
          <div className="mt-0.5 shrink-0 bg-white/20 p-1 rounded-lg">
            <Sparkles size={14} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <p className="text-[9.5px] font-black tracking-widest text-purple-100 uppercase">Observer</p>
              <div className="h-2 w-px bg-white/20" />
              <p className="text-[9.5px] font-black text-white/50 uppercase">Live</p>
            </div>
            <div className="markdown prose prose-invert max-w-none prose-p:leading-snug prose-p:font-bold prose-p:text-[10.5px]">
              <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                {graderAlert}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      )}

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
          <div className={`px-3 py-1 ${isConnected ? 'bg-green-500/10 text-green-500 border-green-500/20 shadow-[0_0_15px_-5px_rgba(34,197,94,0.4)]' : 'bg-white/5 text-slate-400 border-white/10'} rounded-full border text-[10px] uppercase font-black tracking-widest transition-all duration-500 flex items-center gap-1.5`}>
            {isConnected && <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />}
            {isConnected ? 'REAL-TIME ACTIVE' : 'LIVE SESSION'}
          </div>
        </div>
      </header>

      <main className={`flex-1 flex overflow-hidden ${isResizing ? 'select-none cursor-col-resize' : ''}`}>

        {/* LEFT: CHAT AREA */}
        <section
          className="border-r border-white/5 flex flex-col bg-slate-950 relative"
          style={{ width: `${leftWidth}%` }}
        >
          <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-dark scroll-smooth">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'candidate' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                <div className={`max-w-[92%] rounded-2xl p-5 text-sm leading-relaxed shadow-2xl relative ${m.role === 'candidate'
                  ? 'bg-gradient-to-br from-brand to-brand-dark text-white select-none shadow-brand/10'
                  : 'bg-slate-900 border border-white/5 text-slate-300 shadow-black/30'
                  }`}>
                  <div className={`font-black text-[9px] uppercase tracking-[0.2em] mb-3 flex items-center gap-2 ${m.role === 'candidate' ? 'text-white/50' : 'text-brand'}`}>
                    {m.role === 'interviewer' ? (
                      <><Sparkles size={10} className="animate-pulse" /> Interviewer Intelligence</>
                    ) : 'Your Response'}
                  </div>
                  <div className={`markdown prose prose-invert prose-sm max-w-none break-words overflow-hidden ${m.role === 'candidate' ? 'prose-p:text-white prose-strong:text-white' : 'prose-p:text-slate-300'} 
                    prose-pre:bg-slate-950 prose-pre:border prose-pre:border-white/10 prose-pre:p-4 prose-pre:rounded-xl prose-code:text-brand prose-code:font-mono`}>
                    <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                      {m.content}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}
            {(loading || typingStatus) && (
              <div className="flex justify-start">
                <div className="bg-slate-900 border border-brand/20 rounded-2xl p-4 animate-pulse-slow">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles size={12} className="text-brand" />
                    <div className="text-[9px] font-black uppercase tracking-[0.2em] text-brand">
                      {typingStatus === 'reasoning' ? 'Interviewer is reasoning...' : 'Interviewer is reviewing code...'}
                    </div>
                  </div>
                  <div className="w-24 h-2 bg-slate-800 rounded" />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleSend} className="p-4 bg-slate-900 border-t border-white/10 shrink-0">
            <div className="relative group flex items-end gap-2">
              <textarea
                placeholder="Reply to interviewer or explain your logic..."
                rows={Math.min(5, input.split('\n').length || 1)}
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand/50 transition text-white resize-none scrollbar-none min-h-[46px]"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
                disabled={loading}
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="w-11 h-11 shrink-0 rounded-xl bg-brand text-white flex items-center justify-center disabled:opacity-50 transition hover:bg-brand-dark shadow-lg shadow-brand/20"
              >
                <Send size={18} />
              </button>
            </div>
            <p className="mt-2 text-[9px] font-bold text-slate-600 uppercase tracking-widest text-center">
              Press <span className="text-slate-400">Enter</span> to send • <span className="text-slate-400">Shift + Enter</span> for new line
            </p>
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
          <div className={`border-b border-white/10 bg-slate-950 transition-all duration-500 flex flex-col relative scrollbar-dark ${showProblem ? 'max-h-[40%] overflow-y-auto' : 'max-h-0 overflow-hidden'}`}>
            {newTaskPulse && (
              <div className="absolute top-4 right-6 z-20 bg-brand text-white text-[10px] font-black px-3 py-1 rounded-full animate-bounce shadow-lg shadow-brand/40">
                NEW TASK ASSIGNED
              </div>
            )}
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-brand/10 border border-brand/20 flex items-center justify-center">
                    <BookOpen size={16} className="text-brand" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-200">Problem Description</h3>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Task Version {taskNum}.0</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-slate-900 rounded-full border border-white/5">
                  <span className="w-2 h-2 rounded-full bg-brand animate-pulse" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Part {taskNum}</span>
                </div>
              </div>
              <div className="markdown prose prose-invert prose-base max-w-none prose-p:leading-relaxed prose-p:text-slate-300 prose-headings:text-white prose-code:text-brand prose-code:bg-brand/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-strong:text-white prose-strong:font-black">
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
            {showProblem ? <><ChevronUp size={12} /> Hide Problem</> : <><ChevronDown size={12} /> View Problem Statement</>}
          </button>

          <div className="flex-1 overflow-hidden relative">
            <Editor
              key={editorKey}
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
                onClick={handleRunCode}
                disabled={running || evaluating}
                className="px-6 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition text-xs font-bold flex items-center gap-2"
              >
                {running ? (
                  <><div className="w-2 h-2 rounded-full bg-brand animate-ping" /> Running Tests...</>
                ) : 'Run Code'}
              </button>
              <button
                onClick={handleFinish}
                disabled={evaluating || running}
                className="px-6 py-2 rounded-lg bg-brand hover:bg-brand-dark transition text-xs font-bold text-white shadow-lg shadow-brand/20 disabled:opacity-50"
              >
                {evaluating ? 'Evaluating...' : 'Submit Solution'}
              </button>
            </div>
          </div>
        </section>

        {/* OBSERVER: SIDEBAR */}
        <aside className={`shrink-0 border-l border-white/5 bg-slate-950/70 backdrop-blur-xl transition-all duration-300 ${observerOpen ? 'w-80' : 'w-12'}`}>
          <div className="h-full flex flex-col">
            <div className="h-10 border-b border-white/5 flex items-center justify-between px-3">
              <button
                onClick={() => setObserverOpen(o => !o)}
                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition"
                title={observerOpen ? 'Collapse observer' : 'Expand observer'}
              >
                <Sparkles size={14} className="text-purple-300" />
                {observerOpen && <span>Observer</span>}
              </button>
              {observerOpen && (
                <div className={`px-2 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${
                  isConnected ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                }`}>
                  {isConnected ? 'Connected (WS)' : 'Serverless (REST)'}
                </div>
              )}
            </div>

            {observerOpen && (
              <>
                <div className="p-3 border-b border-white/5">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Session tools</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        const ok = window.confirm('End interview and clear local session state?')
                        if (!ok) return
                        clearSession()
                        router.push('/interview/new')
                      }}
                      className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-black uppercase tracking-widest transition"
                    >
                      End
                    </button>
                    <button
                      onClick={() => setObserverNotes([])}
                      className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-black uppercase tracking-widest transition"
                    >
                      Clear log
                    </button>
                  </div>
                  {typingStatus && (
                    <div className="mt-3 text-[10px] text-slate-400 font-bold">
                      Typing: <span className="text-white">{typingStatus}</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-dark">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Live notes</p>
                  {observerNotes.length === 0 ? (
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                      <p className="text-xs text-slate-400 font-semibold italic">
                        No observer notes yet. You’ll see silent grader + websocket feedback here.
                      </p>
                    </div>
                  ) : (
                    observerNotes
                      .slice()
                      .reverse()
                      .map((n, idx) => (
                        <div key={`${n.at}-${idx}`} className="bg-slate-900 border border-white/5 rounded-2xl p-3">
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">
                            {new Date(n.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          <div className="markdown prose prose-invert prose-sm max-w-none prose-p:leading-snug prose-code:text-brand">
                            <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                              {n.text}
                            </ReactMarkdown>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </>
            )}
          </div>
        </aside>

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
                { label: 'Decision', value: scorecard.hire_decision, color: scorecard.hire_decision.includes('No') ? 'text-red-500' : 'text-green-500' }
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
                { label: 'Logic & Code', ...scorecard.logic, icon: Layout },
                { label: 'Optimization', ...scorecard.optimization, icon: Trophy }
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
                onClick={() => {
                  // Clear everything except config to trigger a new question generation
                  localStorage.removeItem('curr_interview_code')
                  localStorage.removeItem('curr_interview_msgs')
                  localStorage.removeItem('curr_interview_problem')
                  localStorage.removeItem('curr_interview_taskNum')
                  window.location.reload()
                }}
                className="flex-1 py-4 rounded-2xl bg-brand hover:bg-brand-dark text-sm font-bold text-white transition shadow-lg shadow-brand/20"
              >
                Start Next Challenge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
