import { toast } from 'sonner';
import { Socket } from 'socket.io-client';
import { SocketEvents } from '@/lib/types/socket-events';

const configuration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    // Add your TURN server configuration here
  ],
};

export async function checkCameraPermission() {
  try {
    const permissionStatus = await navigator.permissions.query({
      name: 'camera' as PermissionName,
    });
    if (permissionStatus.state === 'granted') {
      console.log('Camera permission granted.');
      return true;
    } else if (permissionStatus.state === 'prompt') {
      console.log('Camera permission needs to be requested.');
      return false;
    } else {
      console.log('Camera permission denied.');
      return false;
    }
  } catch (error) {
    console.error('Error checking camera permission:', error);
    return false;
  }
}

export const initializeMediaStream = async () => {
  try {
    // First check if devices are available
    const devices = await navigator.mediaDevices.enumerateDevices();
    const hasVideo = devices.some((device) => device.kind === 'videoinput');
    const hasAudio = devices.some((device) => device.kind === 'audioinput');

    if (!hasVideo && !hasAudio) {
      throw new Error('No media devices found');
    }

    // Try video and audio with specific constraints
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      return stream;
    } catch (err) {
      console.error('Failed to get video, trying audio only:', err);

      // Fallback to audio only
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video: false,
        });
        return audioStream;
      } catch (audioErr: any) {
        console.error('Failed to get audio:', audioErr);
        toast.error('Could not access audio device');
        throw new Error('Could not access any media devices');
      }
    }
  } catch (error: any) {
    console.error('Media initialization error:', error);
    let errorMessage = 'Failed to access media devices';

    if (error.name === 'NotReadableError') {
      errorMessage = 'Camera or microphone is in use by another application';
    } else if (error.name === 'NotAllowedError') {
      errorMessage = 'Please allow access to camera and microphone';
    } else if (error.name === 'NotFoundError') {
      errorMessage = 'No camera or microphone found';
    } else if (error.name === 'ConstraintNotSatisfiedError') {
      errorMessage = 'Your device does not support the requested media settings';
    }

    toast.error(errorMessage);
    throw error;
  }
};

export const setupPeerConnection = (
  stream: MediaStream,
  targetUserId: string,
  socket: Socket | null,
  onTrack: (stream: MediaStream) => void
) => {
  // Create new peer connection
  const peerConnection = new RTCPeerConnection(configuration);

  // Add tracks to peer connection
  stream.getTracks().forEach((track) => {
    peerConnection.addTrack(track, stream);
  });

  // Handle ICE candidates
  // Listen for ice candidate and send to server
  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      socket?.emit(SocketEvents.ICE_CANDIDATE, {
        candidate: event.candidate,
        targetUserId,
      });
    }
  };

  // Handle remote tracks
  peerConnection.ontrack = (event) => {
    console.log('Received remote track:', event.track.kind);
    // Set remote description
    // The event.streams[0] returns the remote stream
    onTrack(event.streams[0]);
  };

  return peerConnection;
};
