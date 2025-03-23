import { fetchBaseQuery } from '@reduxjs/toolkit/query';
import type { BaseQueryFn } from '@reduxjs/toolkit/query';
import { Mutex } from 'async-mutex';

const mutex = new Mutex();

// This is a base query function that includes the necessary headers and credentials
const baseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_URL,
  credentials: 'include', // Important for cookies
  prepareHeaders: (headers) => {
    headers.set('Accept', 'application/json');
    const token = document.cookie
      .split('; ')
      .find((row) => row.startsWith('accessToken='))
      ?.split('=')[1];

    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

// This is a base query function that will automatically refresh the token if the request is unauthorized
export const baseQueryWithReauth: BaseQueryFn = async (args, api, extraOptions) => {
  // wait until the mutex is available without locking it
  await mutex.waitForUnlock();
  let result = await baseQuery(args, api, extraOptions);

  // If the request is unauthorized, try to refresh the token
  if (result.error && result.error.status === 401) {
    // checking whether the mutex is locked
    if (!mutex.isLocked()) {
      const release = await mutex.acquire();
      try {
        // try to get a new token
        const refreshResult = await baseQuery(
          { url: '/auth/refresh-token', method: 'GET' },
          api,
          extraOptions
        );

        if (refreshResult.data) {
          // retry the initial query
          result = await baseQuery(args, api, extraOptions);
        } else {
          // if refresh fails, redirect to login
          window.location.href = '/login';
        }
      } finally {
        // release must be called once the mutex should be released again.
        release();
      }
    } else {
      // wait until the mutex is available without locking it
      await mutex.waitForUnlock();
      result = await baseQuery(args, api, extraOptions);
    }
  }

  return result;
};
