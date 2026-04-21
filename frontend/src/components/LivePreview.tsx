interface LivePreviewProps {
  foreground: string
  background: string
}

export default function LivePreview({ foreground, background }: LivePreviewProps) {
  return (
    <div
      className="rounded-2xl p-6 shadow-sm border border-gray-100 h-full relative overflow-hidden"
      style={{ backgroundColor: background }}
    >
      <p
        className="text-[10px] font-semibold tracking-widest uppercase absolute top-4 right-5 opacity-40"
        style={{ color: foreground }}
      >
        Live Preview
      </p>

      <div className="mt-6">
        <h2
          className="text-2xl font-display font-bold leading-tight mb-3"
          style={{ color: foreground }}
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
