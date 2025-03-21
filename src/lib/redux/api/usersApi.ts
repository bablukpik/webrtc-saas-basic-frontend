import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '../baseQuery';
import { User } from '@/lib/types/user';

export const usersApi = createApi({
  reducerPath: 'usersApi',
  baseQuery: baseQueryWithReauth,
  endpoints: (builder) => ({
    getAllUsers: builder.query<User[], void>({
      query: () => '/auth',
    }),
    getCurrentUser: builder.query<User, void>({
      query: () => '/auth/me',
    }),
    updateUserRole: builder.mutation<User, { id: string; role: string }>({
      query: ({ id, role }) => ({
        url: `/auth/${id}/role`,
        method: 'PUT',
        body: { role },
      }),
    }),
    deleteUser: builder.mutation<void, string>({
      query: (id) => ({
        url: `/auth/${id}`,
        method: 'DELETE',
      }),
    }),
  }),
});

export const {
  useGetAllUsersQuery,
  useGetCurrentUserQuery,
  useUpdateUserRoleMutation,
  useDeleteUserMutation,
} = usersApi;
