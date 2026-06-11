import { useEffect, useMemo, useRef, useState } from 'react'
import Decimal from 'decimal.js'

type Point = {
  x: number
  y: number
}

type Viewport = {
  width: number
  height: number
  origin: Point
  scale: number
}

type MachinePose = {
  antennaA: Point
  antennaB: Point
  nose: Point
  center: Point
  heading: number
}

type OffsetInfo = {
  offsetX: number
  offsetY: number
  distance: number
  heading: number
  direction: string
  offsetXText: string
  offsetYText: string
  distanceText: string
  headingText: string
}

const targetPile: Point = { x: 148805.12, y: 191479.24 }
const baselineLength = 3.3288
const machineLength = 6.2

function createDesignPiles() {
  const piles: Point[] = []

  for (let row = -3; row <= 3; row += 1) {
    for (let col = -5; col <= 5; col += 1) {
      piles.push({
        x: targetPile.x + col * 5,
        y: targetPile.y + row * 5,
      })
    }
  }

  return piles
}

function worldToScreen(point: Point, view: Viewport): Point {
  return {
    x: (point.x - view.origin.x) * view.scale + view.width / 2,
    y: view.height / 2 - (point.y - view.origin.y) * view.scale,
  }
}

function normalizeHeading(heading: number) {
  return ((heading % 360) + 360) % 360
}

function getDirectionText(heading: number) {
  const directions = ['北', '东北', '东', '东南', '南', '西南', '西', '西北']
  const index = Math.round(normalizeHeading(heading) / 45) % directions.length

  return directions[index]
}

function headingToWorldVector(heading: number): Point {
  const headingRad = (normalizeHeading(heading) * Math.PI) / 180

  return {
    x: Math.sin(headingRad),
    y: Math.cos(headingRad),
  }
}

function getRightVectorFromHeading(heading: number): Point {
  const forward = headingToWorldVector(heading)

  return {
    x: forward.y,
    y: -forward.x,
  }
}

function formatDecimal(value: string | number, precision: number) {
  return new Decimal(String(value)).toDecimalPlaces(precision).toString()
}

function setupCanvas(canvas: HTMLCanvasElement, rect: DOMRect) {
  const dpr = window.devicePixelRatio || 1
  canvas.width = Math.round(rect.width * dpr)
  canvas.height = Math.round(rect.height * dpr)
  canvas.style.width = `${rect.width}px`
  canvas.style.height = `${rect.height}px`

  const context = canvas.getContext('2d')
  if (!context) return null

  context.setTransform(dpr, 0, 0, dpr, 0, 0)
  return context
}

function drawBaseLayer(
  canvas: HTMLCanvasElement,
  piles: Point[],
  target: Point,
  view: Viewport,
) {
  const context = canvas.getContext('2d')
  if (!context) return

  context.clearRect(0, 0, view.width, view.height)
  context.fillStyle = '#f8fafc'
  context.fillRect(0, 0, view.width, view.height)

  context.strokeStyle = 'rgba(148, 163, 184, 0.32)'
  context.lineWidth = 1

  for (let x = view.width / 2 % (5 * view.scale); x < view.width; x += 5 * view.scale) {
    context.beginPath()
    context.moveTo(x, 0)
    context.lineTo(x, view.height)
    context.stroke()
  }

  for (let y = view.height / 2 % (5 * view.scale); y < view.height; y += 5 * view.scale) {
    context.beginPath()
    context.moveTo(0, y)
    context.lineTo(view.width, y)
    context.stroke()
  }

  for (const pile of piles) {
    const screen = worldToScreen(pile, view)
    context.beginPath()
    context.arc(screen.x, screen.y, 3.5, 0, Math.PI * 2)
    context.fillStyle = '#0ea5e9'
    context.fill()
  }

  const targetScreen = worldToScreen(target, view)
  context.beginPath()
  context.arc(targetScreen.x, targetScreen.y, 7, 0, Math.PI * 2)
  context.fillStyle = '#f59e0b'
  context.fill()
  context.strokeStyle = '#92400e'
  context.lineWidth = 2
  context.stroke()

  context.fillStyle = '#475569'
  context.font = '12px ui-monospace, SFMono-Regular, Menlo, monospace'
  context.fillText('target pile', targetScreen.x + 10, targetScreen.y - 10)
}

function drawTrackLayer(
  canvas: HTMLCanvasElement,
  track: Point[],
  view: Viewport,
) {
  const context = canvas.getContext('2d')
  if (!context || track.length < 2) return

  const prev = worldToScreen(track[track.length - 2], view)
  const current = worldToScreen(track[track.length - 1], view)

  context.strokeStyle = 'rgba(22, 163, 74, 0.76)'
  context.lineWidth = 2
  context.beginPath()
  context.moveTo(prev.x, prev.y)
  context.lineTo(current.x, current.y)
  context.stroke()
}

