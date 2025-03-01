'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useSocket } from './socket-provider';
import { SocketEvents } from '@/lib/types/socket-events';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { IncomingCallModal } from '@/components/IncomingCallModal';

interface WebRTCContextType {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  peerConnection: RTCPeerConnection | null;
  isCallInProgress: boolean;
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
  isRecording: boolean;
  startCall: (targetUserId: string) => Promise<void>;
  endCall: () => void;
  toggleMute: () => void;
  toggleVideo: () => void;
  toggleScreenShare: () => Promise<void>;
  toggleRecording: () => void;
  acceptCall: (callerId: string, offer: RTCSessionDescriptionInit) => Promise<void>;
  rejectCall: (callerId: string) => void;
  initiateCall: (targetUserId: string) => void;
}

const WebRTCContext = createContext<WebRTCContextType>({
  localStream: null,
  remoteStream: null,
  peerConnection: null,
  isCallInProgress: false,
  isMuted: false,
  isVideoOff: false,
  isScreenSharing: false,
  isRecording: false,
  startCall: async () => {},
  endCall: () => {},
  toggleMute: () => {},
  toggleVideo: () => {},
  toggleScreenShare: async () => {},
  toggleRecording: () => {},
  acceptCall: async () => {},
  rejectCall: () => {},
  initiateCall: () => {}
});

export const useWebRTC = () => {
  return useContext(WebRTCContext);
};

const configuration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    // Add your TURN server configuration here
  ],
};

