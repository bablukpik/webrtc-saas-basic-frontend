'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { SocketEvents } from '@/lib/types/socket-events';
import { toast } from 'sonner';
import { usePathname } from 'next/navigation';
import { publicRoutes } from '@/utils/auth';
import { useGetCurrentUserQuery } from '@/lib/redux/api/usersApi';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const useSocket = () => {
  return useContext(SocketContext);
};

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const pathname = usePathname();
  const isPublicRoute = publicRoutes.includes(pathname);

  // Skip query on public pages
  const { data: user } = useGetCurrentUserQuery(undefined, {
    skip: isPublicRoute,
  });

  // Socket Connection Initialization Effect
  useEffect(() => {
    // Don't initialize socket on public pages
    if (isPublicRoute || !user) {
      console.log('No user credentials found');
      return;
    }

    console.log('Initializing socket connection');

    const socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000', {
      // auth: { token, userId, userName },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketInstance.on('connect', () => {
      console.log('Socket connected with ID:', socketInstance.id);
      setIsConnected(true);

      // Register user when socket connects
      socketInstance.emit(SocketEvents.REGISTER_USER, {
        userId: user.id,
        userName: user.name,
        socketId: socketInstance.id,
      });
    });

    socketInstance.on(SocketEvents.USER_REGISTERED, (response) => {
      console.log('User registered:', response);
      if (!response.success) {
        toast.error('Failed to register user with socket server');
      }
    });

    socketInstance.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      toast.error('Failed to connect to server');
    });

    socketInstance.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      if (socketInstance) {
        console.log('Cleaning up socket connection');
        socketInstance.disconnect();
      }
    };
  }, [user, isPublicRoute]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>{children}</SocketContext.Provider>
  );
}
