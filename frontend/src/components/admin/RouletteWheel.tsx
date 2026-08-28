import { useState } from 'react'

export interface WheelItem {
  id: string
  label: string
  color?: string | null
}

// Colores de marca que se van alternando en los gajos.
const SEGMENT_COLORS = ['#0d3060', '#5a1f4d', '#99122f', '#1c4f8c', '#7c3a6b', '#c33b53']

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)]
}

/**
 * Ruleta visual. El padre controla el pool (`items`) y recibe el ganador en
 * `onResult` cuando la animación termina. Con un solo elemento no anima:
 * lo asigna directo (si no, no habría nada que sortear y quedaría trabado).
 */
export function RouletteWheel({
  items,
  disabled,
  onResult,
}: {
  items: WheelItem[]
  disabled?: boolean
  onResult: (item: WheelItem) => void
}) {
  const [rotation, setRotation] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const [pendingIndex, setPendingIndex] = useState<number | null>(null)

  const n = items.length
  const seg = n > 0 ? 360 / n : 360
  const size = 320
  const r = size / 2
  const canSpin = !disabled && !spinning && n >= 1

  function spin() {
    if (!canSpin) return
    if (n === 1) {
      onResult(items[0])
      return
    }
    const index = Math.floor(Math.random() * n)
    const turns = 6 + Math.floor(Math.random() * 4)
    // Rotación (mod 360) que deja el centro del gajo `index` arriba, en el puntero.
    const targetMod = (360 - (index * seg + seg / 2)) % 360
    const currentMod = ((rotation % 360) + 360) % 360
    let delta = targetMod - currentMod
    if (delta < 0) delta += 360
    setPendingIndex(index)
    setSpinning(true)
    setRotation(rotation + turns * 360 + delta)
  }

  function handleEnd() {
    if (!spinning) return
    setSpinning(false)
    if (pendingIndex != null) onResult(items[pendingIndex])
    setPendingIndex(null)
  }

  const fontSize = n > 12 ? 9 : n > 8 ? 11 : 13

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="relative" style={{ width: size, height: size }}>
        {/* puntero */}
        <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1">
          <div className="h-0 w-0 border-x-8 border-t-[14px] border-x-transparent border-t-tinta" />
        </div>

        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          onTransitionEnd={handleEnd}
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: spinning ? 'transform 4.6s cubic-bezier(0.16, 1, 0.3, 1)' : 'none',
          }}
          className="drop-shadow-md"
        >
          <circle cx={r} cy={r} r={r - 1} fill="#ffffff" stroke="#e5dfe0" />

          {n === 0 && (
            <text x={r} y={r} textAnchor="middle" dominantBaseline="middle" fill="#736e7b" fontSize={13}>
              Sin elementos
            </text>
          )}

          {n === 1 && (
            <>
              <circle cx={r} cy={r} r={r - 2} fill={items[0].color ?? SEGMENT_COLORS[0]} />
              <text
                x={r}
                y={r}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#ffffff"
                fontSize={15}
                fontWeight={700}
              >
                {items[0].label.length > 16 ? `${items[0].label.slice(0, 15)}…` : items[0].label}
              </text>
            </>
          )}

          {n >= 2 &&
            items.map((it, i) => {
              const a0 = i * seg
              const a1 = (i + 1) * seg
              const [x0, y0] = polar(r, r, r - 2, a0)
              const [x1, y1] = polar(r, r, r - 2, a1)
              const large = seg > 180 ? 1 : 0
              const mid = a0 + seg / 2
              const [tx, ty] = polar(r, r, r * 0.62, mid)
              return (
                <g key={it.id}>
                  <path
                    d={`M ${r} ${r} L ${x0} ${y0} A ${r - 2} ${r - 2} 0 ${large} 1 ${x1} ${y1} Z`}
                    fill={it.color ?? SEGMENT_COLORS[i % SEGMENT_COLORS.length]}
                  />
                  <text
                    x={tx}
                    y={ty}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#ffffff"
                    fontSize={fontSize}
                    fontWeight={700}
                    transform={`rotate(${mid} ${tx} ${ty})`}
                  >
                    {it.label.length > 14 ? `${it.label.slice(0, 13)}…` : it.label}
                  </text>
                </g>
              )
            })}

          <circle cx={r} cy={r} r={16} fill="#ffffff" stroke="#e5dfe0" />
        </svg>
      </div>

      <button
        type="button"
        onClick={spin}
        disabled={!canSpin}
        className="rounded-full bg-azul-600 px-8 py-3 text-sm font-bold text-white transition hover:bg-azul-500 disabled:opacity-50"
      >
        {spinning ? 'Girando…' : n === 1 ? 'Asignar el último' : 'Girar ruleta'}
      </button>
    </div>
  )
}
