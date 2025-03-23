import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User } from '@/lib/types/user';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess: (state, action: PayloadAction<{ user: User }>) => {
      state.user = action.payload.user;
      state.isAuthenticated = true;
    },
  },
});

export const { loginSuccess } = authSlice.actions;
export default authSlice.reducer;
