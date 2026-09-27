import { useLayoutEffect, useMemo, useRef, useState } from 'react'

/**
 * Single-series line/area chart with a hover crosshair + tooltip.
 * points: [{ x: number, y: number }]; markers: [{ x, label }] vertical reference lines.
 */
export default function LineChart({
  points,
  height = 240,
  xFormat = String,
  yFormat = String,
  tooltip,
  markers = [],
  step = false,
  area = true,
  yMin,
  label,
}) {
  const wrap = useRef(null)
  const [width, setWidth] = useState(640)
  const [hover, setHover] = useState(null)

  // Measure before first paint, then follow container resizes.
  useLayoutEffect(() => {
    const el = wrap.current
    if (!el) return
    const fit = (w) => setWidth(Math.max(240, Math.floor(w)))
    fit(el.clientWidth)
    const ro = new ResizeObserver(([e]) => fit(e.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const pad = { l: 52, r: 16, t: 14, b: 28 }
  const iw = width - pad.l - pad.r
  const ih = height - pad.t - pad.b

  const { sx, sy, yTicks, xTicks, path, areaPath } = useMemo(() => {
    if (!points?.length) {
      const none = () => 0
      return { sx: none, sy: none, yTicks: [], xTicks: [], path: '', areaPath: '' }
    }
    const xs = points.map((p) => p.x)
    const ys = points.map((p) => p.y)
    const x0 = Math.min(...xs)
    const x1 = Math.max(...xs)
    const lo = yMin ?? Math.min(0, ...ys)
    const hi = Math.max(...ys) || 1
    const sx = (x) => pad.l + ((x - x0) / (x1 - x0 || 1)) * iw
    const sy = (y) => pad.t + ih - ((y - lo) / (hi - lo || 1)) * ih
    const nice = (v) => {
      const p = 10 ** Math.floor(Math.log10(v))
      return [1, 2, 2.5, 5, 10].map((m) => m * p).find((s) => s >= v)
    }
    const ystep = nice((hi - lo) / 4)
    const yTicks = []
    for (let v = Math.ceil(lo / ystep) * ystep; v <= hi + 1e-9; v += ystep) yTicks.push(v)
    const n = Math.max(2, Math.min(6, Math.floor(iw / 110)))
    const xTicks = Array.from({ length: n }, (_, i) => x0 + ((x1 - x0) * i) / (n - 1))
    let d = ''
    points.forEach((p, i) => {
      const X = sx(p.x)
      const Y = sy(p.y)
      if (i === 0) d += `M${X},${Y}`
      else if (step) d += `H${X}V${Y}`
      else d += `L${X},${Y}`
    })
    const areaPath = `${d}V${pad.t + ih}H${sx(points[0].x)}Z`
    return { sx, sy, yTicks, xTicks, path: d, areaPath }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points, width, height, step, yMin])

  // All hooks are above this line, so bailing out here is safe.
  if (!points?.length) return null

  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    const mx = ((e.clientX - r.left) / r.width) * width
    let best = null
    for (const p of points) {
      const d = Math.abs(sx(p.x) - mx)
      if (!best || d < best.d) best = { d, p }
    }
    setHover(best?.p ?? null)
  }

  const hx = hover ? sx(hover.x) : 0
  return (
    <div ref={wrap} className="relative w-full min-w-0 select-none" style={{ height }} role="img" aria-label={label}>
      <svg
        width={width}
        height={height}
        className="absolute inset-0 block overflow-visible"
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
      >
        {yTicks.map((v) => (
          <g key={v}>
            <line x1={pad.l} x2={width - pad.r} y1={sy(v)} y2={sy(v)} className="stroke-stone-200 dark:stroke-stone-800" />
            <text x={pad.l - 8} y={sy(v)} dy="0.32em" textAnchor="end" className="fill-stone-500 text-[11px] tabular-nums">
              {yFormat(v)}
            </text>
          </g>
        ))}
        {xTicks.map((v, i) => (
          <text
            key={i}
            x={sx(v)}
            y={height - 8}
            textAnchor={i === 0 ? 'start' : i === xTicks.length - 1 ? 'end' : 'middle'}
            className="fill-stone-500 text-[11px] tabular-nums"
          >
            {xFormat(v)}
          </text>
        ))}
        {area && <path d={areaPath} className="fill-ergo-500/10" />}
        <path d={path} fill="none" strokeWidth="2" strokeLinejoin="round" className="stroke-ergo-500" />
        {markers.map((m) => (
          <g key={m.label}>
            <line x1={sx(m.x)} x2={sx(m.x)} y1={pad.t} y2={pad.t + ih} strokeDasharray="4 3" className="stroke-stone-400 dark:stroke-stone-500" />
            <text x={sx(m.x) + 4} y={pad.t + 10} className="fill-stone-600 text-[11px] font-medium dark:fill-stone-300">
              {m.label}
            </text>
          </g>
        ))}
        {hover && (
          <g pointerEvents="none">
            <line x1={hx} x2={hx} y1={pad.t} y2={pad.t + ih} className="stroke-stone-400 dark:stroke-stone-500" />
            <circle cx={hx} cy={sy(hover.y)} r="5" strokeWidth="2" className="fill-ergo-500 stroke-white dark:stroke-stone-900" />
          </g>
        )}
        <rect x={pad.l} y={pad.t} width={iw} height={ih} fill="transparent" />
      </svg>
      {hover && (
        <div
          className="pointer-events-none absolute top-2 z-10 rounded-lg border border-stone-200 bg-surface px-3 py-2 text-xs shadow-lg dark:border-stone-700 dark:bg-stone-900"
          style={hx > width / 2 ? { right: width - hx + 12 } : { left: hx + 12 }}
        >
          {tooltip ? tooltip(hover) : (
            <>
              <div className="text-stone-500">{xFormat(hover.x)}</div>
              <div className="font-semibold tabular-nums text-stone-900 dark:text-white">{yFormat(hover.y)}</div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
