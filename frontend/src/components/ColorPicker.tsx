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
    } catch { /* silent */ }
  }

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        {icon === 'foreground' ? (
          <span className="text-blue-500 font-display text-lg font-bold italic">A</span>
        ) : (
          <span className="text-blue-400 font-display text-lg font-bold italic underline decoration-wavy">A</span>
        )}
        <span className="text-sm font-semibold text-gray-700 tracking-wide">{label}</span>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex items-center gap-4">
          {/* Color swatch — also acts as native color picker */}
          <label className="cursor-pointer flex-shrink-0">
            <div
              className="w-16 h-16 rounded-xl border border-gray-200 shadow-inner transition-transform hover:scale-105"
              style={{ backgroundColor: color }}
            />
            <input
              type="color"
              value={color}
              onChange={handleSwatchChange}
              className="sr-only"
            />
          </label>

          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold text-gray-400 tracking-widest uppercase mb-1">
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
                className="flex-1 font-mono text-sm font-medium text-gray-800 bg-transparent border-none outline-none tracking-wider"
                placeholder="#000000"
              />
              <button
                onClick={handleCopy}
                title="Copy hex"
                className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
              >
                {copied ? (
                  <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
            <div className="mt-2 h-px bg-gray-100" />
          </div>
        </div>
      </div>
    </div>
  )
}
