import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Link from 'next/link'
import { Zap, Brain } from 'lucide-react'
import Navbar from '@/components/Navbar'

// ── Inline SVG Icons ──────────────────────────────────────────
function IconArrow() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M2 7h10M7 2l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function IconBolt() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M8 1L3 8h4l-1 5 6-7H8L8 1z" fill="currentColor"/>
    </svg>
  )
}

function IconCheck() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <path d="M2 6.5l3.5 3.5L11 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function IconCode() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M5 4L1 8l4 4M11 4l4 4-4 4M9 2l-2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function IconBrain() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M6 2C4.3 2 3 3.3 3 5c0 .4.1.8.2 1.1C2.5 6.5 2 7.2 2 8c0 1.1.9 2 2 2v1.5C4 12.9 5.1 14 6.5 14H8M10 2c1.7 0 3 1.3 3 3 0 .4-.1.8-.2 1.1.7.4 1.2 1.1 1.2 1.9 0 1.1-.9 2-2 2v1.5C12 12.9 10.9 14 9.5 14H8M8 14V8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function IconChart() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2 13l4-5 3 3 5-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="2" cy="13" r="1.2" fill="currentColor"/>
      <circle cx="6" cy="8" r="1.2" fill="currentColor"/>
      <circle cx="9" cy="11" r="1.2" fill="currentColor"/>
      <circle cx="14" cy="4" r="1.2" fill="currentColor"/>
    </svg>
  )
}

function IconTarget() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3"/>
      <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.3"/>
      <circle cx="8" cy="8" r="1" fill="currentColor"/>
    </svg>
  )
}

function IconStar() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="currentColor">
      <path d="M6.5 1l1.5 3.2L11.5 5l-2.5 2.4.6 3.4-3.1-1.6-3.1 1.6.6-3.4L1.5 5l3.5-.8L6.5 1z"/>
    </svg>
  )
}

// ── Types ─────────────────────────────────────────────────────
interface StatItemProps {
  value: string
  label: string
}

interface FeatureCardProps {
  icon: React.ReactNode
  badge: string
  title: string
  description: string
  accent: 'blue' | 'green' | 'amber' | 'purple'
}

interface CompareRowProps {
  feature: string
  iteratr: boolean | string
  others: boolean | string
}

// ── Sub-components ────────────────────────────────────────────
function StatItem({ value, label }: StatItemProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-2xl font-bold text-slate-900 leading-none">
        {value}
      </span>
      <span className="text-xs font-medium text-slate-600">
        {label}
      </span>
    </div>
  )
}

