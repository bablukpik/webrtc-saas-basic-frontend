import { toast } from 'sonner';

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

    // Try video and audio first
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      return stream;
    } catch (err) {
      console.warn('Failed to get both audio and video, trying audio only:', err);

      // Fallback to audio only
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false,
        });
        return audioStream;
      } catch (audioErr: any) {
        console.error('Failed to get audio:', audioErr);
        toast.error(audioErr);
        throw new Error('Could not access any media devices');
      }
    }
  } catch (error: any) {
    console.error('Media initialization error:', error);

    // Provide user-friendly error messages
    let errorMessage = 'Failed to access media devices';
    if (error.name === 'NotReadableError') {
      errorMessage = 'Camera or microphone is in use by another application';
    } else if (error.name === 'NotAllowedError') {
      errorMessage = 'Please allow access to camera and microphone';
    } else if (error.name === 'NotFoundError') {
      errorMessage = 'No camera or microphone found';
    }

    toast.error(errorMessage);
    throw error;
  }
};
