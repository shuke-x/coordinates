import { createBrowserRouter, type RouteObject } from 'react-router-dom'
import MainLayout from '@/layouts/MainLayout'
import TestLayout from '@/layouts/TestLayout'
import { menuRoutes, fallbackRoutes, type AppRoute } from './routes'
import { testMenuRoutes } from './testRoutes'

/* ------------------------------------------------------------------ */
/* 两套布局配置并存,通过 ACTIVE_LAYOUT 切换当前生效的一套                  */
/* ------------------------------------------------------------------ */

/** 原布局:侧边栏 MainLayout + menuRoutes(保留,暂不启用) */
const mainLayoutRoute: AppRoute = {
  path: '/',
  element: <MainLayout />,
  children: [...menuRoutes, ...fallbackRoutes],
}

/** 测试布局:顶部导航 TestLayout + testRoutes */
const testLayoutRoute: AppRoute = {
  path: '/',
  element: <TestLayout />,
  children: [...testMenuRoutes, ...fallbackRoutes],
}

/** 切回原布局只需改成 'main' */
const ACTIVE_LAYOUT: 'main' | 'test' = 'test'

const router = createBrowserRouter(
  [(ACTIVE_LAYOUT === 'test' ? testLayoutRoute : mainLayoutRoute) as RouteObject],
  { basename: import.meta.env.BASE_URL },
)

export default router
