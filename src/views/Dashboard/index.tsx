import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { loginAsync, logout } from '@/store/modules/userSlice'

export default function Dashboard() {
  const { name, loading } = useAppSelector((s) => s.user)
  const dispatch = useAppDispatch()

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="mb-2 text-lg font-semibold text-gray-800">仪表盘</h2>
      <p className="mb-4 text-sm text-gray-500">
        异步 action(createAsyncThunk)示例:
      </p>
      {name ? (
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-700">当前用户:{name}</span>
          <button
            onClick={() => dispatch(logout())}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
          >
            退出登录
          </button>
        </div>
      ) : (
        <button
          disabled={loading}
          onClick={() => dispatch(loginAsync({ username: 'admin', password: '123456' }))}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? '登录中...' : '模拟登录'}
        </button>
      )}
    </div>
  )
}
