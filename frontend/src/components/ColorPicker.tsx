import React, { useState } from 'react'

interface ColorPickerProps {
  label: string
  icon: 'foreground' | 'background'
  color: string
  onChange: (color: string) => void
}

const isValidHex = (hex: string) => /^#[0-9A-Fa-f]{6}$/.test(hex)

export default function ColorPicker({ label, icon, color, onChange }: ColorPickerProps) {
  const [inputValue, setInputValue] = useState(color)
  const [copied, setCopied] = useState(false)

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value
    if (!val.startsWith('#')) val = '#' + val
    setInputValue(val.toUpperCase())
    if (isValidHex(val)) onChange(val)
  }

  const handleSwatchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase()
    setInputValue(val)
    onChange(val)
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(color.toUpperCase())
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {}
  }

  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-2.5">
        {/* Aurora gradient label icon */}
        <span
          className="text-lg font-black italic select-none aurora-text"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          {icon === 'foreground' ? 'A' : <u style={{ textDecorationStyle: 'wavy' }}>A</u>}
        </span>
        <span className="text-sm font-semibold text-gray-600 tracking-wide">{label}</span>
      </div>

      <div className="glass-card aurora-border rounded-2xl p-4 transition-all duration-300">
        <div className="flex items-center gap-4">
          {/* Color swatch */}
          <label className="cursor-pointer flex-shrink-0 relative">
            <div
              className="w-16 h-16 rounded-xl swatch-ring transition-transform duration-200 hover:scale-105"
              style={{ backgroundColor: color }}
            />
            {/* Subtle inner reflection */}
            <div
              className="absolute inset-0 rounded-xl pointer-events-none"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, transparent 50%)',
              }}
            />
            <input
              type="color"
              value={color}
              onChange={handleSwatchChange}
              className="sr-only"
            />
          </label>

          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold tracking-widest uppercase mb-1"
              style={{
                background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Hex Code
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={handleInput}
                onBlur={() => setInputValue(color.toUpperCase())}
                maxLength={7}
                spellCheck={false}
                className="flex-1 font-mono text-sm font-semibold text-gray-700 bg-transparent border-none outline-none tracking-widest"
                placeholder="#000000"
              />
              <button
                onClick={handleCopy}
                title="Copy hex"
                className="p-1.5 rounded-lg text-gray-400 hover:text-violet-500 hover:bg-violet-50 transition-all duration-200"
              >
                {copied ? (
                  <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
            </div>
            <div className="mt-2 h-px" style={{
              background: 'linear-gradient(90deg, rgba(99,102,241,0.2), rgba(6,182,212,0.2), transparent)',
            }} />
          </div>
        </div>
      </div>
    </div>
  )
}
