'use client';

import { useEffect, useState } from 'react';
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
  const [incomingCall, setIncomingCall] = useState<{ callerId: string } | null>(null);
  const router = useRouter();
  const { socket, isConnected } = useSocket();
  const [isSocketReady, setIsSocketReady] = useState(false);

  const fetchUserData = async () => {
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

      // Only emit socket events if socket is connected
      if (socket?.connected) {
        console.log('Joining socket room with ID:', data.id);
        socket.emit('join', data.id, (response: { success: boolean }) => {
          console.log('Join room response:', response);
        });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  // Fetch user data when component mounts
  useEffect(() => {
    fetchUserData();
  }, [router]);

  // Handle socket events after socket is ready
  useEffect(() => {
    if (!socket || !isConnected) return;

    console.log('Setting up socket listeners in Dashboard');

    socket.on('connect', () => {
      console.log('Socket connected in Dashboard with ID:', socket.id);
      // Refetch user data to join room after reconnection
      fetchUserData();
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error in Dashboard:', error);
    });

    socket.on('incoming-call', (data) => {
      console.log('Incoming call event received:', data);
      setIncomingCall({ callerId: data.callerId });
    });

    return () => {
      console.log('Cleaning up socket listeners in Dashboard');
      socket.off('connect');
      socket.off('connect_error');
      socket.off('incoming-call');
    };
  }, [socket, isConnected]);

  // Additional socket event handlers
  useEffect(() => {
    if (!socket || !isSocketReady) return;

    socket.on('user-status-change', (data) => {
      console.log('User status changed:', data);
    });

    return () => {
      socket.off('user-status-change');
    };
  }, [socket, isSocketReady]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  if (!userData) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <SocketDebug onSocketReady={setIsSocketReady} />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          {userData && (
            <div>
              <p>Welcome, {userData.name}!</p>
              <p>Email: {userData.email}</p>
              <p>Role: {userData.role}</p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Recent Activity</h2>
          <div className='space-y-2'>
            {/* Add recordings list here */}
            <p className='text-muted-foreground'>No recordings found</p>
          </div>
        </div>
      </div>

      {incomingCall && (
        <IncomingCallModal
          callerName="Unknown"
          onAccept={() => {
            // Handle accept call
            setIncomingCall(null);
          }}
          onReject={() => {
            // Handle reject call
            setIncomingCall(null);
          }}
        />
      )}
    </div>
  );
}
