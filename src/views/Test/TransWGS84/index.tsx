import Decimal from 'decimal.js'
import { useEffect, useMemo, useState } from 'react'
import {
  filterCoordinateInput,
  useCoordinateTransform,
} from '@/utils/transferWGS84/useCoordinateTransform'
import {
  convertNEToChengduXY,
  type ChengduCoordinateParams,
} from '@/utils/transferNE/coordinate'
import {
  CHENGDU_COORDINATE_PARAMS,
  DISPLAY_PRECISION,
} from '@/utils/transferNE/constant'
import { saveCoordinateCalibration } from '@/utils/transferNE'

type ResultItem = {
  label: string
  translation: string
  value: string
  highlight?: boolean
}

type ControlPointInput = {
  id: string
  lat: string
  lon: string
  northing: string
  easting: string
  x: string
  y: string
}

const PROJECT_NE_CORRECTION = {
  N: '0.000524389',
  E: '-0.0002154596',
}

const defaultForm = {
  lat: '',
  lon: '',
  northing: '',
  easting: '',
}

const emptyControlPoint = (id: string): ControlPointInput => ({
  id,
  lat: '',
  lon: '',
  northing: '',
  easting: '',
  x: '',
  y: '',
})

const sampleControlPoints: ControlPointInput[] = [
  {
    id: '1',
    lat: '30:30:54.69607',
    lon: '103:57:54.20206',
    northing: '3377681.686',
    easting: '400659.307',
    x: '202623.775',
    y: '209808.803',
  },
  {
    id: '2',
    lat: '30:30:49.17878',
    lon: '103:57:42.88525',
    northing: '3377514.541',
    easting: '400355.988',
    x: '202454.122',
    y: '209506.853',
  },
  {
    id: '3',
    lat: '30:30:57.82355',
    lon: '103:57:46.61257',
    northing: '3377779.862',
    easting: '400457.824',
    x: '202720.292',
    y: '209606.502',
  },
]

function formatDisplay(value: string | number): string {
  return new Decimal(String(value))
    .toDecimalPlaces(DISPLAY_PRECISION.COORDINATE, Decimal.ROUND_DOWN)
    .toFixed(DISPLAY_PRECISION.COORDINATE)
}

function filterNumberInput(input: string): string {
  return input
    .replace(/[^\d+\-.。．\s]/g, '')
    .replace(/[。．]/g, '.')
    .replace(/\s+/g, '')
}

function hasValue(value: string): boolean {
  return Boolean(value.trim())
}

function isCoordinateControlPoint(point: ControlPointInput): boolean {
  return (
    hasValue(point.northing) &&
    hasValue(point.easting) &&
    hasValue(point.x) &&
    hasValue(point.y)
  )
}

function isProjectionControlPoint(point: ControlPointInput): boolean {
  return (
    hasValue(point.lat) &&
    hasValue(point.lon) &&
    hasValue(point.northing) &&
    hasValue(point.easting)
  )
}

function averageDecimal(values: Decimal[]): Decimal | null {
  if (values.length === 0) return null

  return values
    .reduce((total, value) => total.plus(value), new Decimal(0))
    .div(values.length)
}

function solveCoordinateParams(points: ControlPointInput[]): ChengduCoordinateParams {
  const [p1, p2, p3] = points
  const N0 = new Decimal(p1.northing)
  const E0 = new Decimal(p1.easting)
  const X0 = new Decimal(p1.x)
  const Y0 = new Decimal(p1.y)

  const dN2 = new Decimal(p2.northing).minus(N0)
  const dE2 = new Decimal(p2.easting).minus(E0)
  const dX2 = new Decimal(p2.x).minus(X0)
  const dY2 = new Decimal(p2.y).minus(Y0)

  const dN3 = new Decimal(p3.northing).minus(N0)
  const dE3 = new Decimal(p3.easting).minus(E0)
  const dX3 = new Decimal(p3.x).minus(X0)
  const dY3 = new Decimal(p3.y).minus(Y0)

  const determinant = dN2.times(dE3).minus(dN3.times(dE2))

  if (determinant.isZero()) {
    throw new Error('控制点不能共线，无法计算坐标转换系数')
  }

  return {
    N0: N0.toString(),
    E0: E0.toString(),
    X0: X0.toString(),
    Y0: Y0.toString(),
    a: dX2.times(dE3).minus(dX3.times(dE2)).div(determinant).toString(),
    b: dN2.times(dX3).minus(dN3.times(dX2)).div(determinant).toString(),
    d: dY2.times(dE3).minus(dY3.times(dE2)).div(determinant).toString(),
    e: dN2.times(dY3).minus(dN3.times(dY2)).div(determinant).toString(),
  }
}

