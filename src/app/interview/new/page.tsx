'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, Suspense } from 'react'
import Button from '@/components/Button'
import FormGroup from '@/components/FormGroup'
import { ChevronLeft } from 'lucide-react'

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
      <div className="min-h-screen bg-white flex items-center justify-center p-6 text-sm text-slate-600">
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
  const [language,        setLanguage]    = useState('cpp')
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
      const res = await fetch('/api/interview/create', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic:        selectedTopics[0],
          difficulty,
          style,
          timer,
          language,
          customPrompt: customPrompt || undefined,
        }),
      })

      const data = await res.json()
      if (data.question && data.sessionId) {
        const sessionId = data.sessionId

        // Clear old session persistence from storage
        localStorage.removeItem('curr_interview_code')
        localStorage.removeItem('curr_interview_msgs')
        localStorage.removeItem('curr_interview_problem')
        localStorage.removeItem('curr_interview_taskNum')
        localStorage.setItem('interview_sessionId', sessionId)

        localStorage.setItem('interview_config', JSON.stringify({
          topics: selectedTopics,
          difficulty,
          style,
          timer,
          language,
          current_question: data.question,
        }))
        router.push('/interview/play')
      } else {
        throw new Error(data.error || 'Failed to initialize session')
      }
    } catch (err: any) {
      setStarting(false)
      alert(err.message || 'Failed to generate interview problem.')
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl">

        <div className="mb-10">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-sm text-slate-600 hover:text-slate-900 mb-6 flex items-center gap-1.5 transition font-semibold"
          >
            <ChevronLeft size={16} /> Back to Dashboard
          </button>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Mock Interview</h1>
          <p className="text-base text-slate-600">Select your focus area and interviewer style to begin.</p>
        </div>

        <div className="card shadow-lg p-8 space-y-8">

          {/* Topic Selection */}
          <FormGroup label="Technical Domain" required>
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

          {/* Difficulty Selection */}
          <FormGroup label="Difficulty Level">
            <div className="grid grid-cols-2 gap-3">
              {DIFFS.map(d => (
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

          {/* Language & Style Selection */}
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

            <FormGroup label="Interviewer Style">
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

          {/* Time Pressure */}
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

          {/* Session Summary */}
          <div className="bg-slate-50 rounded-lg px-4 py-3 text-sm border border-slate-200">
            <span className="font-bold text-slate-900">Interview: </span>
            <span className="text-slate-700">
              {selectedTopics.length === 0 ? (
                <span className="text-slate-500">Select a technical domain</span>
              ) : (
                <>
                  {selectedTopics.join(', ')} · {difficulty} difficulty · {style} style · {language}
                </>
              )}
            </span>
          </div>

          {/* CTA Button */}
          <Button
            onClick={handleStart}
            disabled={starting || selectedTopics.length === 0}
            isLoading={starting}
            variant="primary"
            size="lg"
            className="w-full"
          >
            {starting ? 'Connecting to interviewer...' : 'Enter Virtual Room'}
          </Button>

        </div>
      </div>
    </div>
  )
}
