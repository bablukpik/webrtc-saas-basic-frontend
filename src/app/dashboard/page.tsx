"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { socket } from '@/lib/socket';
import IncomingCallModal from '@/components/IncomingCallModal';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [incomingCall, setIncomingCall] = useState<{ callerId: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    // Fetch user data and set up socket connection
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
        console.log('User data fetched:', userData);

        // Join socket room with user ID
        socket.emit('join', userData.id, (response: any) => {
          console.log('Join room response:', response);
        });
        console.log('Joined socket room with ID:', userData.id);
      } catch (error) {
        console.error('Error fetching user data:', error);
        localStorage.removeItem('token');
        router.push('/login');
      }
    };

    fetchUserData();

    // Socket event listeners
    socket.on('connect', () => {
      console.log('Socket connected in Dashboard with ID:', socket.id);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error in Dashboard:', error);
    });

    socket.on('incoming-call', (data) => {
      console.log('Incoming call event received:', data);
      setIncomingCall({ callerId: data.callerId });
    });

    return () => {
      socket.off('connect');
      socket.off('connect_error');
      socket.off('incoming-call');
      console.log('Cleaned up socket listeners');
    };
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
      <h1 className="text-3xl font-bold">Dashboard</h1>
      {incomingCall && (
        <IncomingCallModal
          callerName={incomingCall.callerId}
          onAccept={() => {
            console.log('Call accepted');
            setIncomingCall(null);
            // Logic to start the call can go here
          }}
          onReject={() => {
            console.log('Call rejected');
            setIncomingCall(null);
          }}
        />
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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