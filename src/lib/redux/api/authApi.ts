import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '../baseQuery';
import { User } from '@/lib/types/user';

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  user: User
}

interface RefreshResponse {
  accessToken: string;
}

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: baseQueryWithReauth,
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),
    logout: builder.mutation<void, void>({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
    }),
    refresh: builder.query<RefreshResponse, void>({
      query: () => '/auth/refresh-token',
    }),
  }),
});

export const {
  useLoginMutation,
  useLogoutMutation,
  useRefreshQuery,
} = authApi; 