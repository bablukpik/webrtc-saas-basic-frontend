'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useSocket } from './socket-provider';
import { SocketEvents } from '@/lib/types/socket-events';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { IncomingCallModal } from '@/components/IncomingCallModal';
import { checkCameraPermission, initializeMediaStream, setupPeerConnection } from '@/utils/webrtc';

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
  const callTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
    // Clean up media streams
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        track.stop();
      });
    }

    // Clean up peer connection
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }

    // Notify the other user that the call has ended
    if (socket && callingUserId) {
      socket.emit(SocketEvents.CALL_ENDED, { targetUserId: callingUserId });
    }

    // Clean up recording if active
    if (isRecording) {
      toggleRecording();
    }

    // Reset all states
    setLocalStream(null);
    setRemoteStream(null);
    setIsCallInProgress(false);
    setIsScreenSharing(false);
    setCallingUserId(null);
    setIsMuted(false);
    setIsVideoOff(false);
    setIncomingCall(null);

    // Show toast and navigate to users page
    toast.info('Call ended');
    router.push('/users');
  }, [localStream, socket, callingUserId, isRecording, toggleRecording, router]);

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

      // Check camera permission before initiating call
      // const hasPermission = await checkCameraPermission();
      // if (!hasPermission) {
      //   toast.error('Camera permission is required to make a call');
      //   return;
      // }

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
            // const stream = await navigator.mediaDevices.getUserMedia({
            //   video: true,
            //   audio: true,
            // });

            // Initialize media with error handling
            const stream = await initializeMediaStream();
            setLocalStream(stream);
            peerConnection.current = setupPeerConnection(
              stream,
              targetUserId,
              socket,
              (remoteStream) => setRemoteStream(remoteStream)
            );

            // Create and send offer
            const offer = await peerConnection.current!.createOffer();
            await peerConnection.current!.setLocalDescription(offer);

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

  const toggleMute = useCallback(() => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      audioTrack.enabled = !audioTrack.enabled;
      setIsMuted(!isMuted);
    }
  }, [localStream, isMuted]);

  const toggleVideo = useCallback(async () => {
    if (!localStream) return;

    try {
      const videoTracks = localStream.getVideoTracks();

      if (videoTracks.length > 0) {
        // If we have video tracks, just toggle enable/disable
        const videoTrack = videoTracks[0];
        videoTrack.enabled = !videoTrack.enabled;
      }
      setIsVideoOff(!isVideoOff);
    } catch (error: any) {
      console.error('Error toggling video:', error);
      toast.error('Failed to toggle video');
    }
  }, [localStream, isVideoOff]);

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

  const rejectCall = useCallback(
    (callerId: string) => {
      socket?.emit(SocketEvents.CALL_REJECTED, { targetUserId: callerId });
    },
    [socket]
  );

  const acceptCall = useCallback(
    async (callerId: string, offer: RTCSessionDescriptionInit) => {
      try {
        console.log('Accepting call from:', callerId);

        const hasPermission = await checkCameraPermission();
        if (!hasPermission) {
          toast.error('Camera permission is required to accept the call.');
          rejectCall(callerId); // reject the call if no camera permission
          return;
        }

        let stream;
        try {
          stream = await initializeMediaStream();
        } catch (error: any) {
          console.error('Error getting user media:', error.name, error.message, error.constraint);
          toast.error(`Failed to access camera: ${error.name} - ${error.message}`);
          rejectCall(callerId); // reject call if no camera access
          return;
        }

        setLocalStream(stream);
        peerConnection.current = setupPeerConnection(
          stream,
          callerId,
          socket,
          (remoteStream) => setRemoteStream(remoteStream)
        );

        await peerConnection.current!.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peerConnection.current!.createAnswer();
        await peerConnection.current!.setLocalDescription(answer);

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
    [router, socket, endCall, rejectCall]
  );

  // Handle incoming calls
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
      // Show toast and navigate to users page for the other user
      toast.info('Call ended by other user');
      endCall();
    });

    socket.on(SocketEvents.CALL_ACCEPTED, async ({ answer }) => {
      if (!peerConnection.current) return;

      try {
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));

        // Clear the timeout when call is accepted
        if (callTimeoutRef.current) {
          clearTimeout(callTimeoutRef.current);
        }

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

  // Handle timeout for call initiation
  useEffect(() => {
    if (isCallInProgress && !remoteStream) {
      // Set timeout only if we're initiating the call (not when receiving)
      // Only cancel if we're still in the calling state (not connected)
      callTimeoutRef.current = setTimeout(() => {
        toast.error('Call timed out');
        socket?.emit(SocketEvents.CANCEL_CALL, { targetUserId: callingUserId });
        endCall();
      }, 30000);
    }

    return () => {
      if (callTimeoutRef.current) {
        clearTimeout(callTimeoutRef.current);
      }
    };
  }, [isCallInProgress, callingUserId, socket, endCall, remoteStream]);

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
