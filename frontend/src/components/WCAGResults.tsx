import type { ContrastResult } from '../utils/contrastCalculator'

interface WCAGResultsProps {
  result: ContrastResult | null
}

function Badge({ pass }: { pass: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full ${
        pass
          ? 'text-emerald-700 bg-emerald-50'
          : 'text-rose-600 bg-rose-50'
      }`}
    >
      {pass ? (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
          <path fillRule="evenodd" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5l-4.5-4.5 1.41-1.41L10 13.67l7.59-7.59L19 7.5l-9 9z" />
        </svg>
      ) : (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
          <path fillRule="evenodd" d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z" />
        </svg>
      )}
      {pass ? 'PASS' : 'FAIL'}
    </span>
  )
}

function ResultCard({ title, smallPass, largePass, accentFrom, accentTo }: {
  title: string
  smallPass: boolean
  largePass: boolean
  accentFrom: string
  accentTo: string
}) {
  return (
    <div className="glass-card aurora-border rounded-2xl p-4 flex-1">
      <p
        className="text-xs font-bold tracking-widest uppercase mb-3"
        style={{
          background: `linear-gradient(90deg, ${accentFrom}, ${accentTo})`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        {title}
      </p>
      <div className="space-y-2">
        <div className="flex items-center justify-between rounded-xl px-3 py-2"
          style={{ background: 'rgba(248, 247, 255, 0.8)' }}
        >
          <span className="text-sm text-gray-600 font-medium">Small Text</span>
          <Badge pass={smallPass} />
        </div>
        <div className="flex items-center justify-between rounded-xl px-3 py-2"
          style={{ background: 'rgba(248, 247, 255, 0.8)' }}
        >
          <span className="text-sm text-gray-600 font-medium">Large Text</span>
          <Badge pass={largePass} />
        </div>
      </div>
    </div>
  )
}

export default function WCAGResults({ result }: WCAGResultsProps) {
  if (!result) return null

  return (
    <div className="flex gap-3 mt-3">
      <ResultCard
        title="WCAG AA"
        smallPass={result.passesAA}
        largePass={result.passesAALarge}
        accentFrom="#10b981"
        accentTo="#14b8a6"
      />
      <ResultCard
        title="WCAG AAA"
        smallPass={result.passesAAA}
        largePass={result.passesAAALarge}
        accentFrom="#22c55e"
        accentTo="#84cc16"
      />
    </div>
  )
}