function FeatureCard({ icon, badge, title, description, accent }: FeatureCardProps) {
  const accentMap = {
    blue: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      color: 'text-blue-600',
      badge: 'badge-blue',
    },
    green: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      color: 'text-green-600',
      badge: 'badge-green',
    },
    amber: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      color: 'text-amber-600',
      badge: 'badge-amber',
    },
    purple: {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      color: 'text-purple-600',
      badge: 'badge-purple',
    },
  }

  const a = accentMap[accent]

  return (
    <div className={`rounded-lg border ${a.border} ${a.bg} p-7 flex flex-col gap-4 transition-all duration-200 hover:shadow-md`}>
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0 ${a.color}`}>
          {icon}
        </div>
        <span className={`${a.badge} text-xs font-semibold uppercase tracking-wider`}>
          {badge}
        </span>
      </div>
      <div>
        <h3 className={`text-lg font-bold ${a.color} mb-2`}>
          {title}
        </h3>
        <p className="text-sm text-slate-700 leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  )
}

function CompareRow({ feature, iteratr, others }: CompareRowProps) {
  return (
    <div className="grid grid-cols-3 py-3 px-0 border-b border-slate-200 items-center gap-3">
      <span className="text-sm text-slate-700">
        {feature}
      </span>
      <div className="flex justify-center">
        {typeof iteratr === 'boolean' ? (
          <span className={`flex items-center justify-center w-6 h-6 rounded-full ${
            iteratr ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
          }`}>
            {iteratr ? <IconCheck /> : <span className="text-sm">—</span>}
          </span>
        ) : (
          <span className="text-xs font-medium text-green-600">
            {iteratr}
          </span>
        )}
      </div>
      <div className="flex justify-center">
        {typeof others === 'boolean' ? (
          <span className={`flex items-center justify-center w-6 h-6 rounded-full ${
            others ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
          }`}>
            {others ? <IconCheck /> : <span className="text-sm">—</span>}
          </span>
        ) : (
          <span className="text-xs font-medium text-slate-600">
            {others}
          </span>
        )}
      </div>
    </div>
  )
}

// ── Mock Terminal Card ────────────────────────────────────────
function TerminalCard() {
  const lines = [
    { type: 'system', text: '↳ iteratr session started · arrays · Elo 1380' },
    { type: 'question', text: 'Q: Reverse a linked list in-place. What\'s the optimal space complexity?' },
    { type: 'user', text: 'def reverse(head): return head[::-1]' },
    { type: 'hint', text: '⟳  Hint L1: A linked list isn\'t a Python list — it has no slice operator. Think about what "in-place" means for pointer manipulation.' },
    { type: 'user', text: 'prev, curr = None, head\nwhile curr:\n  nxt = curr.next\n  curr.next = prev\n  prev, curr = curr, nxt\nreturn prev' },
    { type: 'success', text: '✓  Correct · O(1) space · +14 Elo · 1394 total' },
  ]

  const colorMap: Record<string, string> = {
    system: 'text-slate-500',
    question: 'text-slate-400',
    user: 'text-blue-300',
    hint: 'text-amber-400',
    success: 'text-green-400',
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-900 overflow-hidden font-mono">
      {/* Window chrome */}
      <div className="px-4 py-3 border-b border-slate-700 flex items-center gap-2 bg-slate-950">
        <span className="w-2.5 h-2.5 rounded-full bg-red-500 block"/>
        <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 block"/>
        <span className="w-2.5 h-2.5 rounded-full bg-green-500 block"/>
        <span className="flex-1 text-center text-xs text-slate-600">iteratr session</span>
      </div>

      {/* Lines */}
      <div className="p-5 flex flex-col gap-3">
        {lines.map((line, i) => (
          <div key={i} className="flex gap-2.5 items-start">
            <span className="text-slate-700 text-xs select-none flex-shrink-0 pt-0.5">
              {String(i + 1).padStart(2, '0')}
            </span>
            <pre className={`text-xs leading-relaxed whitespace-pre-wrap break-words ${colorMap[line.type]} ${
              line.type === 'user' ? 'font-normal' : 'font-light'
            }`}>
              {line.text}
            </pre>
          </div>
        ))}

        {/* Cursor blink */}
        <div className="flex gap-2.5 items-center">
          <span className="text-slate-700 text-xs">07</span>
          <span className="inline-block w-2 h-4 bg-blue-500 rounded-sm animate-pulse"/>
        </div>
      </div>
    </div>
  )
}

// ── Elo Ring Widget ───────────────────────────────────────────
function EloRing({ value, label, pct, color }: { value: string; label: string; pct: number; color: string }) {
  const r = 28
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ

  const colorClasses = {
    '#3b82f6': 'text-blue-500',
    '#10b981': 'text-green-500',
    '#f59e0b': 'text-amber-500',
    '#8b5cf6': 'text-purple-500',
  }

  const textColor = colorClasses[color as keyof typeof colorClasses] || 'text-blue-500'

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative w-20 h-20">
        <svg width="80" height="80" viewBox="0 0 72 72" className="-rotate-90">
          <circle cx="36" cy="36" r={r} fill="none" stroke="rgb(203 213 225 / 0.3)" strokeWidth="4"/>
          <circle
            cx="36"
            cy="36"
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="4"
            strokeDasharray={`${dash} ${circ}`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center font-bold text-sm text-slate-900">
          {value}
        </div>
      </div>
      <span className="text-xs font-medium text-slate-600 uppercase tracking-wide">
        {label}
      </span>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────
export default async function LandingPage() {
  const session = await getServerSession(authOptions)
  const cta = session ? '/dashboard' : '/login'

  const features: FeatureCardProps[] = [
    {
      icon: <IconBolt />,
      badge: 'Elo Engine',
      accent: 'blue',
      title: 'Live difficulty that tracks you',
      description: 'Every question has an Elo rating. Nail a hard one fast — your rating climbs. Fumble an easy one — it drops. The next question always meets you exactly where you are.',
    },
    {
      icon: <IconBrain />,
      badge: 'Socratic AI',
      accent: 'green',
      title: 'Never told you\'re wrong',
      description: 'Four hint levels, each calibrated to close your specific gap. Level 1 challenges your reasoning. Level 4 walks you through it fully. No cheap copy-paste answers.',
    },
    {
      icon: <IconTarget />,
      badge: 'Gap Detector',
      accent: 'amber',
      title: 'Knows your weak spots',
      description: 'Fail three questions in a subtopic? The system flags it as a weak zone, routes you foundational drills, and notifies you before the next session. No blind spots.',
    },
    {
      icon: <IconChart />,
      badge: 'Mock Interviews',
      accent: 'purple',
      title: 'Real interview pressure',
      description: 'A live AI interviewer asks follow-ups, challenges your complexity analysis, and runs alongside a silent grader tracking your communication score in real time.',
    },
  ]

  const compareRows: CompareRowProps[] = [
    { feature: 'Adaptive difficulty (Elo)', iteratr: true, others: false },
    { feature: 'Personalized AI hints', iteratr: '4 levels', others: 'None or generic' },
    { feature: 'Code execution & grading', iteratr: true, others: true },
    { feature: 'Mock AI interviews', iteratr: true, others: false },
    { feature: 'Knowledge gap detection', iteratr: true, others: false },
    { feature: 'Shareable public profile', iteratr: true, others: 'Basic' },
    { feature: 'Long-term AI memory', iteratr: true, others: false },
  ]

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* NAVBAR */}
      <Navbar session={session} cta={cta} />

      {/* HERO */}
      <section className="relative overflow-hidden pt-36 pb-24 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left */}
          <div className="animate-fadeIn">
            {/* Tag */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-200 bg-blue-50 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
                ADAPTIVE ENGINE · LIVE
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl lg:text-6xl font-bold leading-tight text-slate-900 mb-6">
              Code. Fail.<br />
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent">
                Understand why.
              </span><br />
              Improve.
            </h1>

            {/* Sub */}
            <p className="text-lg text-slate-700 max-w-md mb-8 leading-relaxed">
              The first coding mentor that <em className="font-semibold not-italic text-slate-800">never gives you the answer</em>. Socratic hints, live Elo tracking, and an AI that knows your exact weak spots.
            </p>

            {/* CTA */}
            <div className="flex flex-wrap items-center gap-3 mb-12">
              <Link
                href={cta}
                className="btn-primary px-6 py-3 text-base inline-flex items-center gap-2"
              >
                {session ? 'Go to dashboard' : 'Start for free'}
                <IconArrow />
              </Link>
              <Link
                href="#features"
                className="btn-ghost px-6 py-3 text-base inline-flex items-center gap-2"
              >
                See how it works
              </Link>
            </div>

            {/* Highlights */}
            <div className="flex flex-wrap gap-8 pt-8 border-t border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100/80 shadow-sm">
                  <Zap className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900 text-sm">Elo Tracking</div>
                  <div className="text-xs text-slate-500">Live difficulty mapping</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center text-green-600 border border-green-100/80 shadow-sm">
                  <Brain className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900 text-sm">Socratic Hints</div>
                  <div className="text-xs text-slate-500">Guiding you to the answer</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right — Terminal */}
          <div className="animate-fadeIn">
            <TerminalCard />
            {/* Floating Elo rings */}
            <div className="mt-4 rounded-lg border border-slate-200 bg-white p-6 flex justify-around items-center">
              <EloRing value="1394" label="Your Elo" pct={58} color="#3b82f6" />
              <EloRing value="91%" label="Accuracy" pct={91} color="#10b981" />
              <EloRing value="12d" label="Streak" pct={48} color="#f59e0b" />
              <EloRing value="47" label="Solved" pct={47} color="#8b5cf6" />
            </div>
          </div>
        </div>
      </section>

      {/* LOGOS / SOCIAL PROOF */}
      <div className="border-y border-slate-200 bg-slate-50 py-4 px-6">
        <div className="max-w-6xl mx-auto flex items-center gap-4 flex-wrap justify-center">
          <span className="text-xs font-semibold text-slate-600 uppercase tracking-widest whitespace-nowrap">
            PREP FOR INTERVIEWS AT
          </span>
          {['Google', 'Meta', 'Amazon', 'Stripe', 'Airbnb', 'Microsoft', 'Apple'].map(name => (
            <span key={name} className="text-sm font-medium text-slate-600">
              {name}
            </span>
          ))}
        </div>
      </div>

      {/* FEATURES */}
      <section id="features" className="py-24 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-4">
            WHAT MAKES IT DIFFERENT
          </p>
          <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 leading-tight">
            Built to make you think,<br />not just pass tests.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {features.map((f, i) => (
            <FeatureCard key={i} {...f} />
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-20 px-6 bg-slate-50 border-t border-slate-200">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-green-600 uppercase tracking-widest mb-4">
              THE LOOP
            </p>
            <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 leading-tight">
              One deliberate loop,<br />repeated until it sticks.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-1 bg-slate-300 rounded-lg overflow-hidden">
            {[
              { num: '01', title: 'Attempt', desc: 'You get a question matched exactly to your Elo. Write code. Answer MCQ. Order the steps.', color: 'text-blue-600' },
              { num: '02', title: 'Struggle', desc: 'No answer handed out. If stuck, request a hint — but it only closes your specific gap, not the whole problem.', color: 'text-amber-600' },
              { num: '03', title: 'Understand', desc: 'After solving (or hitting hint 4), the full reasoning is revealed. The AI writes your weak-zone note.', color: 'text-purple-600' },
              { num: '04', title: 'Improve', desc: 'Your Elo shifts. Weak zones are routed. The next question arrives harder or easier accordingly.', color: 'text-green-600' },
            ].map((step, i) => (
              <div key={i} className="bg-white p-8">
                <div className={`text-xs font-semibold uppercase tracking-wider mb-4 ${step.color}`}>
                  {step.num}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">
                  {step.title}
                </h3>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMPARE TABLE */}
      <section className="py-24 px-6 max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-xs font-semibold text-amber-600 uppercase tracking-widest mb-4">
            VS EVERYONE ELSE
          </p>
          <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 leading-tight">
            LeetCode teaches you answers.<br />iteratr teaches you thinking.
          </h2>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white">
          {/* Header */}
          <div className="grid grid-cols-3 px-8 py-4 border-b border-slate-200 mb-2">
            <span className="text-xs font-semibold text-slate-600 uppercase">Feature</span>
            <span className="text-xs font-semibold text-blue-600 uppercase text-center">iteratr</span>
            <span className="text-xs font-semibold text-slate-600 uppercase text-center">Others</span>
          </div>

          <div className="px-8">
            {compareRows.map((row, i) => (
              <CompareRow key={i} {...row} />
            ))}
          </div>
          <div className="h-6" />
        </div>
      </section>

      {/* QUESTION TYPES */}
      <section className="py-20 px-6 bg-slate-50 border-t border-slate-200">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-purple-600 uppercase tracking-widest mb-4">
              QUESTION FORMATS
            </p>
            <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 leading-tight">
              Four ways to prove you know it.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { type: 'MCQ', label: 'Multiple Choice', desc: 'Distractors built from real misconceptions, not random noise.' },
              { type: 'Fill', label: 'Fill the Blank', desc: 'The blank always targets the conceptual gap, not syntax trivia.' },
              { type: 'Code', label: 'Code Space', desc: 'Real execution against hidden test cases. Edge cases included.' },
              { type: 'Order', label: 'Drag to Order', desc: 'Sequence algorithms and system flows step by step.' },
            ].map(q => (
              <div key={q.type} className="rounded-lg border border-slate-200 bg-white p-6">
                <div className="text-2xl font-bold text-blue-600 mb-3">
                  {q.type}
                </div>
                <h4 className="text-lg font-bold text-slate-900 mb-2">
                  {q.label}
                </h4>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {q.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-24 px-6 max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-4">
            PRICING
          </p>
          <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 leading-tight">
            Free until you&apos;re serious.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Free */}
          <div className="rounded-lg border border-slate-200 bg-white p-8">
            <p className="text-xs font-semibold text-slate-600 uppercase mb-6">Free</p>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-4xl font-bold text-slate-900">$0</span>
              <span className="text-sm text-slate-600">/month</span>
            </div>
            <p className="text-sm text-slate-700 mb-8">Get started, build the habit.</p>
            <div className="flex flex-col gap-3 mb-8">
              {['5 questions per day', 'MCQ + Fill only', 'Level 1 hints', '1 mock interview / month'].map(f => (
                <div key={f} className="flex items-center gap-3">
                  <span className="text-green-600 flex-shrink-0"><IconCheck /></span>
                  <span className="text-sm text-slate-700">{f}</span>
                </div>
              ))}
            </div>
            <Link
              href={cta}
              className="btn-ghost px-4 py-2.5 text-sm block text-center"
            >
              Get started free
            </Link>
          </div>

          {/* Pro */}
          <div className="rounded-lg border-2 border-blue-500 bg-white p-8 relative">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500" />
            <div className="flex justify-between items-center mb-6">
              <p className="text-xs font-semibold text-blue-600 uppercase">Pro</p>
              <span className="text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full">
                Most popular
              </span>
            </div>
            <div className="flex items-baseline gap-3 mb-2 flex-wrap">
              <span className="text-4xl font-bold text-slate-900">$0</span>
              <span className="text-sm text-slate-600 line-through">$19</span>
              <span className="text-sm text-slate-600">/month</span>
            </div>
            <p className="text-sm text-slate-700 mb-4">When your interview is 2 weeks away.</p>
            <div className="inline-flex items-center gap-2 mb-6">
              <span className="text-xs font-semibold text-green-600 uppercase">
                Limited-time alpha offer
              </span>
              <span className="w-1 h-1 rounded-full bg-green-500" />
            </div>
            <div className="flex flex-col gap-3 mb-8">
              {[
                'Unlimited questions',
                'All 4 question types',
                'Full Code Space + execution',
                'All 4 hint levels',
                'Unlimited mock interviews',
                'Company mode (FAANG, startup)',
                'Long-term AI memory',
                'Shareable profile + Interview Ready badge',
              ].map(f => (
                <div key={f} className="flex items-center gap-3">
                  <span className="text-green-600 flex-shrink-0"><IconCheck /></span>
                  <span className="text-sm text-slate-700">{f}</span>
                </div>
              ))}
            </div>
            <Link
              href={cta}
              className="btn-primary px-6 py-3 text-base block text-center items-center justify-center gap-2"
            >
              Upgrade to Pro
            </Link>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-24 px-6 text-center relative overflow-hidden">
        <div className="max-w-3xl mx-auto relative z-10">
          <div className="flex justify-center gap-1.5 mb-6">
            {[...Array(5)].map((_, i) => (
              <span key={i} className="text-amber-500"><IconStar /></span>
            ))}
          </div>
          <h2 className="text-5xl lg:text-6xl font-bold text-slate-900 leading-tight mb-6">
            Stop practicing answers.<br />Start building judgment.
          </h2>
          <p className="text-lg text-slate-700 max-w-2xl mx-auto mb-8">
            Your next technical interview will test your thinking process, not your memorization. iteratr trains exactly that.
          </p>
          <Link
            href={cta}
            className="btn-primary px-6 py-3 text-base inline-flex items-center gap-2"
          >
            {session ? 'Continue training' : 'Start free — no card needed'}
            <IconArrow />
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 py-8 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3 flex-wrap">
          <span className="text-xl font-bold text-slate-600">
            itera<span className="text-slate-400">tr</span>
          </span>
          <span className="text-xs font-semibold text-slate-500 uppercase">
            CODE · FAIL · UNDERSTAND WHY · IMPROVE
          </span>
          <span className="text-xs text-slate-500">
            © {new Date().getFullYear()} iteratr.online
          </span>
        </div>
      </footer>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out;
        }
      `}</style>
    </div>
  )
}
