'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, Suspense, useEffect } from 'react'
import Button from '@/components/Button'
import FormGroup from '@/components/FormGroup'

const TOPICS = [
  { id: 'arrays',             label: 'Arrays'           },
  { id: 'trees',              label: 'Trees'            },
  { id: 'graphs',             label: 'Graphs'           },
  { id: 'dynamic_programming',label: 'Dyn. programming' },
  { id: 'linked_lists',       label: 'Linked lists'     },
  { id: 'system_design',      label: 'System design'    },
  { id: 'os_concepts',        label: 'OS concepts'      },
  { id: 'networking',         label: 'Networking'       },
  { id: 'mixed',              label: 'Mixed / Weak Zones'},
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
      <div className="min-h-screen bg-white flex items-center justify-center p-6 text-sm text-slate-600">
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
  const modeParam = params.get('mode') ?? 'balanced'

  const defaultTopic = params.get('topic') ?? 'arrays'

  const [selectedTopics,  setTopics]      = useState<string[]>([defaultTopic])
  const [difficulty,      setDifficulty]  = useState('auto')
  const [style,           setStyle]       = useState('neutral')
  const [timer,           setTimer]       = useState('none')
  const [mode,            setMode]        = useState(modeParam)
  const [language,        setLanguage]    = useState('cpp')
  const [customPrompt,    setCustomPrompt]= useState('')
  const [starting,        setStarting]    = useState(false)
  const [weakZonesCount,  setWeakZonesCount] = useState(0)
  const [subtopics,       setSubtopics]   = useState<string[]>(params.get('subtopics')?.split(',').filter(Boolean) || [])

  // Auto-fill specialized prompt for weak zones
  useEffect(() => {
    const weakTopicsStr = params.get('topics')
    const subTopicsStr = params.get('subtopics')

    if (mode === 'weak_zones' && weakTopicsStr && !customPrompt) {
      const topicArray = weakTopicsStr.split(',').filter(Boolean)
      setTopics(topicArray.length > 0 ? topicArray : [defaultTopic])
      setDifficulty('easy')
      setStyle('strict')

      const displaySubtopics = subTopicsStr
        ? subTopicsStr.split(',').map((t, i) => `${i + 1}. ${t.replace(/\+/g, ' ')}`).join('\n')
        : topicArray.map((t, i) => `${i + 1}. ${t.replace(/_/g, ' ')}`).join('\n')

      setCustomPrompt(`Generate a weak-zone recovery session with focus on these specific weak areas:
${displaySubtopics}

Instructions:
- Give me highly relevant questions targeting these exact points
- Start from easy foundational level, then gradually increase difficulty
- Mix question types: conceptual and code
- Do NOT give direct answers immediately
- If I get something wrong, guide me Socratically with hints
- Focus on fixing conceptual misunderstandings, not just syntax
- Be like a strict but helpful senior engineer`)
    }
  }, [mode, params, customPrompt, defaultTopic])

  // Fetch weak zones to show in the mode button
  useEffect(() => {
    if (!session) return
    fetch('/api/user/stats')
      .then(res => res.json())
      .then(data => {
        const wz = data.filter((s: any) => s.is_weak_zone).length
        setWeakZonesCount(wz)
      })
  }, [session])

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
        subtopic:     subtopics.length > 0 ? subtopics[0] : undefined,
        customPrompt: customPrompt || undefined,
        language:     language,
      }),
    })

    const data = await res.json()
    if (data.question) {
      // Store session config in sessionStorage for the question page
      sessionStorage.setItem('session_config', JSON.stringify({
        topics: selectedTopics,
        subtopics,
        difficulty,
        style,
        timer,
        mode,
        language,
        customPrompt,
        current_question: data.question,
        question_number:  1,
        total_questions:  mode === 'weak_zones' ? 3 : mode === 'daily' ? 1 : 5,
        hints_used:       0,
      }))
      router.push('/session/play')
    } else {
      setStarting(false)
      alert('Failed to generate question. Check your API key.')
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl">

        {/* Header */}
        <div className="mb-10">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-sm text-slate-600 hover:text-slate-900 mb-6 flex items-center gap-1 font-medium transition"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Practice Session</h1>
          <p className="text-base text-slate-600">Configure your session and get started.</p>
        </div>

        {/* Card */}
        <div className="card shadow-lg p-8 space-y-8">

          {/* Topics */}
          <FormGroup label="Technical Topics">
            <div className="flex flex-wrap gap-3">
              {TOPICS.map(t => (
                <button
                  key={t.id}
                  onClick={() => toggleTopic(t.id)}
                  className={`text-sm px-4 py-2 rounded-lg border font-medium transition ${
                    selectedTopics.includes(t.id)
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                      : 'border-slate-300 text-slate-700 hover:border-blue-500 hover:text-blue-600 bg-white'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </FormGroup>

          {/* Difficulty */}
          <FormGroup label="Difficulty Level">
            <div className="grid grid-cols-2 gap-3">
              {DIFFICULTIES.map(d => (
                <button
                  key={d.id}
                  onClick={() => setDifficulty(d.id)}
                  className={`text-left p-4 rounded-lg border transition ${
                    difficulty === d.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-blue-300 bg-white'
                  }`}
                >
                  <p className={`text-sm font-bold ${difficulty === d.id ? 'text-blue-600' : 'text-slate-900'}`}>
                    {d.label}
                  </p>
                  <p className="text-xs text-slate-600 font-medium mt-1">{d.desc}</p>
                </button>
              ))}
            </div>
          </FormGroup>

          {/* Language + Style */}
          <div className="grid grid-cols-2 gap-6">
            <FormGroup label="Programming Language">
              <select
                value={language}
                onChange={e => setLanguage(e.target.value)}
                className="input"
              >
                <option value="python">Python 3.11</option>
                <option value="cpp">C++ 17</option>
                <option value="javascript">JavaScript</option>
              </select>
            </FormGroup>

            <FormGroup label="Mentor Style">
              <select
                value={style}
                onChange={e => setStyle(e.target.value)}
                className="input"
              >
                {STYLES.map(s => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </FormGroup>
          </div>

          {/* Timer */}
          <FormGroup label="Time Pressure">
            <div className="grid grid-cols-3 gap-3">
              {TIMERS.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTimer(t.id)}
                  className={`text-sm py-2.5 px-3 rounded-lg border font-medium transition ${
                    timer === t.id
                      ? 'border-blue-600 bg-blue-50 text-blue-600'
                      : 'border-slate-300 text-slate-700 hover:border-blue-400 bg-white'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </FormGroup>

          {/* Custom prompt */}
          <FormGroup label="Custom Prompt (Optional)" hint="Add specific instructions for your session">
            <textarea
              value={customPrompt}
              onChange={e => setCustomPrompt(e.target.value)}
              placeholder='e.g. "I have a Google interview in 2 days. Be brutally honest, no hints unless I ask."'
              rows={3}
              className="input resize-none"
            />
          </FormGroup>

          {/* Session mode toggle */}
          <FormGroup label="Session Mode">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setMode('balanced')}
                className={`text-sm py-3 px-4 rounded-lg border font-medium transition ${
                  mode === 'balanced'
                    ? 'border-blue-600 bg-blue-50 text-blue-600'
                    : 'border-slate-300 text-slate-700 hover:border-blue-400 bg-white'
                }`}
              >
                Balanced Session
              </button>
              <button
                onClick={() => setMode('weak_zones')}
                disabled={weakZonesCount === 0}
                className={`text-sm py-3 px-4 rounded-lg border font-medium transition ${
                  mode === 'weak_zones'
                    ? 'border-red-500 bg-red-50 text-red-600'
                    : 'border-slate-300 text-slate-700 hover:border-red-400 bg-white disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
              >
                Weak Zone Recovery {weakZonesCount > 0 ? `(${weakZonesCount})` : ''}
              </button>
            </div>
          </FormGroup>

          {/* Session preview */}
          <div className="bg-slate-50 rounded-lg px-4 py-3 text-sm border border-slate-200">
            <span className="font-bold text-slate-900">Session: </span>
            <span className="text-slate-700">
              {selectedTopics.length === 0 ? (
                <span className="text-slate-500">Select at least one topic</span>
              ) : (
                <>
                  {selectedTopics.join(', ')} · {difficulty} difficulty · {style} style · {language} · {mode === 'weak_zones' ? 3 : mode === 'daily' ? 1 : 5} questions
                </>
              )}
            </span>
          </div>

          {/* Start button */}
          <Button
            onClick={handleStart}
            disabled={starting || selectedTopics.length === 0}
            isLoading={starting}
            variant="primary"
            size="lg"
            className="w-full"
          >
            {starting ? 'Generating question...' : 'Start Session'}
          </Button>

        </div>
      </div>
    </div>
  )
}
