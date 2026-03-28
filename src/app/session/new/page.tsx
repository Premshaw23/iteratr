'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, Suspense } from 'react'

const TOPICS = [
  { id: 'arrays',             label: 'Arrays'           },
  { id: 'trees',              label: 'Trees'            },
  { id: 'graphs',             label: 'Graphs'           },
  { id: 'dynamic_programming',label: 'Dyn. programming' },
  { id: 'linked_lists',       label: 'Linked lists'     },
  { id: 'system_design',      label: 'System design'    },
  { id: 'os_concepts',        label: 'OS concepts'      },
  { id: 'networking',         label: 'Networking'       },
]

const DIFFICULTIES = [
  { id: 'auto',      label: 'Auto (Elo-matched)',  desc: 'Adapts to your rating'     },
  { id: 'easy',      label: 'Easy warm-up',        desc: 'Below your current level'  },
  { id: 'hard',      label: 'Hard grind',          desc: 'Above your current level'  },
  { id: 'interview', label: 'Interview prep',      desc: 'Mixed challenge mode'      },
]

const STYLES = [
  { id: 'friendly', label: 'Friendly mentor'     },
  { id: 'neutral',  label: 'Neutral'             },
  { id: 'strict',   label: 'Strict FAANG style'  },
]

const TIMERS = [
  { id: 'none', label: 'No timer'              },
  { id: 'soft', label: 'Soft (timer visible)'  },
  { id: 'hard', label: 'Hard (affects Elo)'    },
]

export default function SessionNewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-surface flex items-center justify-center p-6 text-sm text-mid">
        Loading configurator...
      </div>
    }>
      <SessionNewContent />
    </Suspense>
  )
}

function SessionNewContent() {
  const { data: session, status } = useSession()
  const router   = useRouter()
  const params   = useSearchParams()

  const defaultTopic = params.get('topic') ?? 'arrays'

  const [selectedTopics,  setTopics]      = useState<string[]>([defaultTopic])
  const [difficulty,      setDifficulty]  = useState('auto')
  const [style,           setStyle]       = useState('neutral')
  const [timer,           setTimer]       = useState('none')
  const [language,        setLanguage]    = useState('python')
  const [customPrompt,    setCustomPrompt]= useState('')
  const [starting,        setStarting]    = useState(false)

  if (status === 'loading') return null
  if (!session) { router.push('/login'); return null }

  const toggleTopic = (id: string) => {
    setTopics(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    )
  }

  const handleStart = async () => {
    if (selectedTopics.length === 0) return
    setStarting(true)

    // Generate the first question immediately
    const res = await fetch('/api/questions/generate', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic:        selectedTopics[0],
        customPrompt: customPrompt || undefined,
        language:     language,
      }),
    })

    const data = await res.json()
    if (data.question) {
      // Store session config in sessionStorage for the question page
      sessionStorage.setItem('session_config', JSON.stringify({
        topics: selectedTopics,
        difficulty,
        style,
        timer,
        language,
        customPrompt,
        current_question: data.question,
        question_number:  1,
        total_questions:  5,
        hints_used:       0,
      }))
      router.push('/session/play')
    } else {
      setStarting(false)
      alert('Failed to generate question. Check your API key.')
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-xl">

        {/* Header */}
        <div className="mb-8">
          <button onClick={() => router.push('/dashboard')} className="text-sm text-muted hover:text-dark mb-4 flex items-center gap-1">
            ← Dashboard
          </button>
          <h1 className="text-2xl font-bold text-dark">Configure your session</h1>
          <p className="text-sm text-mid mt-1">Set the rules before you start.</p>
        </div>

        {/* Card */}
        <div className="bg-white border border-border rounded-2xl p-6 space-y-6">

          {/* Topics */}
          <div>
            <label className="text-xs font-semibold text-muted uppercase tracking-wider mb-3 block">
              Topic
            </label>
            <div className="flex flex-wrap gap-2">
              {TOPICS.map(t => (
                <button
                  key={t.id}
                  onClick={() => toggleTopic(t.id)}
                  className={`text-sm px-4 py-1.5 rounded-full border transition font-medium ${
                    selectedTopics.includes(t.id)
                      ? 'bg-brand text-white border-brand'
                      : 'border-border text-mid hover:border-brand hover:text-brand'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <label className="text-xs font-semibold text-muted uppercase tracking-wider mb-3 block">
              Difficulty
            </label>
            <div className="grid grid-cols-2 gap-2">
              {DIFFICULTIES.map(d => (
                <button
                  key={d.id}
                  onClick={() => setDifficulty(d.id)}
                  className={`text-left p-3 rounded-xl border transition ${
                    difficulty === d.id
                      ? 'border-brand bg-brand-light'
                      : 'border-border hover:border-brand'
                  }`}
                >
                  <p className={`text-sm font-medium ${difficulty === d.id ? 'text-brand' : 'text-dark'}`}>
                    {d.label}
                  </p>
                  <p className="text-xs text-muted mt-0.5">{d.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Language + Style in row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-muted uppercase tracking-wider mb-2 block">
                Language
              </label>
              <select
                value={language}
                onChange={e => setLanguage(e.target.value)}
                className="w-full border border-border rounded-xl px-3 py-2 text-sm text-dark bg-white focus:outline-none focus:border-brand"
              >
                <option value="python">Python 3.11</option>
                <option value="cpp">C++ 17</option>
                <option value="javascript">JavaScript</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted uppercase tracking-wider mb-2 block">
                Interviewer style
              </label>
              <select
                value={style}
                onChange={e => setStyle(e.target.value)}
                className="w-full border border-border rounded-xl px-3 py-2 text-sm text-dark bg-white focus:outline-none focus:border-brand"
              >
                {STYLES.map(s => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Timer */}
          <div>
            <label className="text-xs font-semibold text-muted uppercase tracking-wider mb-3 block">
              Time pressure
            </label>
            <div className="flex gap-2">
              {TIMERS.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTimer(t.id)}
                  className={`flex-1 text-sm py-2 px-3 rounded-xl border transition font-medium ${
                    timer === t.id
                      ? 'border-brand bg-brand-light text-brand'
                      : 'border-border text-mid hover:border-brand'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom prompt */}
          <div>
            <label className="text-xs font-semibold text-muted uppercase tracking-wider mb-2 block">
              Custom prompt <span className="font-normal text-muted">(optional)</span>
            </label>
            <textarea
              value={customPrompt}
              onChange={e => setCustomPrompt(e.target.value)}
              placeholder='e.g. "I have a Google interview in 2 days. Be brutally honest, no hints unless I ask."'
              rows={2}
              className="w-full border border-border rounded-xl px-3 py-2.5 text-sm text-dark bg-white resize-none focus:outline-none focus:border-brand placeholder:text-muted"
            />
          </div>

          {/* Session preview */}
          <div className="bg-surface rounded-xl px-4 py-3 text-sm text-mid">
            <span className="font-semibold text-dark">Session: </span>
            {selectedTopics.length === 0 ? 'Select at least one topic' : (
              <>
                {selectedTopics.join(', ')} · {difficulty} difficulty ·{' '}
                {style} style · {language} · 5 questions
              </>
            )}
          </div>

          {/* Start button */}
          <button
            onClick={handleStart}
            disabled={starting || selectedTopics.length === 0}
            className="w-full bg-brand text-white font-semibold py-3 rounded-xl hover:bg-brand-dark transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {starting ? 'Generating question...' : 'Start session →'}
          </button>

        </div>
      </div>
    </div>
  )
}
