'use client';

import { useEffect, useRef, useState } from 'react';
import { useWebRTC } from '@/providers/webrtc-provider';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Monitor, Circle } from 'lucide-react';

// Reusable button style class
const controlButtonStyle =
  'h-12 w-12 rounded-full bg-gray-800/80 hover:bg-gray-700/80 shadow-md flex items-center justify-center';

export default function CallPage() {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [localVideoError, setLocalVideoError] = useState<string | null>(null);
  const [remoteVideoError, setRemoteVideoError] = useState<string | null>(null);

  const {
    localStream,
    remoteStream,
    isCallInProgress,
    isMuted,
    isVideoOff,
    isScreenSharing,
    isRecording,
    toggleMute,
    toggleVideo,
    toggleScreenShare,
    toggleRecording,
    endCall,
  } = useWebRTC();

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      try {
        localVideoRef.current.srcObject = localStream;
      } catch (error: any) {
        console.error('Error setting local stream:', error);
        setLocalVideoError('Failed to load local video stream.');
      }
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      try {
        remoteVideoRef.current.srcObject = remoteStream;
      } catch (error: any) {
        console.error('Error setting remote stream:', error);
        setRemoteVideoError('Failed to load remote video stream.');
      }
    }
  }, [remoteStream]);

  if (!isCallInProgress) {
    return (
      <div className='h-screen flex items-center justify-center bg-gray-900 text-white'>
        Call ended
      </div>
    );
  }

  return (
    <div className='fixed inset-0 bg-gray-900'>
      {/* Video Container */}
      <div className='relative w-full h-full'>
        {/* Remote Video */}
        <div className='absolute inset-0'>
          {remoteVideoError ? (
            <div className='absolute inset-0 flex items-center justify-center bg-gray-800 text-red-500'>
              {remoteVideoError}
            </div>
          ) : (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className='w-full h-full object-cover'
              aria-label='Remote Video'
            />
          )}
        </div>

        {/* Local Video */}
        <div className='absolute top-4 right-4 w-[30%] max-w-[200px] min-w-[120px] aspect-video rounded-lg overflow-hidden shadow-lg z-10'>
          {localVideoError ? (
            <div className='absolute inset-0 flex items-center justify-center bg-gray-800 text-red-500 text-sm'>
              {localVideoError}
            </div>
          ) : (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className='w-full h-full object-cover bg-gray-800'
              aria-label='Local Video'
            />
          )}
        </div>

        {/* Controls - Fixed at bottom with higher z-index */}
        <div className='fixed bottom-0 left-0 right-0 z-50'>
          <div className='bg-gradient-to-t from-black/90 to-transparent pt-20 pb-6 px-4'>
            <div className='flex justify-center items-center gap-2 sm:gap-4 max-w-screen-sm mx-auto'>
              <Button
                variant={isMuted ? 'destructive' : 'secondary'}
                size='icon'
                onClick={toggleMute}
                className={controlButtonStyle}
                aria-label={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? (
                  <MicOff className='h-6 w-6' aria-hidden='true' />
                ) : (
                  <Mic className='h-6 w-6' aria-hidden='true' />
                )}
              </Button>

              <Button
                variant={isVideoOff ? 'destructive' : 'secondary'}
                size='icon'
                onClick={toggleVideo}
                className={controlButtonStyle}
                aria-label={isVideoOff ? 'Turn On Video' : 'Turn Off Video'}
              >
                {isVideoOff ? (
                  <VideoOff className='h-6 w-6' aria-hidden='true' />
                ) : (
                  <Video className='h-6 w-6' aria-hidden='true' />
                )}
              </Button>

              <Button
                variant={isScreenSharing ? 'destructive' : 'secondary'}
                size='icon'
                onClick={toggleScreenShare}
                className={controlButtonStyle}
                aria-label={isScreenSharing ? 'Stop Screen Sharing' : 'Start Screen Sharing'}
              >
                <Monitor className='h-6 w-6' aria-hidden='true' />
              </Button>

              <Button
                variant={isRecording ? 'destructive' : 'secondary'}
                size='icon'
                onClick={toggleRecording}
                className={controlButtonStyle}
                aria-label={isRecording ? 'Stop Recording' : 'Start Recording'}
              >
                <Circle
                  className={`h-6 w-6 ${isRecording ? 'animate-pulse' : ''}`}
                  aria-hidden='true'
                />
              </Button>

              <Button
                variant='destructive'
                size='icon'
                onClick={endCall}
                className='h-12 w-12 rounded-full shadow-lg'
              >
                <PhoneOff className='h-6 w-6' aria-hidden='true' />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
