import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Link from 'next/link'

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
      <span style={{
        fontFamily: "'Syne', sans-serif",
        fontSize: '28px',
        fontWeight: 700,
        letterSpacing: '-0.03em',
        color: '#f0f0f8',
        lineHeight: 1,
      }}>{value}</span>
      <span style={{ fontSize: '12px', color: '#8e94b3', fontWeight: 500, letterSpacing: '0.02em' }}>{label}</span>
    </div>
  )
}

function FeatureCard({ icon, badge, title, description, accent }: FeatureCardProps) {
  const accents = {
    blue:   { bg: 'rgba(79,107,255,0.1)',  border: 'rgba(79,107,255,0.2)',  color: '#7b96ff', dot: '#4f6bff' },
    green:  { bg: 'rgba(34,214,139,0.08)', border: 'rgba(34,214,139,0.18)', color: '#22d68b', dot: '#22d68b' },
    amber:  { bg: 'rgba(245,166,35,0.08)', border: 'rgba(245,166,35,0.2)',  color: '#f5a623', dot: '#f5a623' },
    purple: { bg: 'rgba(168,85,247,0.08)', border: 'rgba(168,85,247,0.2)',  color: '#c084fc', dot: '#a855f7' },
  }
  const a = accents[accent]
  return (
    <div style={{
      background: '#0f1017',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: '20px',
      padding: '28px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      transition: 'border-color 0.2s',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: `linear-gradient(90deg, transparent, ${a.dot}44, transparent)` }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: '36px', height: '36px',
          background: a.bg,
          border: `1px solid ${a.border}`,
          borderRadius: '10px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: a.color,
          flexShrink: 0,
        }}>{icon}</div>
        <span style={{
          fontSize: '11px', fontWeight: 500, letterSpacing: '0.1em',
          textTransform: 'uppercase', color: a.color,
          background: a.bg, border: `1px solid ${a.border}`,
          padding: '3px 8px', borderRadius: '20px',
        }}>{badge}</span>
      </div>
      <div>
        <h3 style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: '18px', fontWeight: 700,
          color: '#f0f0f8', marginBottom: '8px',
          letterSpacing: '-0.02em',
        }}>{title}</h3>
        <p style={{ fontSize: '14px', color: '#9aa2c2', lineHeight: 1.65, fontWeight: 400 }}>{description}</p>
      </div>
    </div>
  )
}

function CompareRow({ feature, iteratr, others }: CompareRowProps) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
      padding: '14px 0',
      borderBottom: '1px solid rgba(255,255,255,0.05)',
      alignItems: 'center', gap: '12px',
    }}>
      <span style={{ fontSize: '14px', color: '#a7aec9', fontWeight: 400 }}>{feature}</span>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        {typeof iteratr === 'boolean' ? (
          <span style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '24px', height: '24px', borderRadius: '50%',
            background: iteratr ? 'rgba(34,214,139,0.12)' : 'rgba(255,80,80,0.1)',
            color: iteratr ? '#22d68b' : '#ff5050',
          }}>
            {iteratr ? <IconCheck /> : <span style={{ fontSize: '14px', lineHeight: 1 }}>—</span>}
          </span>
        ) : (
          <span style={{ fontSize: '13px', color: '#22d68b', fontWeight: 500 }}>{iteratr}</span>
        )}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        {typeof others === 'boolean' ? (
          <span style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '24px', height: '24px', borderRadius: '50%',
            background: others ? 'rgba(34,214,139,0.12)' : 'rgba(255,80,80,0.1)',
            color: others ? '#22d68b' : '#ff5050',
          }}>
            {others ? <IconCheck /> : <span style={{ fontSize: '14px', lineHeight: 1 }}>—</span>}
          </span>
        ) : (
          <span style={{ fontSize: '13px', color: '#a7aec9', fontWeight: 500 }}>{others}</span>
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
  const colors: Record<string, string> = {
    system: '#555770',
    question: '#8b8fa8',
    user: '#c8ccff',
    hint: '#f5a623',
    success: '#22d68b',
  }
  return (
    <div style={{
      background: '#0a0b10',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '20px',
      overflow: 'hidden',
      fontFamily: "'DM Mono', monospace",
    }}>
      {/* Window chrome */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', gap: '8px',
        background: '#0d0e14',
      }}>
        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ff5f56', display: 'block' }}/>
        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#febc2e', display: 'block' }}/>
        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#28c840', display: 'block' }}/>
        <span style={{ flex: 1, textAlign: 'center', fontSize: '11px', color: '#3a3d52', letterSpacing: '0.08em' }}>iteratr session</span>
      </div>
      {/* Lines */}
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {lines.map((line, i) => (
          <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
            <span style={{ color: '#2a2d3e', fontSize: '12px', userSelect: 'none', flexShrink: 0, paddingTop: '1px' }}>{String(i + 1).padStart(2, '0')}</span>
            <pre style={{
              fontSize: '12px',
              color: colors[line.type],
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              lineHeight: 1.6,
              fontFamily: "'DM Mono', monospace",
              fontWeight: line.type === 'user' ? 400 : 300,
            }}>{line.text}</pre>
          </div>
        ))}
        {/* Cursor blink */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span style={{ color: '#2a2d3e', fontSize: '12px' }}>07</span>
          <span style={{
            display: 'inline-block', width: '8px', height: '16px',
            background: '#4f6bff', borderRadius: '2px',
            animation: 'blink 1.1s step-end infinite',
          }}/>
        </div>
      </div>
    </div>
  )
}

