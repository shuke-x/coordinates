import { lazyLoad, type AppRoute } from './routes'

/* ------------------------------------------------------------------ */
/* TestLayout 专用路由表,和 menuRoutes 完全独立                          */
/* TestLayout 会循环这份配置渲染顶部导航                                  */
/* ------------------------------------------------------------------ */
export const testMenuRoutes: AppRoute[] = [
  
  {
    path: '/trans-test',
    element: lazyLoad(() => import('@/views/Test/TransTest')),
    meta: { title: 'transTest', icon: '📍' },
  },
  {
    path: '/trans-wgs84',
    element: lazyLoad(() => import('@/views/Test/TransWGS84')),
    meta: { title: 'transWGS84', icon: 'WGS' },
  },
  // {
  //   path: '/canvas-demo',
  //   element: lazyLoad(() => import('@/views/Test/CanvasDemo')),
  //   meta: { title: 'Canvas Demo', icon: '🗺️' },
  // },
]
