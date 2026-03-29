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
]

const STYLES = [
  { id: 'neutral',  label: 'Professional (Default)' },
  { id: 'friendly', label: 'Encouraging Mentor'    },
  { id: 'strict',   label: 'FAANG Hardcore'        },
]

const DIFFS = [
  { id: 'auto',   label: 'Adaptive',  desc: 'Matches your current rating' },
  { id: 'hard',   label: 'Challenging', desc: 'Push your limits'            },
]

const TIMERS = [
  { id: 'none', label: 'No timer'              },
  { id: 'soft', label: 'Soft (timer visible)'  },
  { id: 'hard', label: 'High pressure'         },
]

export default function InterviewNewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-sm text-slate-400">
        Preparing your interviewer...
      </div>
    }>
      <InterviewNewContent />
    </Suspense>
  )
}

function InterviewNewContent() {
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

    try {
      const res = await fetch('/api/questions/generate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic:        selectedTopics[0],
          customPrompt: customPrompt || undefined,
          language:     language,
          forceType:    'code'
        }),
      })

      const data = await res.json()
      if (data.question) {
        // Clear old session persistence
        sessionStorage.removeItem('curr_interview_code')
        sessionStorage.removeItem('curr_interview_msgs')

        sessionStorage.setItem('interview_config', JSON.stringify({
          topics: selectedTopics,
          difficulty,
          style,
          timer,
          language,
          current_question: data.question,
        }))
        router.push('/interview/play')
      } else {
        throw new Error('No question generated')
      }
    } catch (err) {
      setStarting(false)
      alert('Failed to generate interview problem.')
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-10 text-slate-200">
      <div className="w-full max-w-xl">

        <div className="mb-8">
          <button onClick={() => router.push('/dashboard')} className="text-sm text-slate-500 hover:text-white mb-4 flex items-center gap-1 transition">
            ← Dashboard
          </button>
          <h1 className="text-2xl font-bold text-white tracking-tight">Mock Interview Setup</h1>
          <p className="text-sm text-slate-400 mt-1">Select your focus area and interviewer style.</p>
        </div>

        <div className="bg-slate-900 border border-white/5 rounded-2xl p-6 space-y-6 shadow-2xl">
          
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 block">
              Topic
            </label>
            <div className="flex flex-wrap gap-2">
              {TOPICS.map(t => (
                <button
                  key={t.id}
                  onClick={() => toggleTopic(t.id)}
                  className={`text-sm px-4 py-1.5 rounded-full border transition font-medium ${
                    selectedTopics.includes(t.id)
                      ? 'bg-brand text-white border-brand shadow-lg shadow-brand/20'
                      : 'border-white/10 text-slate-400 hover:border-brand hover:text-brand bg-white/5'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 block">
              Difficulty
            </label>
            <div className="grid grid-cols-2 gap-2">
              {DIFFS.map(d => (
                <button
                  key={d.id}
                  onClick={() => setDifficulty(d.id)}
                  className={`text-left p-3 rounded-xl border transition ${
                    difficulty === d.id
                      ? 'border-brand bg-brand/10'
                      : 'border-white/10 hover:border-brand/50 bg-white/5'
                  }`}
                >
                  <p className={`text-sm font-bold ${difficulty === d.id ? 'text-brand' : 'text-slate-200'}`}>
                    {d.label}
                  </p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5 tracking-tight">{d.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">
                Language
              </label>
              <select
                value={language}
                onChange={e => setLanguage(e.target.value)}
                className="w-full border border-white/10 rounded-xl px-3 py-2 text-sm text-white bg-slate-950 focus:outline-none focus:border-brand"
              >
                <option value="python">Python 3.11</option>
                <option value="cpp">C++ 17</option>
                <option value="javascript">JavaScript</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">
                Interviewer style
              </label>
              <select
                value={style}
                onChange={e => setStyle(e.target.value)}
                className="w-full border border-white/10 rounded-xl px-3 py-2 text-sm text-white bg-slate-950 focus:outline-none focus:border-brand"
              >
                {STYLES.map(s => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 block">
              Time pressure
            </label>
            <div className="flex gap-2">
              {TIMERS.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTimer(t.id)}
                  className={`flex-1 text-sm py-2 px-3 rounded-xl border transition font-medium ${
                    timer === t.id
                      ? 'border-brand bg-brand/10 text-brand'
                      : 'border-white/10 text-slate-500 hover:border-brand bg-white/5'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-950 rounded-xl px-4 py-3 text-sm text-slate-400 border border-white/5">
            <span className="font-semibold text-white">Interview: </span>
            {selectedTopics.length === 0 ? 'Select a technical domain' : (
              <>
                {selectedTopics.join(', ')} · live session ·{' '}
                {style} interviewer · {language}
              </>
            )}
          </div>

          <button
            onClick={handleStart}
            disabled={starting || selectedTopics.length === 0}
            className="w-full bg-brand text-white font-bold py-3 rounded-xl hover:bg-brand-dark transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-brand/20"
          >
            {starting ? 'Connecting to interviewer...' : 'Enter Virtual Room →'}
          </button>

        </div>
      </div>
    </div>
  )
}
