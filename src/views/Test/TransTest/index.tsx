import { useMemo, useState } from 'react'
import {
  loadCoordinateCalibration,
  useRtkToChengduCoordinate,
} from '@/utils/transferNE'
import {
  HEADING_STATUS_TEXT,
  RTK_STATUS_TEXT,
} from '@/utils/transferNE/constant'

type ResultItem = {
  label: string
  translation: string
  value: string
  highlight?: boolean
}

const defaultRtkText = ``

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

export default function TransTest() {
  const [rawText, setRawText] = useState(defaultRtkText)
  const [calibration, setCalibration] = useState(() => loadCoordinateCalibration())
  const coordinateResult = useRtkToChengduCoordinate(rawText, {
    params: calibration.params,
    northingCorrection: calibration.northingCorrection,
    eastingCorrection: calibration.eastingCorrection,
  })

  const result = useMemo(() => {
    const { error, parsedCount, gga, heading, ne, chengdu, chengduH } = coordinateResult

    if (error || !gga || !ne || !chengdu || !chengduH) {
      return {
        error,
        items: [],
        parsedCount,
      }
    }

    return {
      error: '',
      parsedCount,
      items: [
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
          label: '成都 H(m)',
          translation: '成都项目高程 H，米',
          value: chengduH.HText,
          highlight: true,
        },
        {
          label: '成都 X(m) 完整值',
          translation: '成都项目坐标 X 未截断值',
          value: chengdu.X,
        },
        {
          label: '成都 Y(m) 完整值',
          translation: '成都项目坐标 Y 未截断值',
          value: chengdu.Y,
        },
        {
          label: '成都 H(m) 完整值',
          translation: '成都项目高程 H 未截断值',
          value: chengduH.H,
        },
        { label: 'latitude', translation: '纬度', value: gga.latitude },
        { label: 'longitude', translation: '经度', value: gga.longitude },
        { label: 'N', translation: '国家 2000 北坐标', value: ne.N },
        { label: 'E', translation: '国家 2000 东坐标', value: ne.E },
        { label: 'NText', translation: '北坐标显示值', value: ne.NText },
        { label: 'EText', translation: '东坐标显示值', value: ne.EText },
        {
          label: 'rtkStatus',
          translation: 'RTK 定位状态',
          value: RTK_STATUS_TEXT[gga.rtkStatus],
        },
        {
          label: 'satelliteCount',
          translation: '参与定位卫星数',
          value: String(gga.satelliteCount),
        },
        { label: 'hdop', translation: '水平精度因子', value: gga.hdop },
        { label: 'altitude', translation: 'GGA 原始海拔高度，米', value: gga.altitude },
        { label: 'utcTime', translation: 'UTC 时间', value: gga.utcTime },
        {
          label: 'centralMeridian',
          translation: '投影中央经线',
          value: ne.centralMeridian,
        },
        { label: 'heading', translation: '航向角，度', value: heading?.heading ?? '' },
        { label: 'pitch', translation: '俯仰角，度', value: heading?.pitch ?? '' },
        {
          label: 'baselineLength',
          translation: '双天线基线长度，米',
          value: heading?.baselineLength ?? '',
        },
        {
          label: 'headingStatus',
          translation: '双天线定向状态',
          value: heading ? HEADING_STATUS_TEXT[heading.headingStatus] : '',
        },
      ],
    }
  }, [coordinateResult])

  return (
    <div className="mx-auto max-w-7xl trans-test-page">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">transTest</h1>
          <p className="mt-2 text-sm text-slate-600">
            粘贴 RTK 原始数据，解析 GNGGA 经纬度并换算成都 X/Y。
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-sm transition hover:bg-slate-50"
            onClick={() => setCalibration(loadCoordinateCalibration())}
          >
            刷新项目参数
          </button>
          <div className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800">
            {calibration.source === 'control-points' ? '控制点参数' : '默认参数'} / 中央经线 105E
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm trans-test-rise">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-lg font-semibold text-slate-950">RTK 原始数据</h2>
            <p className="mt-1 text-sm text-slate-600">
              支持同时粘贴 GNGGA / GPGGA 和 UNIHEADINGA，多行自动解析。
            </p>
          </div>

          <textarea
            className="mt-5 min-h-80 w-full resize-y rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-200"
            value={rawText}
            onChange={(event) => setRawText(event.target.value)}
            spellCheck={false}
          />

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-600"
              onClick={() => setRawText(defaultRtkText)}
            >
              填入示例
            </button>
            <span className="text-sm text-slate-600">
              已解析 {result.parsedCount} 条有效报文
            </span>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm trans-test-rise">
          <div className="border-b border-slate-200 pb-4">
          <h2 className="text-lg font-semibold text-slate-950">成都坐标结果</h2>
          <p className="mt-1 text-sm text-slate-600">
              优先看高亮的成都项目 X(m) / Y(m)，国家 2000 N/E 作为中间结果保留在下方。
          </p>
          </div>

          {result.error ? (
            <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {result.error}
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
