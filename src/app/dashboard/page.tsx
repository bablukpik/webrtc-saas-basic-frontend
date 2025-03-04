'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { IncomingCallModal } from '@/components/IncomingCallModal';
import { useSocket } from '@/providers/socket-provider';
import { SocketDebug } from '@/components/SocketDebug';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export default function Dashboard() {
  const [userData, setUserData] = useState<User | null>(null);
  const router = useRouter();

  const fetchUserData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setUserData(data);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  }, [router]);

  // Fetch user data when component mounts
  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  if (!userData) {
    return <div>Loading...</div>;
  }

  return (
    <div className='container mx-auto px-4 py-8'>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
        <div className='space-y-4'>
          <h1 className='text-2xl font-bold'>Dashboard</h1>
          {userData && (
            <div>
              <p>Welcome, {userData.name}!</p>
              <p>Email: {userData.email}</p>
              <p>Role: {userData.role}</p>
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
