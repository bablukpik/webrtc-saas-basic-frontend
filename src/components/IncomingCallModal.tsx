"use client";

import React, { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface IncomingCallModalProps {
  callerName: string;
  onAccept: () => void;
  onReject: () => void;
}

export const IncomingCallModal = ({
  callerName,
  onAccept,
  onReject,
}: IncomingCallModalProps) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Play ringtone when modal appears
    audioRef.current = new Audio('/incoming-call.mp3');
    audioRef.current.loop = true;
    audioRef.current.play().catch(err => console.error('Failed to play ringtone:', err));

    // Cleanup
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-[400px] shadow-lg animate-in zoom-in-90">
        <CardHeader>
          <CardTitle>Incoming Call</CardTitle>
          <CardDescription>{callerName} is calling you</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-8 h-8 text-primary animate-pulse"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14.25 9.75v-4.5m0 4.5h4.5m-4.5 0l6-6m-3 18c-8.284 0-15-6.716-15-15V4.5A2.25 2.25 0 014.5 2.25h1.372c.516 0 .966.351 1.091.852l1.106 4.423c.11.44-.054.902-.417 1.173l-1.293.97a1.062 1.062 0 00-.38 1.21 12.035 12.035 0 007.143 7.143c.441.162.928-.004 1.21-.38l.97-1.293a1.125 1.125 0 011.173-.417l4.423 1.106c.5.125.852.575.852 1.091V19.5a2.25 2.25 0 01-2.25 2.25h-2.25z"
                />
              </svg>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between gap-4">
          <Button
            variant="destructive"
            className="w-full"
            onClick={() => {
              if (audioRef.current) {
                audioRef.current.pause();
              }
              onReject();
            }}
          >
            Decline
          </Button>
          <Button
            variant="default"
            className="w-full"
            onClick={() => {
              if (audioRef.current) {
                audioRef.current.pause();
              }
              onAccept();
            }}
          >
            Accept
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}; 