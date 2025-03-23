'use client';

import { useGetCurrentUserQuery } from '@/lib/redux/api/usersApi';

export default function Dashboard() {
  const { data: user, isLoading, error } = useGetCurrentUserQuery();

  if (isLoading) {
    return <div className='flex justify-center items-center min-h-screen'>Loading...</div>;
  }

  if (error) {
    return <div>Error loading dashboard</div>;
  }

  return (
    <div className='container mx-auto px-4 py-8'>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
        <div className='space-y-4'>
          <h1 className='text-2xl font-bold'>Dashboard</h1>
          {user && (
            <div>
              <p>Welcome, {user.name}!</p>
              <p>Email: {user.email}</p>
              <p>Role: {user.role}</p>
            </div>
          )}
        </div>

        <div className='space-y-4'>
          <h2 className='text-xl font-semibold'>Recent Activity</h2>
          <div className='space-y-2'>{/* Recent Activity */}</div>
        </div>
      </div>
    </div>
  );
}
