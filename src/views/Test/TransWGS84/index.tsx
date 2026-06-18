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
import { DEFAULT_COORDINATE_CALIBRATION } from '@/utils/transferNE'

type ResultItem = {
  label: string
  translation: string
  value: string
  highlight?: boolean
}

const defaultForm = {
  lat: '',
  lon: '',
}

function formatDisplay(value: string | number | Decimal): string {
  return new Decimal(String(value))
    .toDecimalPlaces(DISPLAY_PRECISION.COORDINATE, Decimal.ROUND_DOWN)
    .toFixed(DISPLAY_PRECISION.COORDINATE)
}

function hasValue(value: string): boolean {
  return Boolean(value.trim())
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
  const calibration = DEFAULT_COORDINATE_CALIBRATION
  const { convertLatLonToNE } = useCoordinateTransform()

  const result = useMemo(() => {
    try {
      const hasLat = hasValue(form.lat)
      const hasLon = hasValue(form.lon)

      if (!hasLat && !hasLon) {
        return {
          error: '',
          items: [],
          empty: true,
        }
      }

      if (hasLat !== hasLon) {
        return {
          error: '纬度 B 和经度 L 需要同时填写',
          items: [],
          empty: false,
        }
      }

      const projected = convertLatLonToNE(form.lat, form.lon)
      const correctedN = new Decimal(projected.N).plus(calibration.northingCorrection)
      const correctedE = new Decimal(projected.E).plus(calibration.eastingCorrection)
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
  }, [calibration, convertLatLonToNE, form.lat, form.lon])

  return (
    <div className="mx-auto max-w-7xl trans-test-page">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">transWGS84</h1>
          <p className="mt-2 text-sm text-slate-600">
            输入纬度 B、经度 L，经国家 2000 平面坐标换算成都项目 X/Y。
          </p>
        </div>
        <div className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800">
          中央经线 105E
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm trans-test-rise">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-lg font-semibold text-slate-950">坐标输入</h2>
            <p className="mt-1 text-sm text-slate-600">
              支持十进制度和度分秒格式，程序内部使用中央经线 105E 计算国家 2000 N/E。
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