function drawLiveLayer(
  canvas: HTMLCanvasElement,
  pose: MachinePose,
  target: Point,
  offset: OffsetInfo,
  view: Viewport,
) {
  const context = canvas.getContext('2d')
  if (!context) return

  context.clearRect(0, 0, view.width, view.height)

  const antennaA = worldToScreen(pose.antennaA, view)
  const antennaB = worldToScreen(pose.antennaB, view)
  const nose = worldToScreen(pose.nose, view)
  const center = worldToScreen(pose.center, view)
  const targetScreen = worldToScreen(target, view)

  context.fillStyle = 'rgba(245, 158, 11, 0.22)'
  context.strokeStyle = '#d97706'
  context.lineWidth = 2.5
  context.beginPath()
  context.moveTo(antennaA.x, antennaA.y)
  context.lineTo(antennaB.x, antennaB.y)
  context.lineTo(nose.x, nose.y)
  context.closePath()
  context.fill()
  context.stroke()

  context.strokeStyle = 'rgba(220, 38, 38, 0.86)'
  context.setLineDash([6, 5])
  context.beginPath()
  context.moveTo(targetScreen.x, targetScreen.y)
  context.lineTo(center.x, center.y)
  context.stroke()
  context.setLineDash([])

  context.fillStyle = '#dc2626'
  context.beginPath()
  context.arc(antennaA.x, antennaA.y, 5, 0, Math.PI * 2)
  context.fill()

  context.fillStyle = '#16a34a'
  context.beginPath()
  context.arc(antennaB.x, antennaB.y, 5, 0, Math.PI * 2)
  context.fill()

  context.fillStyle = '#111827'
  context.beginPath()
  context.arc(nose.x, nose.y, 4, 0, Math.PI * 2)
  context.fill()

  context.strokeStyle = '#111827'
  context.lineWidth = 2
  context.beginPath()
  context.moveTo(center.x, center.y)
  context.lineTo(nose.x, nose.y)
  context.stroke()

  context.fillStyle = '#334155'
  context.font = '12px ui-monospace, SFMono-Regular, Menlo, monospace'
  context.fillText(`offset ${offset.distanceText}m`, center.x + 10, center.y + 18)
  context.fillText(
    `${offset.headingText}deg ${offset.direction}`,
    center.x + 10,
    center.y + 34,
  )

  drawCompass(context, offset.heading, view)
}

function drawCompass(
  context: CanvasRenderingContext2D,
  heading: number,
  view: Viewport,
) {
  const radius = 42
  const center = {
    x: view.width - 76,
    y: 74,
  }
  const forward = headingToWorldVector(heading)
  const arrowEnd = {
    x: center.x + forward.x * (radius - 10),
    y: center.y - forward.y * (radius - 10),
  }

  context.save()
  context.fillStyle = 'rgba(255, 255, 255, 0.9)'
  context.strokeStyle = 'rgba(100, 116, 139, 0.45)'
  context.lineWidth = 1
  context.beginPath()
  context.arc(center.x, center.y, radius, 0, Math.PI * 2)
  context.fill()
  context.stroke()

  context.fillStyle = '#334155'
  context.font = 'bold 12px ui-monospace, SFMono-Regular, Menlo, monospace'
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.fillText('N', center.x, center.y - radius + 11)
  context.fillText('E', center.x + radius - 11, center.y)
  context.fillText('S', center.x, center.y + radius - 11)
  context.fillText('W', center.x - radius + 11, center.y)

  context.strokeStyle = '#d97706'
  context.fillStyle = '#d97706'
  context.lineWidth = 3
  context.beginPath()
  context.moveTo(center.x, center.y)
  context.lineTo(arrowEnd.x, arrowEnd.y)
  context.stroke()

  context.beginPath()
  context.arc(arrowEnd.x, arrowEnd.y, 4, 0, Math.PI * 2)
  context.fill()
  context.restore()
}

function createPose(tick: number): MachinePose {
  const offsetX = Math.sin(tick * 0.7) * 1.15 + Math.cos(tick * 0.2) * 0.35
  const offsetY = Math.cos(tick * 0.55) * 0.85 + Math.sin(tick * 0.31) * 0.25
  const heading = normalizeHeading(332 + Math.sin(tick * 0.4) * 14)
  const center = {
    x: targetPile.x + offsetX,
    y: targetPile.y + offsetY,
  }

  const axis = headingToWorldVector(heading)
  const cross = getRightVectorFromHeading(heading)

  return {
    center,
    heading,
    antennaA: {
      x: center.x - cross.x * baselineLength * 0.5,
      y: center.y - cross.y * baselineLength * 0.5,
    },
    antennaB: {
      x: center.x + cross.x * baselineLength * 0.5,
      y: center.y + cross.y * baselineLength * 0.5,
    },
    nose: {
      x: center.x + axis.x * machineLength,
      y: center.y + axis.y * machineLength,
    },
  }
}

