# React Admin Starter

React 18 + React Router 6 + Redux Toolkit + Tailwind CSS 4 + TypeScript + Vite

## 启动

```bash
npm install
npm run dev
```

## 目录结构

```
src/
├── main.tsx              # 入口:挂载 Redux Provider + RouterProvider
├── index.css             # Tailwind 入口 + 全局样式
├── routers/
│   ├── routes.tsx        # ★ 路由配置表(唯一来源),带 meta:title/icon/hidden/auth
│   └── index.tsx         # createBrowserRouter 消费配置,挂到 MainLayout 下
├── layouts/
│   └── MainLayout.tsx    # 布局:循环 routes 配置渲染侧边栏菜单,<Outlet/> 渲染页面
├── store/
│   ├── index.ts          # configureStore,注册所有 slice
│   ├── hooks.ts          # useAppSelector / useAppDispatch(带类型)
│   └── modules/          # 按业务模块拆分 slice
│       ├── userSlice.ts     # 含 createAsyncThunk 异步示例
│       └── counterSlice.ts
├── views/                # 页面级组件,一个页面一个文件夹
│   ├── Home/
│   ├── Dashboard/
│   ├── About/
│   └── NotFound/
├── components/           # 跨页面复用的通用组件
└── utils/                # 工具函数
```

## 新增一个页面的步骤

1. `src/views/Xxx/index.tsx` 写页面组件
2. `src/routers/routes.tsx` 的 `menuRoutes` 里加一条配置:

```tsx
{
  path: '/xxx',
  element: lazyLoad(() => import('@/views/Xxx')),
  meta: { title: '新页面', icon: '✨' },
}
```

侧边栏菜单会自动出现,无需改 Layout。

## 新增一个 Store 模块

1. `src/store/modules/xxxSlice.ts` 写 slice
2. 在 `src/store/index.ts` 的 reducer 中注册

组件里统一用 `useAppSelector` / `useAppDispatch`(已带类型推导)。

## 路由守卫(可选扩展)

meta 里已预留 `auth` 字段,如需登录拦截,可写一个 `AuthGuard` 组件
包在 element 外层,根据 store 里的 token 判断是否重定向到登录页。
