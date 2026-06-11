import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { testMenuRoutes } from '@/routers/testRoutes'

/**
 * 测试布局:顶部导航(和 MainLayout 的侧边栏区分开)
 * 同样的模式:循环自己的路由配置渲染菜单,<Outlet /> 渲染页面
 */
export default function TestLayout() {
  const location = useLocation()
  const current = testMenuRoutes.find((r) => r.path === location.pathname)

  return (
    <div className="flex h-screen flex-col bg-slate-100 text-slate-900">
      {/* ---------- 顶部导航:循环 testMenuRoutes ---------- */}
      <header className="flex h-14 items-center gap-4 border-b border-slate-200 bg-white px-4 shadow-sm sm:gap-6 sm:px-6">
        <span className="shrink-0 text-base font-bold text-slate-900">坐标系计算</span>
        <nav className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
          {testMenuRoutes
            .filter((route) => !route.meta?.hidden)
            .map((route) => (
              <NavLink
                key={route.path}
                to={route.path!}
                end={route.path === '/'}
                className={({ isActive }) =>
                  [
                    'flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors',
                    isActive
                      ? 'bg-amber-100 font-medium text-amber-800'
                      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900',
                  ].join(' ')
                }
              >
                <span>{route.meta?.icon}</span>
                <span>{route.meta?.title}</span>
              </NavLink>
            ))}
        </nav>
        <span className="ml-auto hidden shrink-0 text-xs text-slate-500 md:block">
          当前页:{current?.meta?.title ?? '-'}
        </span>
      </header>

      {/* ---------- 主区域 ---------- */}
      <main className="flex-1 overflow-auto p-6">
        <Outlet />
      </main>
    </div>
  )
}
