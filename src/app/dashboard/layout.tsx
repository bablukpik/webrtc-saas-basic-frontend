'use client';

import { useSocket } from '@/providers/socket-provider';
import { IncomingCallModal } from '@/components/IncomingCallModal';
import { SocketEvents } from '@/lib/types/socket-events';
import { useRouter } from 'next/navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { socket, incomingCall, setIncomingCall } = useSocket();
  const router = useRouter();

  const handleAcceptCall = () => {
    if (!socket || !incomingCall) return;

    socket.emit(SocketEvents.CALL_ACCEPTED, {
      targetUserId: incomingCall.callerId,
    });

    router.push(`/call/${incomingCall.callerId}`);
    setIncomingCall(null);
  };

  const handleRejectCall = () => {
    if (!socket || !incomingCall) return;

    socket.emit(SocketEvents.CALL_REJECTED, {
      targetUserId: incomingCall.callerId,
    });

    setIncomingCall(null);
  };

  return (
    <div>
      {children}
      {incomingCall && (
        <IncomingCallModal
          callerName={incomingCall.callerName}
          onAccept={handleAcceptCall}
          onReject={handleRejectCall}
        />
      )}
    </div>
  );
}
