"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function Call() {
  const [callId, setCallId] = useState<string | null>(null);
  const router = useRouter();

  const handleStartCall = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('You must be logged in to start a call.');
      return;
    }

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/call/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        initiatorId: 'your-initiator-id', // Replace with actual initiator ID
        participantId: 'your-participant-id', // Replace with actual participant ID
        callType: 'VIDEO', // or 'AUDIO', 'SCREEN_SHARE'
      }),
    });

    if (res.ok) {
      const callData = await res.json();
      setCallId(callData.id); // Set the Call ID
      console.log('Call started with ID:', callData.id);
    } else {
      const { message } = await res.json();
      alert(message);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-3xl font-bold">Start a Call</h1>
      <input
        type="text"
        placeholder="Call ID (auto-generated)"
        value={callId || ''}
        readOnly
        className="border p-2 mb-4"
      />
      <Button onClick={handleStartCall}>Start Call</Button>
    </div>
  );
} 