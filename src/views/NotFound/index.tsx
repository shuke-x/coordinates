import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24">
      <div className="text-6xl font-bold text-gray-300">404</div>
      <p className="mt-2 text-gray-500">页面不存在</p>
      <Link
        to="/"
        className="mt-6 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
      >
        返回首页
      </Link>
    </div>
  )
}