export function WebRTCProvider({ children }: { children: React.ReactNode }) {
  const { socket } = useSocket();
  const router = useRouter();
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isCallInProgress, setIsCallInProgress] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [incomingCall, setIncomingCall] = useState<{
    callerId: string;
    callerName: string;
    offer: RTCSessionDescriptionInit;
  } | null>(null);

  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const recordedChunks = useRef<Blob[]>([]);

  useEffect(() => {
    if (!socket) return;

    // Listen for incoming call
    socket.on('incoming-call', async ({ callerId, callerName }) => {
      console.log('[WebRTC] Received incoming call from:', callerName, '(ID:', callerId, ')');
      
      // Show incoming call modal
      setIncomingCall({
        callerId,
        callerName: callerName || 'Unknown User',
        offer: {} as RTCSessionDescriptionInit // We'll get this after accepting
      });

      // Play ringtone
      try {
        const audio = new Audio('/incoming-call.mp3');
        audio.loop = true;
        audio.play().catch(err => console.error('Failed to play ringtone:', err));
        
        // Store audio element reference for cleanup
        const audioRef = audio;
        return () => {
          audioRef.pause();
          audioRef.currentTime = 0;
        };
      } catch (err) {
        console.error('Error playing ringtone:', err);
      }
    });

    // Debug all socket events
    socket.onAny((event, ...args) => {
      console.log(`[WebRTC] Socket event: ${event}`, args);
    });

    socket.on('call-answer', async ({ answer, userId }) => {
      console.log('Call answered by:', userId);
      if (!peerConnection.current) return;
      
      try {
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
      } catch (error) {
        console.error('Error setting remote description:', error);
      }
    });

    socket.on('ice-candidate', async ({ candidate, userId }) => {
      if (!peerConnection.current) return;
      
      try {
        await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.error('Error adding ICE candidate:', error);
      }
    });

    socket.on('call-rejected', () => {
      toast.error('Call Rejected', {
        description: 'The other user rejected your call'
      });
      endCall();
    });

    socket.on('call-ended', () => {
      endCall();
    });

    return () => {
      socket.off('incoming-call');
      socket.off('call-answer');
      socket.off('ice-candidate');
      socket.off('call-rejected');
      socket.off('call-ended');
      setIncomingCall(null);
    };
  }, [socket]);

  const startCall = async (targetUserId: string) => {
    try {
      console.log('[WebRTC] Starting call to:', targetUserId);
      
      if (!socket?.connected) {
        throw new Error('Socket not connected');
      }

      // First, check if user is available
      socket.emit('check-user-availability', { targetUserId });

      socket.once('user-availability-response', async (response) => {
        if (!response.isAvailable) {
          toast.error('User is not available');
          return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        
        console.log('[WebRTC] Got local media stream');
        setLocalStream(stream);

        peerConnection.current = new RTCPeerConnection(configuration);
        console.log('[WebRTC] Created peer connection');
        
        // Add all tracks to the peer connection
        stream.getTracks().forEach(track => {
          if (!peerConnection.current) return;
          peerConnection.current.addTrack(track, stream);
        });

        // Handle ICE candidates
        peerConnection.current.onicecandidate = (event) => {
          if (event.candidate) {
            console.log('[WebRTC] New ICE candidate');
            socket?.emit('ice-candidate', {
              candidate: event.candidate,
              targetUserId,
            });
          }
        };

        // Create and send offer
        const offer = await peerConnection.current.createOffer();
        await peerConnection.current.setLocalDescription(offer);
        
        console.log('[WebRTC] Created and set local offer');

        // Emit the call event
        socket.emit('initiate-call', { 
          targetUserId,
          offer,
          callerId: localStorage.getItem('userId'),
          callerName: localStorage.getItem('userName') || 'Unknown User'
        });
        
        console.log('[WebRTC] Sent call offer to:', targetUserId);
      });
      
      // Set a timeout for the call
      const timeout = setTimeout(() => {
        if (!isCallInProgress) {
          console.log('[WebRTC] Call timed out');
          toast.error('Call timed out. User might be unavailable.');
          endCall();
        }
      }, 30000);

      return () => clearTimeout(timeout);
    } catch (error) {
      console.error('[WebRTC] Error starting call:', error);
      toast.error('Failed to start call');
      endCall();
    }
  };

  const endCall = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    if (peerConnection.current) {
      peerConnection.current.close();
    }
    setLocalStream(null);
    setRemoteStream(null);
    setIsCallInProgress(false);
    setIsScreenSharing(false);
    if (isRecording) {
      toggleRecording();
    }
  };

  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      audioTrack.enabled = !audioTrack.enabled;
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      videoTrack.enabled = !videoTrack.enabled;
      setIsVideoOff(!isVideoOff);
    }
  };

  const toggleScreenShare = async () => {
    if (!peerConnection.current || !localStream) return;

    try {
      if (isScreenSharing) {
        // Switch back to camera
        const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const videoTrack = cameraStream.getVideoTracks()[0];
        
        const sender = peerConnection.current.getSenders().find(s => 
          s.track?.kind === 'video'
        );
        
        if (sender) {
          await sender.replaceTrack(videoTrack);
        }
        
        setLocalStream(cameraStream);
      } else {
        // Switch to screen sharing
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];
        
        const sender = peerConnection.current.getSenders().find(s => 
          s.track?.kind === 'video'
        );
        
        if (sender) {
          await sender.replaceTrack(screenTrack);
        }
        
        screenTrack.onended = () => {
          toggleScreenShare();
        };
        
        setLocalStream(screenStream);
      }
      setIsScreenSharing(!isScreenSharing);
    } catch (error) {
      console.error('Error toggling screen share:', error);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      mediaRecorder.current?.stop();
      setIsRecording(false);
    } else {
      const stream = new MediaStream([
        ...localStream!.getTracks(),
        ...remoteStream!.getTracks()
      ]);
      
      const recorder = new MediaRecorder(stream);
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunks.current.push(event.data);
        }
      };
      
      recorder.onstop = () => {
        const blob = new Blob(recordedChunks.current, {
          type: 'video/webm'
        });
        // Handle the recorded blob (e.g., upload to server or download)
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'recording.webm';
        a.click();
        recordedChunks.current = [];
      };
      
      mediaRecorder.current = recorder;
      recorder.start();
      setIsRecording(true);
    }
  };

  const acceptCall = async (callerId: string, offer: RTCSessionDescriptionInit) => {
    try {
      console.log('Accepting call from:', callerId);
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setLocalStream(stream);

      peerConnection.current = new RTCPeerConnection(configuration);
      
      stream.getTracks().forEach(track => {
        if (!peerConnection.current) return;
        peerConnection.current.addTrack(track, stream);
      });

      peerConnection.current.ontrack = (event) => {
        console.log('Received remote track:', event.track.kind);
        setRemoteStream(event.streams[0]);
      };

      peerConnection.current.onicecandidate = (event) => {
        if (event.candidate) {
          console.log('Sending ICE candidate to:', callerId);
          socket?.emit('ice-candidate', {
            candidate: event.candidate,
            targetUserId: callerId,
          });
        }
      };

      await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);

      console.log('Sending call answer to:', callerId);
      socket?.emit('call-answer', { 
        targetUserId: callerId,
        answer 
      });

      setIsCallInProgress(true);
    } catch (error) {
      console.error('Error accepting call:', error);
      toast.error('Failed to accept call');
      endCall();
    }
  };

  const rejectCall = (callerId: string) => {
    socket?.emit('reject-call', { targetUserId: callerId });
  };

  const initiateCall = async (targetUserId: string) => {
    if (!socket) {
      toast.error('Socket connection not available');
      return;
    }

    if (isCallInProgress) {
      toast.error('Call already in progress');
      return;
    }

    const currentUserId = localStorage.getItem('userId');
    const currentUserName = localStorage.getItem('userName');

    if (!currentUserId || !currentUserName) {
      toast.error('User not authenticated');
      return;
    }

    console.log('Checking user availability:', targetUserId);
    setIsCallInProgress(true);

    // First check if user is available
    socket.emit(SocketEvents.CHECK_USER_AVAILABILITY, {
      targetUserId
    });

    // Wait for availability response
    socket.once(SocketEvents.USER_AVAILABILITY_RESPONSE, (response) => {
      console.log('User availability response:', response);
      
      if (response.isAvailable) {
        console.log('Initiating call to:', targetUserId);
        
        // Emit call initiation event
        socket.emit(SocketEvents.INITIATE_CALL, {
          targetUserId,
          callerId: currentUserId,
          callerName: currentUserName
        });

        // Listen for call rejection
        socket.once(SocketEvents.CALL_REJECTED, () => {
          toast.error('Call was rejected');
          setIsCallInProgress(false);
        });

        // Listen for call acceptance
        socket.once(SocketEvents.CALL_ACCEPTED, () => {
          console.log('Call accepted, navigating to call page');
          router.push(`/call/${targetUserId}`);
        });

        // Set timeout for call
        setTimeout(() => {
          if (isCallInProgress) {
            setIsCallInProgress(false);
            toast.error('Call timed out. User might be unavailable.');
            socket.emit(SocketEvents.CANCEL_CALL, { targetUserId });
          }
        }, 30000);

      } else {
        toast.error('User is not available');
        setIsCallInProgress(false);
      }
    });

    // Listen for call errors
    socket.once(SocketEvents.CALL_ERROR, (error) => {
      console.error('Call error:', error);
      toast.error(error.message || 'Failed to initiate call');
      setIsCallInProgress(false);
    });
  };

  return (
    <WebRTCContext.Provider value={{
      localStream,
      remoteStream,
      peerConnection: peerConnection.current,
      isCallInProgress,
      isMuted,
      isVideoOff,
      isScreenSharing,
      isRecording,
      startCall,
      endCall,
      toggleMute,
      toggleVideo,
      toggleScreenShare,
      toggleRecording,
      acceptCall,
      rejectCall,
      initiateCall
    }}>
      {children}
      {incomingCall && (
        <IncomingCallModal
          callerName={incomingCall.callerName}
          onAccept={() => {
            acceptCall(incomingCall.callerId, incomingCall.offer);
            setIncomingCall(null);
          }}
          onReject={() => {
            rejectCall(incomingCall.callerId);
            setIncomingCall(null);
          }}
        />
      )}
    </WebRTCContext.Provider>
  );
} 