import { lazy, Suspense, type ReactNode } from 'react'
import type { RouteObject } from 'react-router-dom'

/* ------------------------------------------------------------------ */
/* 路由元信息:菜单标题、图标、是否在菜单中隐藏等                          */
/* ------------------------------------------------------------------ */
export interface RouteMeta {
  /** 菜单 / 页面标题 */
  title: string
  /** 菜单图标(emoji 或换成你的 Icon 组件) */
  icon?: string
  /** 不在侧边栏菜单中显示 */
  hidden?: boolean
  /** 需要登录才能访问 */
  auth?: boolean
}

/** 在 RouteObject 基础上扩展 meta,children 同样递归扩展 */
export type AppRoute = Omit<RouteObject, 'children'> & {
  meta?: RouteMeta
  children?: AppRoute[]
}

/* ------------------------------------------------------------------ */
/* 懒加载工具:统一包一层 Suspense                                       */
/* ------------------------------------------------------------------ */
export const lazyLoad = (
  factory: () => Promise<{ default: React.ComponentType }>,
): ReactNode => {
  const Component = lazy(factory)
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center py-20 text-gray-400">
          加载中...
        </div>
      }
    >
      <Component />
    </Suspense>
  )
}

/* ------------------------------------------------------------------ */
/* 路由表:唯一的配置来源                                                */
/* 新增页面 = 在这里加一条记录,菜单自动出现                               */
/* ------------------------------------------------------------------ */
export const menuRoutes: AppRoute[] = [
  {
    path: '/',
    element: lazyLoad(() => import('@/views/Home')),
    meta: { title: '首页', icon: '🏠' },
  },
  {
    path: '/dashboard',
    element: lazyLoad(() => import('@/views/Dashboard')),
    meta: { title: '仪表盘', icon: '📊', auth: true },
  },
  {
    path: '/about',
    element: lazyLoad(() => import('@/views/About')),
    meta: { title: '关于', icon: 'ℹ️' },
  },
]

/** 不进菜单的路由(404 等) */
export const fallbackRoutes: AppRoute[] = [
  {
    path: '*',
    element: lazyLoad(() => import('@/views/NotFound')),
    meta: { title: '404', hidden: true },
  },
]
