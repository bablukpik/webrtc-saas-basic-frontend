import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { RootState } from './store';

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),
    getUsers: builder.query({
      query: () => '/auth',
      providesTags: ['User'],
    }),
    updateUserRole: builder.mutation({
      query: ({ id, role }) => ({
        url: `/auth/${id}/role`,
        method: 'PUT',
        body: { role },
      }),
      invalidatesTags: ['User'],
    }),
    deleteUser: builder.mutation({
      query: (id) => ({
        url: `/auth/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['User'],
    }),
    getCurrentUser: builder.query({
      query: () => '/auth/me',
    }),
  }),
  tagTypes: ['User', 'Call'],
});

export const {
  useLoginMutation,
  useGetUsersQuery,
  useUpdateUserRoleMutation,
  useDeleteUserMutation,
  useGetCurrentUserQuery,
} = api; 