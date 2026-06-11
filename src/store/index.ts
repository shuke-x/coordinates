import { configureStore } from '@reduxjs/toolkit'
import userReducer from './modules/userSlice'
import counterReducer from './modules/counterSlice'

export const store = configureStore({
  reducer: {
    user: userReducer,
    counter: counterReducer,
    // 新增模块:在 modules/ 下建 slice,然后在这里注册
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
