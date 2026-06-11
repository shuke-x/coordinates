import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { increment, decrement, incrementByAmount } from '@/store/modules/counterSlice'

export default function Home() {
  const count = useAppSelector((s) => s.counter.value)
  const dispatch = useAppDispatch()

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-2 text-lg font-semibold text-gray-800">欢迎 👋</h2>
        <p className="text-sm text-gray-500">
          这是 Home 页面,下面是 Redux counter 的使用示例。
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="mb-4 text-3xl font-bold text-gray-800">{count}</div>
        <div className="flex gap-2">
          <button
            onClick={() => dispatch(decrement())}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
          >
            -1
          </button>
          <button
            onClick={() => dispatch(increment())}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            +1
          </button>
          <button
            onClick={() => dispatch(incrementByAmount(10))}
            className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-600 hover:bg-blue-100"
          >
            +10
          </button>
        </div>
      </div>
    </div>
  )
}
