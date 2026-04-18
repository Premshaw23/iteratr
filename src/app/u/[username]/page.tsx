'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import MasteryRadar from '@/app/dashboard/mastery-radar'
import EloChart from '@/app/dashboard/elo-chart'
import { Trophy, Zap, Share2, ArrowRight, Calendar, Star } from 'lucide-react'
import Button from '@/components/Button'
import Card from '@/components/Card'

// --- Types ---
interface ProfileData {
  user: {
    id:              string
    display_name:    string
    avatar_url:      string
    elo_rating:      number
    streak_count:    number
    reflection:      string
    unlocked_badges: string[]
  }
  stats:   any[]
  history: any[]
  metrics?: {
    total_attempts:    number
    solved_count:      number
    fail_count:        number
    accuracy_percent:  number
    weak_zone_count:   number
  }
}

export default function PublicProfilePage() {
  const params = useParams()
  const router = useRouter()
  const username = (params.username as string) ?? ''
  const [data, setData]       = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied]   = useState(false)
  const [error, setError]     = useState<'not_found' | 'private' | null>(null)

  useEffect(() => {
    async function fetchProfile() {
      try {
        setError(null)
        const res = await fetch(`/api/u/${username}`)
        const json = await res.json()

        if (res.status === 404) {
          setError('not_found')
          setData(null)
          return
        }

        if (res.status === 403) {
          setError('private')
          setData(json)
          return
        }

        if (!res.ok) {
          setError('not_found')
          setData(null)
          return
        }

        setData(json)
      } catch (err) {
        console.error(err)
        setError('not_found')
        setData(null)
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [username])

  // Shareable link
  const copyLink = () => {
    const shareUrl = `${window.location.origin}/u/${username}`
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="flex items-center gap-3 text-slate-600">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="font-medium">Loading profile...</span>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-5xl font-bold text-slate-900 mb-3">
          {error === 'not_found' ? '404' : 'Profile Unavailable'}
        </h1>
        <p className="text-slate-600 mb-8 max-w-md">
          {error === 'not_found'
            ? 'This programmer hasn\'t created an iteratr profile yet.'
            : 'This iteratr profile is currently private.'}
        </p>
        <Button onClick={() => router.push('/')} variant="primary">
          Go Home
        </Button>
      </div>
    )
  }

  const { user, stats, history, metrics } = data
  user.unlocked_badges = Array.isArray(user.unlocked_badges) ? user.unlocked_badges : []

  const totalAttempts = metrics?.total_attempts ?? stats.reduce((acc: number, s: any) => acc + (s.solved_count ?? 0) + (s.fail_count ?? 0), 0)
  const solvedCount   = metrics?.solved_count ?? stats.reduce((acc: number, s: any) => acc + (s.solved_count ?? 0), 0)
  const accuracyPct   = metrics?.accuracy_percent ?? (totalAttempts === 0 ? 0 : Math.round((solvedCount / totalAttempts) * 100))

  const isInterviewReady = user.unlocked_badges.includes('interview_ready')

  return (
    <div className="min-h-screen bg-white pb-20">

      {/* Hero / Bio Section */}
      <div className="relative pt-24 pb-16 px-6 overflow-hidden border-b border-slate-200">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-[400px] bg-gradient-to-b from-blue-400/5 to-transparent blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10 flex flex-col items-center text-center">

          {/* Avatar */}
          <div className="relative mb-8">
            <div className={`relative w-32 h-32 rounded-2xl border-4 ${
              isInterviewReady ? 'border-blue-500 shadow-lg shadow-blue-500/20' : 'border-slate-300'
            } bg-slate-100 shadow-xl overflow-hidden`}>
              <Image
                src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.display_name}`}
                alt={user.display_name}
                width={128}
                height={128}
                unoptimized
                className="w-full h-full object-cover"
              />
            </div>
            {user.streak_count >= 5 && (
              <div className="absolute -bottom-2 -right-2 bg-amber-500 text-white p-2 rounded-lg shadow-lg border-2 border-white">
                <Zap className="w-5 h-5 fill-current" />
              </div>
            )}
          </div>

          {/* Name */}
          <h1 className="text-5xl font-bold text-slate-900 mb-3">{user.display_name}</h1>

          {/* Badge */}
          <div className="flex items-center gap-2 mb-6 px-4 py-2 bg-slate-100 rounded-full border border-slate-200 text-sm font-semibold text-slate-700">
            <Star className="w-4 h-4 text-blue-600" />
            Developer Portfolio · {user.elo_rating} Elo
          </div>

          {/* Badges Display */}
          <div className="flex gap-3 mb-8 flex-wrap justify-center">
            {user.unlocked_badges.map(b => (
              <div
                key={b}
                className="px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wide rounded-md border border-blue-200 flex items-center gap-1.5"
              >
                <Trophy size={11} />
                {b.replace(/_/g, ' ')}
              </div>
            ))}
            {user.unlocked_badges.length === 0 && (
              <div className="px-3 py-1.5 bg-slate-100 text-slate-600 text-xs font-bold uppercase rounded-md border border-slate-200">
                No badges yet
              </div>
            )}
          </div>

          {/* Reflection */}
          <p className="max-w-2xl text-lg text-slate-700 leading-relaxed italic mb-10">
            &quot;{user.reflection || 'Continuously learning and improving.'}&quot;
          </p>

          {/* CTA Buttons */}
          <div className="flex gap-4 flex-wrap justify-center">
            <Button
              onClick={copyLink}
              variant="secondary"
              size="lg"
            >
              <Share2 className="w-4 h-4" />
              {copied ? 'Copied!' : 'Share Profile'}
            </Button>
            <Button
              onClick={() => router.push('/login')}
              variant="primary"
              size="lg"
            >
              Start Training
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="max-w-6xl mx-auto px-6 -mt-8 mb-16 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Elo Rating', value: user.elo_rating.toLocaleString(), sub: 'technical score' },
            { label: 'Streak', value: `${user.streak_count}d`, sub: 'consecutive days' },
            { label: 'Solved', value: solvedCount.toLocaleString(), sub: 'questions' },
            { label: 'Accuracy', value: `${accuracyPct}%`, sub: `${totalAttempts.toLocaleString()} attempts` },
          ].map(card => (
            <Card key={card.label}>
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">{card.label}</p>
              <p className="text-2xl md:text-3xl font-bold text-slate-900 mb-1">{card.value}</p>
              <p className="text-xs text-slate-600 font-medium">{card.sub}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">

        {/* Radar & Mini Cards */}
        <div className="space-y-8">
          <Card>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-blue-100 rounded-lg">
                <Trophy className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Technical Mastery</h2>
            </div>
            <div className="h-96">
              <MasteryRadar stats={stats} />
            </div>
          </Card>

          {/* Mini Cards */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <p className="text-xs font-bold text-slate-600 uppercase mb-2">Peak Rating</p>
              <p className="text-3xl font-bold text-slate-900 mb-3">{user.elo_rating}</p>
              <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500"
                  style={{ width: `${Math.min(100, (user.elo_rating / 2500) * 100)}%` }}
                />
              </div>
            </Card>

            <Card>
              <p className="text-xs font-bold text-slate-600 uppercase mb-2">Streak</p>
              <p className="text-3xl font-bold text-amber-600 mb-3">{user.streak_count}d</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(i => (
                  <Zap
                    key={i}
                    className={`w-3.5 h-3.5 ${
                      i <= user.streak_count ? 'text-amber-500 fill-current' : 'text-slate-300'
                    }`}
                  />
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* Elo Trend Chart */}
        <Card>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-purple-100 rounded-lg">
              <Calendar className="w-5 h-5 text-purple-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Growth Velocity</h2>
          </div>
          <div className="h-96">
            <EloChart history={history} />
          </div>
        </Card>

      </div>

      {/* Footer */}
      <div className="max-w-6xl mx-auto px-6 text-center border-t border-slate-200 pt-12">
        <p className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-4">Verified by</p>
        <div className="inline-block px-6 py-3 bg-slate-50 border border-slate-200 rounded-lg">
          <span className="text-lg font-bold text-slate-900">iteratr</span>
          <span className="text-xs font-medium text-slate-600 ml-2">Adaptive AI Engine</span>
        </div>
      </div>

    </div>
  )
}
