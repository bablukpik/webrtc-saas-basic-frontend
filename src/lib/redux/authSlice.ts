import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
  isAuthenticated: false,
  loading: true,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess: (state, action: PayloadAction<{ user: User; token: string }>) => {
      const { user, token } = action.payload;
      
      // Validate user data before setting
      if (!user.id || user.id === 'undefined' || user.id === 'null') {
        console.error('Invalid user data received in loginSuccess action:', user);
        return; // Don't update state with invalid data
      }
      
      state.user = user;
      state.token = token;
      state.isAuthenticated = true;
      state.loading = false;
      state.error = null;
      
      // Save to localStorage with validation
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', token);
        localStorage.setItem('userId', user.id);
        localStorage.setItem('userEmail', user.email || '');
        localStorage.setItem('userName', user.name || user.email?.split('@')[0] || 'User');
        localStorage.setItem('userRole', user.role || 'USER');
        
        // Verify the data was stored properly
        const storedId = localStorage.getItem('userId');
        if (storedId !== user.id) {
          console.error('localStorage userId mismatch - expected:', 
            user.id, 'got:', storedId);
        }
      }
    },
    loginFail: (state, action: PayloadAction<string>) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      
      // Clear localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userName');
      }
    },
    loadUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.loading = false;
    },
  },
});

export const { loginSuccess, loginFail, logout, loadUser } = authSlice.actions;
export default authSlice.reducer; 