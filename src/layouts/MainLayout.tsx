import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { menuRoutes } from '@/routers/routes'
import { useAppSelector } from '@/store/hooks'

export default function MainLayout() {
  const location = useLocation()
  const userName = useAppSelector((s) => s.user.name)

  // 当前页面标题:从路由配置里反查,顶栏直接复用
  const current = menuRoutes.find((r) => r.path === location.pathname)

  return (
    <div className="flex h-screen bg-gray-50">
      {/* ---------- 侧边栏:循环路由配置生成菜单 ---------- */}
      <aside className="flex w-56 flex-col border-r border-gray-200 bg-white">
        <div className="flex h-14 items-center px-5 text-lg font-bold text-gray-800">
          My App
        </div>
        <nav className="flex-1 space-y-1 px-3 py-2">
          {menuRoutes
            .filter((route) => !route.meta?.hidden)
            .map((route) => (
              <NavLink
                key={route.path}
                to={route.path!}
                end={route.path === '/'}
                className={({ isActive }) =>
                  [
                    'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
                    isActive
                      ? 'bg-blue-50 font-medium text-blue-600'
                      : 'text-gray-600 hover:bg-gray-100',
                  ].join(' ')
                }
              >
                <span>{route.meta?.icon}</span>
                <span>{route.meta?.title}</span>
              </NavLink>
            ))}
        </nav>
        <div className="border-t border-gray-100 px-5 py-3 text-xs text-gray-400">
          {userName ? `已登录:${userName}` : '未登录'}
        </div>
      </aside>

      {/* ---------- 右侧主区域 ---------- */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center border-b border-gray-200 bg-white px-6">
          <h1 className="text-base font-medium text-gray-800">
            {current?.meta?.title ?? ''}
          </h1>
        </header>
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