function ResultCard({ item }: { item: ResultItem }) {
  return (
    <div
      className={[
        'rounded-lg border p-3 trans-test-fade',
        item.highlight
          ? 'border-amber-300 bg-amber-50 shadow-sm'
          : 'border-slate-200 bg-white shadow-sm',
      ].join(' ')}
    >
      <div
        className={[
          'flex flex-wrap items-center gap-x-2 gap-y-1 text-xs',
          item.highlight ? 'text-amber-800' : 'text-slate-500',
        ].join(' ')}
      >
        <span>{item.label}</span>
        <span className={item.highlight ? 'text-amber-700/80' : 'text-slate-400'}>
          {item.translation}
        </span>
      </div>
      <div
        className={[
          'mt-1 break-all font-mono text-sm',
          item.highlight ? 'text-amber-950' : 'text-slate-900',
        ].join(' ')}
      >
        {item.value || '-'}
      </div>
    </div>
  )
}

export default function TransWGS84() {
  const [form, setForm] = useState(defaultForm)
  const [controlPoints, setControlPoints] = useState<ControlPointInput[]>([
    emptyControlPoint('1'),
    emptyControlPoint('2'),
    emptyControlPoint('3'),
  ])
  const { convertLatLonToNE } = useCoordinateTransform()

  const calibration = useMemo(() => {
    try {
      const coordinatePoints = controlPoints.filter(isCoordinateControlPoint)
      const projectionCorrections = controlPoints
        .filter(isProjectionControlPoint)
        .map((point) => {
          const projected = convertLatLonToNE(point.lat, point.lon)

          return {
            N: new Decimal(point.northing).minus(projected.N),
            E: new Decimal(point.easting).minus(projected.E),
          }
        })

      const params =
        coordinatePoints.length >= 3
          ? solveCoordinateParams(coordinatePoints.slice(0, 3))
          : CHENGDU_COORDINATE_PARAMS
      const northingCorrection =
        averageDecimal(projectionCorrections.map((item) => item.N))?.toString() ??
        PROJECT_NE_CORRECTION.N
      const eastingCorrection =
        averageDecimal(projectionCorrections.map((item) => item.E))?.toString() ??
        PROJECT_NE_CORRECTION.E

      return {
        error: '',
        params,
        northingCorrection,
        eastingCorrection,
        coordinatePointCount: coordinatePoints.length,
        projectionPointCount: projectionCorrections.length,
        isCustomParams: coordinatePoints.length >= 3,
      }
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : '控制点参数计算失败',
        params: CHENGDU_COORDINATE_PARAMS,
        northingCorrection: PROJECT_NE_CORRECTION.N,
        eastingCorrection: PROJECT_NE_CORRECTION.E,
        coordinatePointCount: 0,
        projectionPointCount: 0,
        isCustomParams: false,
      }
    }
  }, [controlPoints, convertLatLonToNE])

  useEffect(() => {
    if (calibration.error || !calibration.isCustomParams) return

    saveCoordinateCalibration({
      params: calibration.params,
      heightOffset: '0',
      northingCorrection: calibration.northingCorrection,
      eastingCorrection: calibration.eastingCorrection,
      source: 'control-points',
    })
  }, [calibration])

  const result = useMemo(() => {
    try {
      if (calibration.error) {
        return {
          error: calibration.error,
          items: [],
          empty: false,
        }
      }

      const hasLat = hasValue(form.lat)
      const hasLon = hasValue(form.lon)
      const hasNorthing = hasValue(form.northing)
      const hasEasting = hasValue(form.easting)

      if (!hasLat && !hasLon && !hasNorthing && !hasEasting) {
        return {
          error: '',
          items: [],
          empty: true,
        }
      }

      if (hasNorthing !== hasEasting) {
        return {
          error: '国家 2000 北坐标 N 和东坐标 E 需要同时填写',
          items: [],
          empty: false,
        }
      }

      if (!hasNorthing && !hasEasting && hasLat !== hasLon) {
        return {
          error: '纬度 B 和经度 L 需要同时填写',
          items: [],
          empty: false,
        }
      }

      const projected = hasLat && hasLon ? convertLatLonToNE(form.lat, form.lon) : null
      const correctedN = hasNorthing
        ? new Decimal(form.northing)
        : new Decimal(projected?.N ?? 0).plus(calibration.northingCorrection)
      const correctedE = hasEasting
        ? new Decimal(form.easting)
        : new Decimal(projected?.E ?? 0).plus(calibration.eastingCorrection)
      const chengdu = convertNEToChengduXY(
        correctedN.toString(),
        correctedE.toString(),
        calibration.params,
      )
      const items: ResultItem[] = [
        {
          label: '成都 X(m)',
          translation: '成都项目坐标 X，米',
          value: chengdu.XText,
          highlight: true,
        },
        {
          label: '成都 Y(m)',
          translation: '成都项目坐标 Y，米',
          value: chengdu.YText,
          highlight: true,
        },
        {
          label: 'N',
          translation: '用于计算的国家 2000 北坐标',
          value: formatDisplay(correctedN.toString()),
        },
        {
          label: 'E',
          translation: '用于计算的国家 2000 东坐标',
          value: formatDisplay(correctedE.toString()),
        },
      ]

      if (projected) {
        items.push(
          {
            label: 'rawN',
            translation: '投影原始北坐标',
            value: formatDisplay(projected.N),
          },
          {
            label: 'rawE',
            translation: '投影原始东坐标',
            value: formatDisplay(projected.E),
          },
        )
      }

      return {
        error: '',
        items,
        empty: false,
      }
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : '转换失败',
        items: [],
        empty: false,
      }
    }
  }, [calibration, convertLatLonToNE, form.easting, form.lat, form.lon, form.northing])

  return (
    <div className="mx-auto max-w-7xl trans-test-page">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">transWGS84</h1>
          <p className="mt-2 text-sm text-slate-600">
            输入纬度 B、经度 L 或国家 2000 N/E，换算成都项目 X/Y。
          </p>
        </div>
        <div className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800">
          中央经线 105E
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm trans-test-rise">
          <div className="border-b border-slate-200 pb-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">控制点拟合参数</h2>
                <p className="mt-1 text-sm text-slate-600">
                  填入至少 3 组 N/E/X/Y 自动计算 a/b/d/e；B/L 和 N/E 可用于计算投影校正。
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 transition hover:bg-amber-100"
                  onClick={() => setControlPoints(sampleControlPoints)}
                >
                  填入三组示例
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                  onClick={() =>
                    setControlPoints([
                      emptyControlPoint('1'),
                      emptyControlPoint('2'),
                      emptyControlPoint('3'),
                    ])
                  }
                >
                  清空控制点
                </button>
              </div>
            </div>
          </div>

          <div className="mt-5 overflow-x-auto">
            <div className="min-w-[760px] space-y-2">
              <div className="grid grid-cols-[36px_repeat(6,minmax(96px,1fr))] gap-2 text-xs font-medium text-slate-500">
                <span>#</span>
                <span>纬度B</span>
                <span>经度L</span>
                <span>N</span>
                <span>E</span>
                <span>X</span>
                <span>Y</span>
              </div>
              {controlPoints.map((point, index) => (
                <div
                  key={point.id}
                  className="grid grid-cols-[36px_repeat(6,minmax(96px,1fr))] items-center gap-2"
                >
                  <span className="text-xs font-semibold text-slate-500">{index + 1}</span>
                  <input
                    className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 font-mono text-xs text-slate-900 outline-none focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-100"
                    value={point.lat}
                    onChange={(event) =>
                      setControlPoints((current) =>
                        current.map((item) =>
                          item.id === point.id
                            ? { ...item, lat: filterCoordinateInput(event.target.value) }
                            : item,
                        ),
                      )
                    }
                  />
                  <input
                    className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 font-mono text-xs text-slate-900 outline-none focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-100"
                    value={point.lon}
                    onChange={(event) =>
                      setControlPoints((current) =>
                        current.map((item) =>
                          item.id === point.id
                            ? { ...item, lon: filterCoordinateInput(event.target.value) }
                            : item,
                        ),
                      )
                    }
                  />
                  {(['northing', 'easting', 'x', 'y'] as const).map((field) => (
                    <input
                      key={field}
                      className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 font-mono text-xs text-slate-900 outline-none focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-100"
                      value={point[field]}
                      onChange={(event) =>
                        setControlPoints((current) =>
                          current.map((item) =>
                            item.id === point.id
                              ? { ...item, [field]: filterNumberInput(event.target.value) }
                              : item,
                          ),
                        )
                      }
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="text-xs text-slate-500">当前参数来源</div>
              <div className="mt-1 text-sm font-semibold text-slate-900">
                {calibration.isCustomParams ? '控制点自动计算' : '内置默认参数'}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                平面点 {calibration.coordinatePointCount} 组，投影校正点{' '}
                {calibration.projectionPointCount} 组
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="text-xs text-slate-500">投影改正</div>
              <div className="mt-1 font-mono text-xs text-slate-900">
                dN: {formatDisplay(calibration.northingCorrection)} / dE:{' '}
                {formatDisplay(calibration.eastingCorrection)}
              </div>
            </div>
          </div>

          <div className="mt-3 grid gap-2 rounded-lg border border-slate-200 bg-white p-3 font-mono text-xs text-slate-700">
            <div className="break-all">a = {calibration.params.a}</div>
            <div className="break-all">b = {calibration.params.b}</div>
            <div className="break-all">d = {calibration.params.d}</div>
            <div className="break-all">e = {calibration.params.e}</div>
          </div>

          <div className="mt-6 border-t border-slate-200 pt-5">
            <div className="border-b border-slate-200 pb-4">
              <h2 className="text-lg font-semibold text-slate-950">经纬度输入</h2>
              <p className="mt-1 text-sm text-slate-600">
                支持十进制度和度分秒格式，国家 2000 N/E 会优先参与成都坐标计算。
              </p>
            </div>

            <div className="mt-5 grid gap-4">
              <label className="grid gap-1.5">
                <span className="text-sm font-medium text-slate-700">纬度 B</span>
                <input
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-sm text-slate-900 outline-none transition focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-200"
                  value={form.lat}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      lat: filterCoordinateInput(event.target.value),
                    }))
                  }
                />
              </label>

              <label className="grid gap-1.5">
                <span className="text-sm font-medium text-slate-700">经度 L</span>
                <input
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-sm text-slate-900 outline-none transition focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-200"
                  value={form.lon}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      lon: filterCoordinateInput(event.target.value),
                    }))
                  }
                />
              </label>

              <div className="grid gap-4 border-t border-slate-200 pt-4 sm:grid-cols-2">
                <label className="grid gap-1.5">
                  <span className="text-sm font-medium text-slate-700">国家 2000 北坐标 N(m)</span>
                  <input
                    className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-sm text-slate-900 outline-none transition focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-200"
                    value={form.northing}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        northing: filterNumberInput(event.target.value),
                      }))
                    }
                  />
                </label>

                <label className="grid gap-1.5">
                  <span className="text-sm font-medium text-slate-700">国家 2000 东坐标 E(m)</span>
                  <input
                    className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-sm text-slate-900 outline-none transition focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-200"
                    value={form.easting}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        easting: filterNumberInput(event.target.value),
                      }))
                    }
                  />
                </label>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm trans-test-rise">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-lg font-semibold text-slate-950">成都坐标结果</h2>
            <p className="mt-1 text-sm text-slate-600">
              高亮值为成都项目 X/Y，其他值用于核对中间结果。
            </p>
          </div>

          {result.error ? (
            <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {result.error}
            </div>
          ) : result.empty ? (
            <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-6 text-center text-sm text-slate-500">
              等待输入坐标数据
            </div>
          ) : (
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {result.items.map((item) => (
                <ResultCard key={item.label} item={item} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
