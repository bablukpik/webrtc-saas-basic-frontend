"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    // Fetch user data
    const fetchUserData = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const userData = await response.json();
        setUser(userData);
      } catch (error) {
        console.error('Error fetching user data:', error);
        localStorage.removeItem('token');
        router.push('/login');
      }
    };

    fetchUserData();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Start Call Card */}
        <div className="p-6 border rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Start a Call</h2>
          <Button className="w-full" onClick={() => router.push('/call')}>
            New Call
          </Button>
        </div>

        {/* User Management Card - Only visible to Admin */}
        {user.role === 'ADMIN' && (
          <div className="p-6 border rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-4">User Management</h2>
            <Button className="w-full" onClick={() => router.push('/admin/users')}>
              Manage Users
            </Button>
          </div>
        )}

        {/* Recent Calls Card */}
        <div className="p-6 border rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Recent Calls</h2>
          <div className="space-y-2">
            {/* Add recent calls list here */}
            <p className="text-muted-foreground">No recent calls</p>
          </div>
        </div>

        {/* Recordings Card */}
        <div className="p-6 border rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Recordings</h2>
          <div className="space-y-2">
            {/* Add recordings list here */}
            <p className="text-muted-foreground">No recordings found</p>
          </div>
        </div>
      </div>
    </div>
  );
} 