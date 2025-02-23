"use client";

import React from 'react';
import { Button } from '@/components/ui/button';

interface IncomingCallModalProps {
  callerName: string;
  onAccept: () => void;
  onReject: () => void;
}

const IncomingCallModal: React.FC<IncomingCallModalProps> = ({ callerName, onAccept, onReject }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-bold mb-4">Incoming Call</h2>
        <p className="mb-4">You have an incoming call from {callerName}</p>
        <div className="flex justify-between">
          <Button onClick={onReject} variant="outline">Reject</Button>
          <Button onClick={onAccept}>Accept</Button>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallModal; 