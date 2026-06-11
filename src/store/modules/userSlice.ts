import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit'

interface UserState {
  name: string
  token: string
  loading: boolean
}

const initialState: UserState = {
  name: '',
  token: localStorage.getItem('token') ?? '',
  loading: false,
}

// 异步 action 示例:登录
export const loginAsync = createAsyncThunk(
  'user/login',
  async (payload: { username: string; password: string }) => {
    // 这里替换成真实接口请求
    await new Promise((r) => setTimeout(r, 500))
    return { name: payload.username, token: 'mock-token-' + Date.now() }
  },
)

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setName(state, action: PayloadAction<string>) {
      state.name = action.payload
    },
    logout(state) {
      state.name = ''
      state.token = ''
      localStorage.removeItem('token')
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginAsync.pending, (state) => {
        state.loading = true
      })
      .addCase(loginAsync.fulfilled, (state, action) => {
        state.loading = false
        state.name = action.payload.name
        state.token = action.payload.token
        localStorage.setItem('token', action.payload.token)
      })
      .addCase(loginAsync.rejected, (state) => {
        state.loading = false
      })
  },
})

export const { setName, logout } = userSlice.actions
export default userSlice.reducer
