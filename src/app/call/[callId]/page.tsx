'use client';

import { useEffect, useRef, useState } from 'react';
import { useWebRTC } from '@/providers/webrtc-provider';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Monitor, Circle } from 'lucide-react';

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
        // Explicitly type 'error' as 'any' or 'Error'
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
        // Explicitly type 'error' as 'any' or 'Error'
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
    <div className='h-screen bg-gray-900 text-white p-4 flex flex-col'>
      {/* Video Grid */}
      <div className='flex-1 grid grid-cols-2 gap-4 mb-4'>
        {/* Remote Video (Large) */}
        <div className='relative col-span-2 bg-gray-800 rounded-lg overflow-hidden'>
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

        {/* Local Video (Small) */}
        <div className='absolute bottom-4 right-4 w-64 aspect-video bg-gray-800 rounded-lg overflow-hidden'>
          {localVideoError ? (
            <div className='absolute inset-0 flex items-center justify-center bg-gray-800 text-red-500'>
              {localVideoError}
            </div>
          ) : (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className='w-full h-full object-cover'
              aria-label='Local Video'
            />
          )}
        </div>
      </div>

      {/* Controls */}
      <div className='flex justify-center gap-4 p-4 bg-gray-800 rounded-lg'>
        <Button
          variant={isMuted ? 'destructive' : 'secondary'}
          size='icon'
          onClick={toggleMute}
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <MicOff aria-hidden='true' /> : <Mic aria-hidden='true' />}
        </Button>

        <Button
          variant={isVideoOff ? 'destructive' : 'secondary'}
          size='icon'
          onClick={toggleVideo}
          aria-label={isVideoOff ? 'Turn On Video' : 'Turn Off Video'}
        >
          {isVideoOff ? <VideoOff aria-hidden='true' /> : <Video aria-hidden='true' />}
        </Button>

        <Button
          variant={isScreenSharing ? 'destructive' : 'secondary'}
          size='icon'
          onClick={toggleScreenShare}
          aria-label={isScreenSharing ? 'Stop Screen Sharing' : 'Start Screen Sharing'}
        >
          <Monitor aria-hidden='true' />
        </Button>

        <Button
          variant={isRecording ? 'destructive' : 'secondary'}
          size='icon'
          onClick={toggleRecording}
          aria-label={isRecording ? 'Stop Recording' : 'Start Recording'}
        >
          <Circle className={isRecording ? 'animate-pulse' : ''} aria-hidden='true' />
        </Button>

        <Button variant='destructive' size='icon' onClick={endCall} aria-label='End Call'>
          <PhoneOff aria-hidden='true' />
        </Button>
      </div>
    </div>
  );
}