// ── Elo Ring Widget ───────────────────────────────────────────
function EloRing({ value, label, pct, color }: { value: string; label: string; pct: number; color: string }) {
  const r = 28, circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
      <div style={{ position: 'relative', width: '72px', height: '72px' }}>
        <svg width="72" height="72" viewBox="0 0 72 72" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="36" cy="36" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4"/>
          <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="4"
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"/>
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: "'Syne', sans-serif", fontSize: '14px', fontWeight: 700, color: '#f0f0f8',
        }}>{value}</div>
      </div>
      <span style={{ fontSize: '11px', color: '#7f86a7', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</span>
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
    { feature: 'Adaptive difficulty (Elo)', iteratr: true,          others: false },
    { feature: 'Personalized AI hints',     iteratr: '4 levels',    others: 'None or generic' },
    { feature: 'Code execution & grading',  iteratr: true,          others: true },
    { feature: 'Mock AI interviews',        iteratr: true,          others: false },
    { feature: 'Knowledge gap detection',   iteratr: true,          others: false },
    { feature: 'Shareable public profile',  iteratr: true,          others: 'Basic' },
    { feature: 'Long-term AI memory',       iteratr: true,          others: false },
  ]

  return (
    <>
      {/* ── Google Fonts ──────────────────────────────────────── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Mono:ital,wght@0,300;0,400;0,500;1,300&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap');

        :root {
          --bg: #08090d;
        }

        * {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          text-rendering: optimizeLegibility;
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }

        @keyframes slide-up {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @keyframes fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        @keyframes pulse-glow {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }

        .hero-tag { animation: slide-up 0.6s ease both; animation-delay: 0.1s; }
        .hero-h1  { animation: slide-up 0.7s ease both; animation-delay: 0.2s; }
        .hero-sub { animation: slide-up 0.7s ease both; animation-delay: 0.3s; }
        .hero-cta { animation: slide-up 0.7s ease both; animation-delay: 0.4s; }
        .hero-stats { animation: slide-up 0.7s ease both; animation-delay: 0.5s; }
        .hero-card  { animation: slide-up 0.8s ease both; animation-delay: 0.45s; }

        .btn-primary:hover  { background: #6478ff !important; }
        .btn-ghost:hover    { border-color: rgba(255,255,255,0.2) !important; background: rgba(255,255,255,0.04) !important; }
        .feature-card:hover { border-color: rgba(255,255,255,0.13) !important; }
        .pricing-card:hover { border-color: rgba(255,255,255,0.14) !important; }
        .nav-link:hover     { color: #f0f0f8 !important; }
        .nav-shell { box-shadow: 0 10px 30px rgba(0,0,0,0.25); }
        .cta-headline { letter-spacing: -0.04em; }

        .hero-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 64px;
          align-items: center;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }

        .loop-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1px;
          background: rgba(255,255,255,0.06);
          border-radius: 20px;
          overflow: hidden;
        }

        .question-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
        }

        .pricing-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        @media (max-width: 1100px) {
          .hero-grid {
            grid-template-columns: 1fr;
            gap: 36px;
          }
        }

        @media (max-width: 900px) {
          .features-grid {
            grid-template-columns: 1fr;
          }

          .loop-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .question-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .pricing-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          .hero-stats {
            gap: 20px !important;
            flex-wrap: wrap;
          }

          .hero-sub {
            max-width: 100% !important;
          }

          .loop-grid {
            grid-template-columns: 1fr;
          }

          .question-grid {
            grid-template-columns: 1fr;
          }
        }

        .orb-1 {
          position: absolute;
          width: 800px; height: 800px;
          background: radial-gradient(circle, rgba(79,107,255,0.18) 0%, transparent 65%);
          border-radius: 50%;
          top: -300px; left: -200px;
          pointer-events: none;
          filter: blur(1px);
          animation: pulse-glow 8s ease-in-out infinite;
        }

        .orb-2 {
          position: absolute;
          width: 500px; height: 500px;
          background: radial-gradient(circle, rgba(34,214,139,0.1) 0%, transparent 65%);
          border-radius: 50%;
          top: 100px; right: -100px;
          pointer-events: none;
          animation: pulse-glow 12s ease-in-out infinite reverse;
        }

        .grid-bg {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
          background-size: 60px 60px;
          mask-image: radial-gradient(ellipse 80% 60% at 50% 0%, black 30%, transparent 100%);
          pointer-events: none;
        }
      `}</style>

      <div style={{ background: '#08090d', minHeight: '100vh', color: '#f0f0f8', fontFamily: "'DM Sans', sans-serif", overflowX: 'hidden' }}>

        {/* ── NAVBAR ─────────────────────────────────────────── */}
        <nav className="nav-shell" style={{
          position: 'sticky', top: 0, zIndex: 100,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(8,9,13,0.92)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        }}>
          <div style={{ maxWidth: '1160px', margin: '0 auto', padding: '0 24px', height: '62px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* Logo */}
            <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '9px',
                background: 'linear-gradient(135deg, #4f6bff 0%, #7b8dff 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <IconCode />
              </div>
              <span style={{ fontFamily: "'Syne', sans-serif", fontSize: '20px', fontWeight: 800, letterSpacing: '-0.04em', color: '#f0f0f8' }}>
                itera<span style={{ color: '#4f6bff' }}>tr</span>
              </span>
            </Link>

            {/* Links */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {!session && (
                <Link href="/login" className="nav-link btn-ghost" style={{
                  color: '#a0a6c0', textDecoration: 'none', fontSize: '14px', fontWeight: 500,
                  padding: '7px 14px', borderRadius: '10px',
                  border: '1px solid transparent',
                  transition: 'all 0.15s',
                }}>Sign in</Link>
              )}
              <Link href={cta} className="btn-primary" style={{
                textDecoration: 'none', fontSize: '14px', fontWeight: 500,
                padding: '8px 18px', borderRadius: '10px',
                background: 'linear-gradient(135deg, #4f6bff 0%, #6d83ff 100%)', color: '#fff',
                transition: 'background 0.15s',
                display: 'flex', alignItems: 'center', gap: '6px',
              }}>
                {session ? 'Dashboard' : 'Start free'}
                <IconArrow />
              </Link>
            </div>
          </div>
        </nav>

        {/* ── HERO ───────────────────────────────────────────── */}
        <section style={{ position: 'relative', overflow: 'hidden', paddingTop: '96px', paddingBottom: '80px' }}>
          <div className="grid-bg" />
          <div className="orb-1" />
          <div className="orb-2" />

          <div className="hero-grid" style={{ maxWidth: '1160px', margin: '0 auto', padding: '0 24px', position: 'relative' }}>

            {/* Left */}
            <div>
              {/* Tag */}
              <div className="hero-tag" style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '6px 12px', borderRadius: '20px',
                border: '1px solid rgba(79,107,255,0.3)',
                background: 'rgba(79,107,255,0.08)',
                marginBottom: '24px',
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22d68b', display: 'block', boxShadow: '0 0 6px #22d68b' }} />
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: '#7b96ff', letterSpacing: '0.1em' }}>ADAPTIVE ENGINE · LIVE</span>
              </div>

              {/* Headline */}
              <h1 className="hero-h1" style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: 'clamp(40px, 5vw, 60px)',
                fontWeight: 700,
                letterSpacing: '-0.04em',
                lineHeight: 1.02,
                color: '#f0f0f8',
                marginBottom: '20px',
              }}>
                Code. Fail.<br />
                <span style={{
                  background: 'linear-gradient(135deg, #4f6bff 0%, #a78bfa 50%, #38bdf8 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>Understand why.</span><br />
                Improve.
              </h1>

              {/* Sub */}
              <p className="hero-sub" style={{
                fontSize: '17px', lineHeight: 1.7,
                color: '#9299b8', fontWeight: 400,
                maxWidth: '440px', marginBottom: '36px',
              }}>
                The first coding mentor that <em style={{ color: '#8b8fa8', fontStyle: 'normal' }}>never gives you the answer</em>. Socratic hints, live Elo tracking, and an AI that knows your exact weak spots.
              </p>

              {/* CTA */}
              <div className="hero-cta" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '52px', flexWrap: 'wrap' }}>
                <Link href={cta} className="btn-primary" style={{
                  textDecoration: 'none', fontSize: '15px', fontWeight: 500,
                  padding: '13px 26px', borderRadius: '12px',
                  background: '#4f6bff', color: '#fff',
                  transition: 'background 0.15s',
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  letterSpacing: '-0.01em',
                }}>
                  {session ? 'Go to dashboard' : 'Start for free'}
                  <IconArrow />
                </Link>
                <Link href="#features" className="btn-ghost" style={{
                  textDecoration: 'none', fontSize: '15px', fontWeight: 400,
                  padding: '13px 22px', borderRadius: '12px', color: '#8b8fa8',
                  border: '1px solid rgba(255,255,255,0.1)',
                  transition: 'all 0.15s',
                }}>See how it works</Link>
              </div>

              {/* Stats */}
              <div className="hero-stats" style={{
                display: 'flex', gap: '36px',
                paddingTop: '32px',
                borderTop: '1px solid rgba(255,255,255,0.07)',
              }}>
                <StatItem value="Elo-based" label="adaptive difficulty" />
                <StatItem value="4-level" label="socratic hints" />
                <StatItem value="0 answers" label="handed out for free" />
              </div>
            </div>

            {/* Right — Terminal */}
            <div className="hero-card">
              <TerminalCard />
              {/* Floating Elo rings */}
              <div style={{
                marginTop: '16px',
                background: '#0f1017',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '16px',
                padding: '20px 24px',
                display: 'flex', justifyContent: 'space-around', alignItems: 'center',
              }}>
                <EloRing value="1394" label="Your Elo"    pct={58}  color="#4f6bff" />
                <EloRing value="91%"  label="Accuracy"   pct={91}  color="#22d68b" />
                <EloRing value="12d"  label="Streak"     pct={48}  color="#f5a623" />
                <EloRing value="47"   label="Solved"      pct={47}  color="#c084fc" />
              </div>
            </div>

          </div>
        </section>

        {/* ── LOGOS / SOCIAL PROOF ───────────────────────────── */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', background: '#0a0b10', padding: '18px 24px' }}>
          <div style={{ maxWidth: '1160px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: '#3a3d52', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>PREP FOR INTERVIEWS AT</span>
            {['Google', 'Meta', 'Amazon', 'Stripe', 'Airbnb', 'Microsoft', 'Apple'].map(name => (
              <span key={name} style={{ fontSize: '13px', fontWeight: 500, color: '#3a3d52', letterSpacing: '0.04em', padding: '0 12px' }}>{name}</span>
            ))}
          </div>
        </div>

        {/* ── FEATURES ───────────────────────────────────────── */}
        <section id="features" style={{ padding: '100px 24px', maxWidth: '1160px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: '#4f6bff', letterSpacing: '0.15em', marginBottom: '12px' }}>WHAT MAKES IT DIFFERENT</p>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, letterSpacing: '-0.04em', color: '#f0f0f8', lineHeight: 1.1 }}>
              Built to make you think,<br />not just pass tests.
            </h2>
          </div>

          <div className="features-grid">
            {features.map((f, i) => (
              <div key={i} className="feature-card">
                <FeatureCard {...f} />
              </div>
            ))}
          </div>
        </section>

        {/* ── HOW IT WORKS ───────────────────────────────────── */}
        <section style={{ padding: '80px 24px', background: '#0a0b10', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ maxWidth: '1160px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '56px' }}>
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: '#22d68b', letterSpacing: '0.15em', marginBottom: '12px' }}>THE LOOP</p>
              <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 'clamp(26px, 3.5vw, 40px)', fontWeight: 800, letterSpacing: '-0.04em', color: '#f0f0f8' }}>
                One deliberate loop,<br />repeated until it sticks.
              </h2>
            </div>

            <div className="loop-grid">
              {[
                { num: '01', title: 'Attempt', desc: 'You get a question matched exactly to your Elo. Write code. Answer MCQ. Order the steps.', color: '#4f6bff' },
                { num: '02', title: 'Struggle', desc: 'No answer handed out. If stuck, request a hint — but it only closes your specific gap, not the whole problem.', color: '#f5a623' },
                { num: '03', title: 'Understand', desc: 'After solving (or hitting hint 4), the full reasoning is revealed. The AI writes your weak-zone note.', color: '#c084fc' },
                { num: '04', title: 'Improve', desc: 'Your Elo shifts. Weak zones are routed. The next question arrives harder or easier accordingly.', color: '#22d68b' },
              ].map((step, i) => (
                <div key={i} style={{ background: '#0f1017', padding: '32px 24px' }}>
                  <div style={{
                    fontFamily: "'DM Mono', monospace", fontSize: '11px',
                    color: step.color, letterSpacing: '0.1em', marginBottom: '16px',
                  }}>{step.num}</div>
                  <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: '20px', fontWeight: 700, color: '#f0f0f8', marginBottom: '10px', letterSpacing: '-0.03em' }}>{step.title}</h3>
                  <p style={{ fontSize: '13px', color: '#9199ba', lineHeight: 1.6, fontWeight: 400 }}>{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── COMPARE TABLE ──────────────────────────────────── */}
        <section style={{ padding: '100px 24px', maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: '#f5a623', letterSpacing: '0.15em', marginBottom: '12px' }}>VS EVERYONE ELSE</p>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 'clamp(26px, 3.5vw, 40px)', fontWeight: 800, letterSpacing: '-0.04em', color: '#f0f0f8' }}>
              LeetCode teaches you answers.<br />iteratr teaches you thinking.
            </h2>
          </div>

          <div style={{ background: '#0f1017', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '0 32px', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', padding: '16px 0', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: '4px' }}>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: '#3a3d52', letterSpacing: '0.08em' }}>FEATURE</span>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: '#4f6bff', letterSpacing: '0.08em', textAlign: 'center' }}>ITERATR</span>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: '#3a3d52', letterSpacing: '0.08em', textAlign: 'center' }}>OTHERS</span>
            </div>
            {compareRows.map((row, i) => (
              <CompareRow key={i} {...row} />
            ))}
            <div style={{ height: '24px' }} />
          </div>
        </section>

        {/* ── QUESTION TYPES ─────────────────────────────────── */}
        <section style={{ padding: '80px 24px', background: '#0a0b10', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ maxWidth: '1160px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '52px' }}>
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: '#c084fc', letterSpacing: '0.15em', marginBottom: '12px' }}>QUESTION FORMATS</p>
              <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 'clamp(26px, 3.5vw, 40px)', fontWeight: 800, letterSpacing: '-0.04em', color: '#f0f0f8' }}>
                Four ways to prove you know it.
              </h2>
            </div>

            <div className="question-grid">
              {[
                { type: 'MCQ', label: 'Multiple Choice', desc: 'Distractors built from real misconceptions, not random noise.', color: '#4f6bff' },
                { type: 'Fill', label: 'Fill the Blank', desc: 'The blank always targets the conceptual gap, not syntax trivia.', color: '#22d68b' },
                { type: 'Code', label: 'Code Space', desc: 'Real execution against hidden test cases. Edge cases included.', color: '#f5a623' },
                { type: 'Order', label: 'Drag to Order', desc: 'Sequence algorithms and system flows step by step.', color: '#c084fc' },
              ].map(q => (
                <div key={q.type} style={{
                  background: '#0f1017', border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: '16px', padding: '24px 20px',
                }}>
                  <div style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: '22px', fontWeight: 400,
                    color: q.color, marginBottom: '14px', letterSpacing: '-0.02em',
                  }}>{q.type}</div>
                  <h4 style={{ fontFamily: "'Syne', sans-serif", fontSize: '15px', fontWeight: 700, color: '#f0f0f8', marginBottom: '8px' }}>{q.label}</h4>
                  <p style={{ fontSize: '13px', color: '#9199ba', lineHeight: 1.55, fontWeight: 400 }}>{q.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── PRICING ────────────────────────────────────────── */}
        <section style={{ padding: '100px 24px', maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: '#4f6bff', letterSpacing: '0.15em', marginBottom: '12px' }}>PRICING</p>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 'clamp(26px, 3.5vw, 40px)', fontWeight: 800, letterSpacing: '-0.04em', color: '#f0f0f8' }}>
              Free until you&apos;re serious.
            </h2>
          </div>

          <div className="pricing-grid">
            {/* Free */}
            <div className="pricing-card" style={{
              background: '#0f1017', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '20px', padding: '32px',
              transition: 'border-color 0.2s',
            }}>
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: '#7f86a7', letterSpacing: '0.1em', marginBottom: '20px' }}>FREE</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '8px' }}>
                <span style={{ fontFamily: "'Syne', sans-serif", fontSize: '40px', fontWeight: 800, color: '#f0f0f8', letterSpacing: '-0.05em' }}>$0</span>
                <span style={{ fontSize: '14px', color: '#8f97b6' }}>/month</span>
              </div>
              <p style={{ fontSize: '13px', color: '#9199ba', marginBottom: '28px', fontWeight: 400 }}>Get started, build the habit.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '28px' }}>
                {['5 questions per day', 'MCQ + Fill only', 'Level 1 hints', '1 mock interview / month'].map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ color: '#3a3d52', flexShrink: 0 }}><IconCheck /></span>
                    <span style={{ fontSize: '14px', color: '#a1a9c8', fontWeight: 400 }}>{f}</span>
                  </div>
                ))}
              </div>
              <Link href={cta} className="btn-ghost" style={{
                display: 'block', textAlign: 'center', textDecoration: 'none',
                fontSize: '14px', fontWeight: 500, padding: '11px',
                borderRadius: '10px', color: '#8b8fa8',
                border: '1px solid rgba(255,255,255,0.1)',
                transition: 'all 0.15s',
              }}>Get started free</Link>
            </div>

            {/* Pro */}
            <div className="pricing-card" style={{
              background: '#0f1017',
              border: '1px solid rgba(79,107,255,0.4)',
              borderRadius: '20px', padding: '32px',
              position: 'relative', overflow: 'hidden',
              transition: 'border-color 0.2s',
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, #4f6bff, #a78bfa)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: '#7b96ff', letterSpacing: '0.1em' }}>PRO</p>
                <span style={{ fontSize: '11px', fontWeight: 500, color: '#4f6bff', background: 'rgba(79,107,255,0.1)', border: '1px solid rgba(79,107,255,0.25)', padding: '3px 8px', borderRadius: '20px' }}>Most popular</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontFamily: "'Syne', sans-serif", fontSize: '40px', fontWeight: 800, color: '#f0f0f8', letterSpacing: '-0.05em' }}>$0</span>
                <span style={{ fontSize: '14px', color: '#8f97b6', textDecoration: 'line-through', opacity: 0.8 }}>$19</span>
                <span style={{ fontSize: '14px', color: '#8f97b6' }}>/month</span>
              </div>
              <p style={{ fontSize: '13px', color: '#9199ba', marginBottom: '12px', fontWeight: 400 }}>When your interview is 2 weeks away.</p>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', color: '#22d68b', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                  Limited-time alpha offer
                </span>
                <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#22d68b', boxShadow: '0 0 10px rgba(34,214,139,0.6)' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '28px' }}>
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
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ color: '#22d68b', flexShrink: 0 }}><IconCheck /></span>
                    <span style={{ fontSize: '14px', color: '#a7aec9', fontWeight: 400 }}>{f}</span>
                  </div>
                ))}
              </div>
              <Link href={cta} className="btn-primary" style={{
                display: 'block', textAlign: 'center', textDecoration: 'none',
                fontSize: '14px', fontWeight: 500, padding: '12px',
                borderRadius: '10px', color: '#fff',
                background: '#4f6bff',
                transition: 'background 0.15s',
              }}>Upgrade to Pro</Link>
            </div>
          </div>
        </section>

        {/* ── FINAL CTA ──────────────────────────────────────── */}
        <section style={{ padding: '80px 24px 100px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{
            position: 'absolute', width: '600px', height: '600px',
            background: 'radial-gradient(circle, rgba(79,107,255,0.12) 0%, transparent 60%)',
            borderRadius: '50%', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
          }} />
          <div style={{ position: 'relative' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              marginBottom: '20px',
            }}>
              {[...Array(5)].map((_, i) => (
                <span key={i} style={{ color: '#f5a623' }}><IconStar /></span>
              ))}
            </div>
            <h2 className="cta-headline" style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 'clamp(32px, 5vw, 56px)',
              fontWeight: 800, letterSpacing: '-0.05em',
              color: '#f0f0f8', lineHeight: 1.05,
              marginBottom: '16px',
            }}>
              Stop practicing answers.<br />Start building judgment.
            </h2>
            <p style={{ fontSize: '17px', color: '#aab1cc', fontWeight: 400, marginBottom: '40px', maxWidth: '560px', margin: '0 auto 40px' }}>
              Your next technical interview will test your thinking process, not your memorization. iteratr trains exactly that.
            </p>
            <Link href={cta} className="btn-primary" style={{
              textDecoration: 'none', fontSize: '16px', fontWeight: 500,
              padding: '15px 36px', borderRadius: '14px',
              background: '#4f6bff', color: '#fff',
              display: 'inline-flex', alignItems: 'center', gap: '10px',
              transition: 'background 0.15s',
              letterSpacing: '-0.01em',
            }}>
              {session ? 'Continue training' : 'Start free — no card needed'}
              <IconArrow />
            </Link>
          </div>
        </section>

        {/* ── FOOTER ─────────────────────────────────────────── */}
        <footer style={{
          borderTop: '1px solid rgba(255,255,255,0.06)',
          padding: '28px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: '12px',
          maxWidth: '1160px', margin: '0 auto',
        }}>
          <span style={{ fontFamily: "'Syne', sans-serif", fontSize: '16px', fontWeight: 800, letterSpacing: '-0.04em', color: '#3a3d52' }}>
            itera<span style={{ color: '#2a2d3e' }}>tr</span>
          </span>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: '#2a2d3e', letterSpacing: '0.08em' }}>
            CODE · FAIL · UNDERSTAND WHY · IMPROVE
          </span>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: '#2a2d3e', letterSpacing: '0.06em' }}>
            © {new Date().getFullYear()} iteratr.online
          </span>
        </footer>

      </div>
    </>
  )
}