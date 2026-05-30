import { useEffect, useState } from 'react'
import ColorPicker from './ColorPicker'
import LivePreview from './LivePreview'
import WCAGResults from './WCAGResults'
import type { ContrastResult } from '../utils/contrastCalculator'

const DEFAULT_FG = '#001D31'
const DEFAULT_BG = '#F7F9FB'

function FeatureCard({
  icon,
  title,
  description,
  delay = '0ms',
}: {
  icon: React.ReactNode
  title: string
  description: string
  delay?: string
}) {
  return (
    <div
      className="glass-card aurora-border rounded-2xl p-6 flex-1 animate-float-up"
      style={{ animationDelay: delay }}
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
        style={{
          background: 'linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(20,184,166,0.12) 100%)',
        }}
      >
        <span className="aurora-text">{icon}</span>
      </div>
      <h3 className="font-semibold text-gray-800 mb-1.5 font-[Space_Grotesk]">{title}</h3>
      <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
    </div>
  )
}

export default function ContrastChecker() {
  const [fg, setFg] = useState(DEFAULT_FG)
  const [bg, setBg] = useState(DEFAULT_BG)
  const [result, setResult] = useState<ContrastResult | null>(null)
  const [ratioKey, setRatioKey] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    const apiBase = import.meta.env.VITE_API_URL ?? ''

    const fetchContrast = async () => {
      try {
        const response = await fetch(`${apiBase}/api/contrast`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ foreground: fg, background: bg }),
          signal: controller.signal,
        })
        if (!response.ok) { setResult(null); return }
        const data = (await response.json()) as ContrastResult
        setResult(data)
        setRatioKey(k => k + 1)
      } catch {
        setResult(null)
      }
    }

    fetchContrast()
    return () => controller.abort()
  }, [fg, bg])

  // Badge config
  const badgeConfig =
    result?.level === 'AAA'
      ? { bg: 'from-emerald-500 via-green-500 to-teal-500', label: 'WCAG AAA ✦ PASS' }
      : result?.level === 'AA'
      ? { bg: 'from-green-400 via-teal-400 to-cyan-500', label: 'WCAG AA ✦ PASS' }
      : { bg: 'from-rose-400 via-pink-400 to-red-400', label: 'WCAG ✦ FAIL' }

  const [whole, decimal] = result ? result.ratioFormatted.split('.') : ['—', '—']

  return (
    <div className="min-h-screen relative overflow-hidden font-sans"
      style={{ background: 'linear-gradient(160deg, #f0fdf4 0%, #f0fdfa 35%, #f7fee7 65%, #ecfdf5 100%)' }}
    >
      {/* ── Aurora background orbs ── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div className="aurora-orb-1 absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full opacity-30"
          style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.35) 0%, rgba(34,197,94,0.15) 50%, transparent 70%)' }}
        />
        <div className="aurora-orb-2 absolute top-1/3 -right-60 w-[700px] h-[700px] rounded-full opacity-25"
          style={{ background: 'radial-gradient(circle, rgba(20,184,166,0.35) 0%, rgba(14,165,233,0.12) 50%, transparent 70%)' }}
        />
        <div className="aurora-orb-3 absolute -bottom-40 left-1/3 w-[500px] h-[500px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, rgba(132,204,22,0.28) 0%, rgba(16,185,129,0.12) 50%, transparent 70%)' }}
        />
        {/* subtle grid */}
        <div className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: 'linear-gradient(rgba(16,185,129,1) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* ── Header ── */}
      <header className="relative z-10 w-full py-5 text-center">
        <div className="glass-card mx-4 sm:mx-auto sm:max-w-xl rounded-2xl py-4 px-8 animate-float-up">
          <div className="flex items-center justify-center gap-3">
            {/* Prism icon */}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
              <defs>
                <linearGradient id="prism-g" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="50%" stopColor="#22c55e" />
                  <stop offset="100%" stopColor="#14b8a6" />
                </linearGradient>
              </defs>
              <path d="M12 2L2 19h20L12 2z" stroke="url(#prism-g)" strokeWidth="1.8" strokeLinejoin="round" fill="none"/>
              <path d="M12 2L7 19" stroke="rgba(16,185,129,0.4)" strokeWidth="1" />
              <path d="M12 2L17 19" stroke="rgba(20,184,166,0.4)" strokeWidth="1" />
            </svg>
            <h1 className="aurora-text text-lg font-[900] tracking-[0.3em] uppercase">
              MHHCHECKER
            </h1>
          </div>
          <p className="text-[10px] tracking-[0.2em] uppercase text-gray-400 mt-1">
            Color Contrast Intelligence
          </p>
        </div>
      </header>

      <main className="relative z-10 max-w-4xl mx-auto px-4 py-8">

        {/* ── Ratio hero ── */}
        <section className="text-center mb-10 animate-float-up" style={{ animationDelay: '100ms' }}>
          <p className="text-xs font-semibold tracking-[0.35em] uppercase text-gray-400 mb-4">
            Contrast Ratio
          </p>

          <div className="flex items-end justify-center leading-none mb-5">
            <span
              key={ratioKey}
              className="animate-ratio-pop aurora-text font-black"
              style={{ fontSize: 'clamp(72px, 13vw, 120px)', lineHeight: 1, fontFamily: "'Space Grotesk', sans-serif" }}
            >
              {whole}.{decimal}
            </span>
            <span className="text-2xl text-gray-400 font-light mb-4 ml-2">:1</span>
          </div>

          {result && (
            <span
              className={`animate-badge-glow inline-block px-6 py-2.5 rounded-full text-xs font-bold tracking-widest uppercase text-white bg-gradient-to-r ${badgeConfig.bg}`}
              style={{ boxShadow: '0 4px 20px rgba(16, 185, 129, 0.35)' }}
            >
              {badgeConfig.label}
            </span>
          )}
        </section>

        {/* ── Inputs + Preview ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 animate-float-up" style={{ animationDelay: '180ms' }}>
          <div>
            <ColorPicker label="Foreground Color" icon="foreground" color={fg} onChange={setFg} />
            <ColorPicker label="Background Color" icon="background" color={bg} onChange={setBg} />
          </div>

          <div className="flex flex-col gap-4">
            <LivePreview foreground={fg} background={bg} />
            <WCAGResults result={result} />
          </div>
        </div>

        {/* ── Feature cards ── */}
        <div className="flex flex-col md:flex-row gap-4 mt-8">
          <FeatureCard
            delay="260ms"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            }
            title="Editorial Clarity"
            description="Designed for visual accessibility experts who value precision and beauty in every pixel."
          />
          <FeatureCard
            delay="320ms"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            }
            title="Color Science"
            description="Real-time calculations based on WCAG 2.1 guidelines for reliable contrast verification."
          />
          <FeatureCard
            delay="380ms"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
            }
            title="Tonal Depth"
            description="No structural lines, only elegant aurora shifts to maintain a weightless aesthetic."
          />
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="relative z-10 text-center py-8">
        <p className="text-[10px] tracking-widest uppercase text-gray-400">
          © 2026 <span className="aurora-text font-semibold">MHHCHECKER LAB</span> · Color Contrast Intelligence
        </p>
      </footer>
    </div>
  )
}
