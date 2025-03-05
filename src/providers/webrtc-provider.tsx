'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
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
  callingUserId: string | null;
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
  callingUserId: null,
  startCall: async () => {},
  endCall: () => {},
  toggleMute: () => {},
  toggleVideo: () => {},
  toggleScreenShare: async () => {},
  toggleRecording: () => {},
  acceptCall: async () => {},
  rejectCall: () => {},
  initiateCall: () => {},
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
  const [callingUserId, setCallingUserId] = useState<string | null>(null);

  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const recordedChunks = useRef<Blob[]>([]);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      mediaRecorder.current?.stop();
      setIsRecording(false);
    } else {
      const stream = new MediaStream([...localStream!.getTracks(), ...remoteStream!.getTracks()]);

      const recorder = new MediaRecorder(stream);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunks.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunks.current, {
          type: 'video/webm',
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
  }, [isRecording, localStream, remoteStream]);

  const endCall = useCallback(() => {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
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
    setCallingUserId(null);
  }, [localStream, isRecording, toggleRecording]);

  const initiateCall = useCallback(
    async (targetUserId: string) => {
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
      setCallingUserId(targetUserId);

      try {
        // First check if user is available
        socket.emit(SocketEvents.CHECK_USER_AVAILABILITY, { targetUserId });

        // Wait for availability response
        socket.once(SocketEvents.USER_AVAILABILITY_RESPONSE, async (response) => {
          console.log('User availability response:', response);

          if (response.isAvailable) {
            console.log('Initiating call to:', targetUserId);

            // Get local media stream
            const stream = await navigator.mediaDevices.getUserMedia({
              video: true,
              audio: true,
            });
            setLocalStream(stream);

            // Create and setup peer connection
            peerConnection.current = new RTCPeerConnection(configuration);

            // Add tracks to peer connection
            stream.getTracks().forEach((track) => {
              if (!peerConnection.current) return;
              peerConnection.current.addTrack(track, stream);
            });

            // Handle ICE candidates
            peerConnection.current.onicecandidate = (event) => {
              if (event.candidate) {
                socket.emit(SocketEvents.ICE_CANDIDATE, {
                  candidate: event.candidate,
                  targetUserId,
                });
              }
            };

            // Create and send offer
            const offer = await peerConnection.current.createOffer();
            await peerConnection.current.setLocalDescription(offer);

            // Emit call initiation event with offer
            socket.emit(SocketEvents.INITIATE_CALL, {
              targetUserId,
              callerId: currentUserId,
              callerName: currentUserName,
              offer,
            });

            // Listen for call rejection
            socket.once(SocketEvents.CALL_REJECTED, () => {
              toast.error('Call was rejected');
              setIsCallInProgress(false);
              setCallingUserId(null);
              endCall();
            });
          } else {
            toast.error('User is not available');
            setIsCallInProgress(false);
            setCallingUserId(null);
          }
        });

        // Set timeout for call
        setTimeout(() => {
          if (isCallInProgress) {
            setIsCallInProgress(false);
            setCallingUserId(null);
            toast.error('Call timed out');
            socket.emit(SocketEvents.CANCEL_CALL, { targetUserId });
            endCall();
          }
        }, 30000);
      } catch (error) {
        console.error('Error initiating call:', error);
        toast.error('Failed to initiate call');
        setIsCallInProgress(false);
        setCallingUserId(null);
        endCall();
      }
    },
    [socket, isCallInProgress, endCall]
  );

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

  const toggleScreenShare = useCallback(async () => {
    if (!peerConnection.current || !localStream) return;

    try {
      if (isScreenSharing) {
        // Switch back to camera
        const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const videoTrack = cameraStream.getVideoTracks()[0];

        const sender = peerConnection.current.getSenders().find((s) => s.track?.kind === 'video');

        if (sender) {
          await sender.replaceTrack(videoTrack);
        }

        setLocalStream(cameraStream);
      } else {
        // Switch to screen sharing
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];

        const sender = peerConnection.current.getSenders().find((s) => s.track?.kind === 'video');

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
  }, [isScreenSharing, localStream]);

  const acceptCall = useCallback(
    async (callerId: string, offer: RTCSessionDescriptionInit) => {
      try {
        console.log('Accepting call from:', callerId);

        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setLocalStream(stream);

        peerConnection.current = new RTCPeerConnection(configuration);

        stream.getTracks().forEach((track) => {
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
            socket?.emit(SocketEvents.ICE_CANDIDATE, {
              candidate: event.candidate,
              targetUserId: callerId,
            });
          }
        };

        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peerConnection.current.createAnswer();
        await peerConnection.current.setLocalDescription(answer);

        console.log('Sending call answer to:', callerId);
        socket?.emit(SocketEvents.CALL_ACCEPTED, {
          targetUserId: callerId,
          answer,
        });

        setIsCallInProgress(true);
        // Navigate recipient to call page
        router.push(`/call/${callerId}`);
      } catch (error) {
        console.error('Error accepting call:', error);
        toast.error('Failed to accept call');
        setCallingUserId(null);
        endCall();
      }
    },
    [router, socket, endCall]
  );

  const rejectCall = useCallback(
    (callerId: string) => {
      socket?.emit(SocketEvents.CALL_REJECTED, { targetUserId: callerId });
    },
    [socket]
  );

  useEffect(() => {
    if (!socket) return;

    socket.on(SocketEvents.INCOMING_CALL, async ({ callerId, callerName, offer }) => {
      console.log('[WebRTC] Received incoming call from:', callerName, '(ID:', callerId, ')');
      setIncomingCall({
        callerId,
        callerName: callerName || 'Unknown User',
        offer: offer || ({} as RTCSessionDescriptionInit),
      });
    });

    socket.on(SocketEvents.CALL_ANSWER, async ({ answer, userId }) => {
      console.log('Call answered by:', userId);
      if (!peerConnection.current) return;

      try {
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
      } catch (error) {
        console.error('Error setting remote description:', error);
      }
    });

    socket.on(SocketEvents.ICE_CANDIDATE, async ({ candidate, userId }) => {
      if (!peerConnection.current) return;
      try {
        await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.error('Error adding ICE candidate:', error);
      }
    });

    socket.on(SocketEvents.CALL_REJECTED, () => {
      toast.error('Call was rejected');
      setIsCallInProgress(false);
      setCallingUserId(null);
      endCall();
    });

    socket.on(SocketEvents.CALL_ENDED, () => {
      endCall();
    });

    socket.on(SocketEvents.CALL_ACCEPTED, async ({ answer }) => {
      if (!peerConnection.current) return;

      try {
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
        // The caller will be navigated to the call page after setting remote description
        if (callingUserId) {
          router.push(`/call/${callingUserId}`);
        }
      } catch (error) {
        console.error('Error setting remote description:', error);
        toast.error('Failed to establish connection');
        setCallingUserId(null);
        endCall();
      }
    });

    return () => {
      socket.off(SocketEvents.INCOMING_CALL);
      socket.off(SocketEvents.CALL_ANSWER);
      socket.off(SocketEvents.CALL_ACCEPTED);
      socket.off(SocketEvents.ICE_CANDIDATE);
      socket.off(SocketEvents.CALL_REJECTED);
      socket.off(SocketEvents.CALL_ENDED);
    };
  }, [socket, router, callingUserId, endCall]);

  return (
    <WebRTCContext.Provider
      value={{
        localStream,
        remoteStream,
        peerConnection: peerConnection.current,
        isCallInProgress,
        isMuted,
        isVideoOff,
        isScreenSharing,
        isRecording,
        callingUserId,
        startCall: initiateCall,
        endCall,
        toggleMute,
        toggleVideo,
        toggleScreenShare,
        toggleRecording,
        acceptCall,
        rejectCall,
        initiateCall,
      }}
    >
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
