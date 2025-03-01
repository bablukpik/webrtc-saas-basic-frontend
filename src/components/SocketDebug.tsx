'use client';

import { useEffect, useState } from 'react';
import { useSocket } from '@/providers/socket-provider';

interface SocketDebugProps {
  onSocketReady?: (isConnected: boolean) => void;
}

export const SocketDebug = ({ onSocketReady }: SocketDebugProps) => {
  const { socket, isConnected } = useSocket();
  const [status, setStatus] = useState('Initializing...');

  useEffect(() => {
    if (!socket) {
      setStatus('Socket not initialized');
      onSocketReady?.(false);
      return;
    }

    if (isConnected) {
      setStatus(`Connected (ID: ${socket.id})`);
      onSocketReady?.(true);
    } else {
      setStatus('Disconnected');
      onSocketReady?.(false);
    }
  }, [socket, isConnected, onSocketReady]);

  return (
    <div className="hidden">
      Socket Status: {status}
    </div>
  );
}; 