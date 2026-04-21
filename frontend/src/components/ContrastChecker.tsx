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
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex-1">
      <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center mb-4 text-blue-500">
        {icon}
      </div>
      <h3 className="font-semibold text-gray-800 mb-1.5">{title}</h3>
      <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
    </div>
  )
}

export default function ContrastChecker() {
  const [fg, setFg] = useState(DEFAULT_FG)
  const [bg, setBg] = useState(DEFAULT_BG)
  const [result, setResult] = useState<ContrastResult | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    const apiBase = 'http://localhost:3001'

    const fetchContrast = async () => {
      try {
        const response = await fetch(`${apiBase}/api/contrast`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            foreground: fg,
            background: bg,
          }),
          signal: controller.signal,
        })

        if (!response.ok) {
          setResult(null)
          return
        }

        const data = (await response.json()) as ContrastResult
        setResult(data)
      } catch {
        // Ignore abort/network errors and just clear current result.
        setResult(null)
      }
    }

    fetchContrast()

    return () => controller.abort()
  }, [fg, bg])

  const badgeColor =
    result?.level === 'AAA'
      ? 'bg-amber-400 text-amber-900'
      : result?.level === 'AA'
      ? 'bg-blue-100 text-blue-700'
      : 'bg-red-100 text-red-600'

  const badgeLabel =
    result?.level === 'AAA'
      ? 'WCAG AAA PASS'
      : result?.level === 'AA'
      ? 'WCAG AA PASS'
      : 'WCAG FAIL'

  const [whole, decimal] = result ? result.ratioFormatted.split('.') : ['—', '—']

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Header */}
      <header
        className="w-full py-5 text-center shadow-md"
        style={{
          background: 'linear-gradient(90deg,rgb(194, 228, 255) 0%,rgb(59, 154, 250) 100%)',
        }}
      >
        <h1 className="text-white text-xl font-[1000] tracking-[0.25em] uppercase">
          MHHCHECKER
        </h1>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10">
        {/* Contrast Ratio Hero */}
        <section className="text-center mb-10">
          <p className="text-xl font-semibold tracking-[0.3em] uppercase text-gray-400 mb-2">
            Contrast Ratio
          </p>
          <div className="flex items-end justify-center leading-none mb-5">
            <span
              className="font-display font-bold text-gray-900"
              style={{ fontSize: 'clamp(64px, 12vw, 110px)' }}
            >
              {whole}.{decimal}
            </span>
            <span className="text-2xl text-gray-400 font-light mb-3 ml-1">:1</span>
          </div>
          <span
            className={`inline-block px-5 py-2 rounded-full text-xs font-bold tracking-widest uppercase ${badgeColor}`}
          >
            {badgeLabel}
          </span>
        </section>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Left: Color Pickers */}
          <div>
            <ColorPicker
              label="Foreground Color"
              icon="foreground"
              color={fg}
              onChange={setFg}
            />
            <ColorPicker
              label="Background Color"
              icon="background"
              color={bg}
              onChange={setBg}
            />
          </div>

          {/* Right: Live Preview + WCAG Results */}
          <div className="flex flex-col gap-4">
            <LivePreview foreground={fg} background={bg} />
            <WCAGResults result={result} />
          </div>
        </div>

        {/* Feature Cards */}
        <div className="flex flex-col md:flex-row gap-4 mt-8">
          <FeatureCard
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
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
            }
            title="Tonal Depth"
            description="No structural lines, only elegant background shifts to maintain a weightless aesthetic."
          />
        </div>
      </main>

      <footer className="text-center py-8 text-xs text-gray-400 tracking-widest uppercase">
        © 2026 MHHCHECKER LAB 
      </footer>
    </div>
  )
}
