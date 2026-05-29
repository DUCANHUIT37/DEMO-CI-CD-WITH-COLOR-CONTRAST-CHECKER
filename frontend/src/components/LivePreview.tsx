interface LivePreviewProps {
  foreground: string
  background: string
}

export default function LivePreview({ foreground, background }: LivePreviewProps) {
  return (
    <div
      className="rounded-2xl p-6 h-full relative overflow-hidden aurora-border"
      style={{
        backgroundColor: background,
        boxShadow: '0 4px 24px rgba(139, 92, 246, 0.08), 0 1px 4px rgba(0,0,0,0.04)',
      }}
    >
      {/* Inner subtle aurora reflection */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 60%)',
        }}
        aria-hidden
      />

      <p
        className="text-[10px] font-semibold tracking-widest uppercase absolute top-4 right-5 opacity-50"
        style={{ color: foreground }}
      >
        Live Preview
      </p>

      <div className="mt-6">
        <h2
          className="text-2xl font-bold leading-tight mb-3"
          style={{ color: foreground, fontFamily: "'Space Grotesk', sans-serif" }}
        >
          The Lucid Precision
        </h2>
        <p
          className="text-sm leading-relaxed mb-5 opacity-80"
          style={{ color: foreground }}
        >
          High-end digital editorial design focused on tonal depth and visual
          weightlessness. Structure is defined by background shifts rather than
          rigid lines.
        </p>
        <button
          className="px-5 py-2.5 rounded-xl text-sm font-medium border-2 transition-opacity hover:opacity-80"
          style={{
            color: foreground,
            borderColor: foreground,
            backgroundColor: 'transparent',
          }}
        >
          Action Button
        </button>
      </div>
    </div>
  )
}