function calcOffset(center: Point, target: Point, heading: number): OffsetInfo {
  const offsetXDecimal = new Decimal(String(center.x)).minus(String(target.x))
  const offsetYDecimal = new Decimal(String(center.y)).minus(String(target.y))
  const distanceDecimal = offsetXDecimal.pow(2).plus(offsetYDecimal.pow(2)).sqrt()
  const normalizedHeading = normalizeHeading(heading)
  const offsetX = offsetXDecimal.toNumber()
  const offsetY = offsetYDecimal.toNumber()

  return {
    offsetX,
    offsetY,
    distance: distanceDecimal.toNumber(),
    heading: normalizedHeading,
    direction: getDirectionText(heading),
    offsetXText: offsetXDecimal.toDecimalPlaces(2).toString(),
    offsetYText: offsetYDecimal.toDecimalPlaces(2).toString(),
    distanceText: distanceDecimal.toDecimalPlaces(2).toString(),
    headingText: formatDecimal(normalizedHeading, 1),
  }
}

export default function CanvasDemo() {
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const baseCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const trackCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const liveCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const viewRef = useRef<Viewport | null>(null)
  const trackRef = useRef<Point[]>([])
  const tickRef = useRef(0)
  const piles = useMemo(() => createDesignPiles(), [])
  const [offsetInfo, setOffsetInfo] = useState<OffsetInfo>({
    offsetX: 0,
    offsetY: 0,
    distance: 0,
    heading: 0,
    direction: '北',
    offsetXText: '0',
    offsetYText: '0',
    distanceText: '0',
    headingText: '0',
  })

  useEffect(() => {
    const wrapper = wrapperRef.current
    const baseCanvas = baseCanvasRef.current
    const trackCanvas = trackCanvasRef.current
    const liveCanvas = liveCanvasRef.current

    if (!wrapper || !baseCanvas || !trackCanvas || !liveCanvas) return undefined

    const resize = () => {
      const rect = wrapper.getBoundingClientRect()
      const width = rect.width
      const height = rect.height
      const scale = Math.min(width / 70, height / 48)
      const view: Viewport = {
        width,
        height,
        origin: targetPile,
        scale,
      }

      viewRef.current = view
      setupCanvas(baseCanvas, rect)
      setupCanvas(trackCanvas, rect)
      setupCanvas(liveCanvas, rect)
      drawBaseLayer(baseCanvas, piles, targetPile, view)
      trackCanvas.getContext('2d')?.clearRect(0, 0, view.width, view.height)
      trackRef.current = []
    }

    resize()

    const observer = new ResizeObserver(resize)
    observer.observe(wrapper)

    return () => observer.disconnect()
  }, [piles])

  useEffect(() => {
    const timer = window.setInterval(() => {
      const liveCanvas = liveCanvasRef.current
      const trackCanvas = trackCanvasRef.current
      const view = viewRef.current

      if (!liveCanvas || !trackCanvas || !view) return

      tickRef.current += 1
      const pose = createPose(tickRef.current)
      const offset = calcOffset(pose.center, targetPile, pose.heading)

      trackRef.current = [...trackRef.current.slice(-180), pose.center]
      drawTrackLayer(trackCanvas, trackRef.current, view)
      requestAnimationFrame(() => {
        drawLiveLayer(liveCanvas, pose, targetPile, offset, view)
      })
      setOffsetInfo(offset)
    }, 1000)

    return () => window.clearInterval(timer)
  }, [])

  return (
    <div className="mx-auto max-w-7xl trans-test-page">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">Canvas Demo</h1>
          <p className="mt-2 text-sm text-slate-600">
            三层 Canvas 演示：固定桩点、历史轨迹、实时双天线三角形。
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm">
            <div className="text-slate-500">offsetX</div>
            <div className="font-mono text-slate-950">{offsetInfo.offsetXText}m</div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm">
            <div className="text-slate-500">offsetY</div>
            <div className="font-mono text-slate-950">{offsetInfo.offsetYText}m</div>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 shadow-sm">
            <div className="text-amber-700">distance</div>
            <div className="font-mono text-amber-950">{offsetInfo.distanceText}m</div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm">
            <div className="text-slate-500">heading</div>
            <div className="font-mono text-slate-950">
              {offsetInfo.headingText}deg {offsetInfo.direction}
            </div>
          </div>
        </div>
      </div>

      <div
        ref={wrapperRef}
        className="relative h-[620px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
      >
        <canvas ref={baseCanvasRef} className="absolute inset-0" />
        <canvas ref={trackCanvasRef} className="absolute inset-0" />
        <canvas ref={liveCanvasRef} className="absolute inset-0" />

        <div className="pointer-events-none absolute left-4 top-4 rounded-lg border border-slate-200 bg-white/85 px-3 py-2 text-xs text-slate-600 shadow-sm backdrop-blur">
          <div className="mb-1 font-semibold text-slate-950">图例</div>
          <div>蓝点：设计桩位</div>
          <div>黄点：当前目标桩位</div>
          <div>黄三角：桩机双天线姿态</div>
          <div>白线：设备当前指向</div>
          <div>绿线：历史轨迹</div>
          <div>红虚线：当前偏差</div>
          <div>右上罗盘：0°北 / 90°东 / 180°南 / 270°西</div>
        </div>
      </div>
    </div>
  )
}
