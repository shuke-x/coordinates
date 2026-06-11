import Decimal from 'decimal.js'
import { useMemo, useState } from 'react'
import {
  filterCoordinateInput,
  useCoordinateTransform,
} from '@/utils/transferWGS84/useCoordinateTransform'
import { convertNEToChengduXY } from '@/utils/transferNE/coordinate'
import {
  DISPLAY_PRECISION,
} from '@/utils/transferNE/constant'

type ResultItem = {
  label: string
  translation: string
  value: string
  highlight?: boolean
}

const PROJECT_NE_CORRECTION = {
  /**
   * 由控制点反推：
   * B=30:30:54.69607, L=103:57:54.20206
   * 投影计算值 -> 成果表国家 2000 N=3377681.686, E=400659.307
  */
  N: '0.000524389',
  E: '-0.0002154596',
}

const defaultForm = {
  lat: '',
  lon: '',
  height: '',
  northing: '',
  easting: '',
}

function formatDisplay(value: string | number): string {
  return new Decimal(String(value))
    .toDecimalPlaces(DISPLAY_PRECISION.COORDINATE, Decimal.ROUND_DOWN)
    .toFixed(DISPLAY_PRECISION.COORDINATE)
}

function filterHeightInput(input: string): string {
  return input
    .replace(/[^\d+\-.。．\s]/g, "")
    .replace(/[。．]/g, ".")
    .replace(/\s+/g, "")
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
  const { convertLatLonToNE } = useCoordinateTransform()

  const result = useMemo(() => {
    try {
      const hasLat = Boolean(form.lat.trim())
      const hasLon = Boolean(form.lon.trim())
      const hasNorthing = Boolean(form.northing.trim())
      const hasEasting = Boolean(form.easting.trim())
      const hasHeight = Boolean(form.height.trim())

      if (!hasLat && !hasLon && !hasNorthing && !hasEasting && !hasHeight) {
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
        : new Decimal(projected?.N ?? 0).plus(PROJECT_NE_CORRECTION.N)
      const correctedE = hasEasting
        ? new Decimal(form.easting)
        : new Decimal(projected?.E ?? 0).plus(PROJECT_NE_CORRECTION.E)
      const chengdu = convertNEToChengduXY(correctedN.toString(), correctedE.toString())
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
      ]

      if (hasHeight) {
        items.push({
          label: '成都 H(m)',
          translation: '椭球高 H，米',
          value: formatDisplay(form.height),
          highlight: true,
        })
      }

      items.push(
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
      )

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

      if (hasHeight) {
        items.push({
          label: 'inputHeight',
          translation: '输入椭球高 H，米',
          value: formatDisplay(form.height),
        })
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
  }, [convertLatLonToNE, form.easting, form.height, form.lat, form.lon, form.northing])

  return (
    <div className="mx-auto max-w-7xl trans-test-page">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">transWGS84</h1>
          <p className="mt-2 text-sm text-slate-600">
            输入纬度 B、经度 L、椭球高 H，换算成都项目 X/Y/H。
          </p>
        </div>
        <div className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800">
          中央经线 105E
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm trans-test-rise">
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

            <label className="grid gap-1.5">
              <span className="text-sm font-medium text-slate-700">椭球高 H(m)</span>
              <input
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-sm text-slate-900 outline-none transition focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-200"
                value={form.height}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    height: filterHeightInput(event.target.value),
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
                      northing: filterHeightInput(event.target.value),
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
                      easting: filterHeightInput(event.target.value),
                    }))
                  }
                />
              </label>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm trans-test-rise">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-lg font-semibold text-slate-950">成都坐标结果</h2>
            <p className="mt-1 text-sm text-slate-600">
              高亮值为成都项目 X/Y/H，其他值用于核对中间结果。
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
