import { io, Socket } from 'socket.io-client';

class SocketClient {
  private static instance: Socket | null = null;

  public static getInstance(): Socket {
    if (!SocketClient.instance) {
      SocketClient.instance = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5001');
      
      // Add global event listeners
      SocketClient.instance.on('connect', () => {
        console.log('Socket connected with ID:', SocketClient.instance?.id);
      });

      SocketClient.instance.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });

      SocketClient.instance.on('disconnect', () => {
        console.log('Socket disconnected');
      });
    }
    return SocketClient.instance;
  }
}

export const socket = SocketClient.getInstance(); 