import React, { useEffect, useRef, useState } from 'react';
import { socket } from '@/lib/socket';

const Call = ({ roomId }: { roomId: string }) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const socketRef = useRef<any>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);

  useEffect(() => {
    socketRef.current = socket;
    socketRef.current.emit('join', roomId);

    socketRef.current.on('offer', async (data: any) => {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data));
        const answer = await peerConnectionRef.current.createAnswer();
        await peerConnectionRef.current.setLocalDescription(answer);
        socketRef.current.emit('answer', { sdp: answer, roomId });
      }
    });

    socketRef.current.on('answer', (data: any) => {
      if (peerConnectionRef.current) {
        peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data));
      }
    });

    socketRef.current.on('ice-candidate', (data: any) => {
      if (peerConnectionRef.current) {
        peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
      }
    });

    const initPeerConnection = () => {
      peerConnectionRef.current = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'turn:your-turn-server', username: 'your-username', credential: 'your-credential' },
        ],
      });

      peerConnectionRef.current.onicecandidate = (event) => {
        if (event.candidate) {
          socketRef.current.emit('ice-candidate', { candidate: event.candidate, roomId });
        }
      };

      peerConnectionRef.current.ontrack = (event) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        stream.getTracks().forEach((track) => {
          peerConnectionRef.current?.addTrack(track, stream);
        });
      });
    };

    initPeerConnection();

    return () => {
      socketRef.current.disconnect();
      peerConnectionRef.current?.close();
    };
  }, [roomId]);

  const startRecording = () => {
    if (localVideoRef.current) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setRecordedChunks((prev) => [...prev, event.data]);
        }
      };
      recorder.onstop = async () => {
        const blob = new Blob(recordedChunks, { type: 'video/webm' });
        const fileUrl = await uploadToS3(blob); // Implement this function to upload to S3
        // Save the recording to the database
        await saveRecording(fileUrl);
      };
      recorder.start();
      setMediaRecorder(recorder);
    }
  };

  const stopRecording = () => {
    mediaRecorder?.stop();
  };

  const startScreenShare = async () => {
    const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
    if (peerConnectionRef.current) {
      screenStream.getTracks().forEach((track) => {
        peerConnectionRef.current.addTrack(track, screenStream);
      });
    }
  };

  return (
    <div>
      <video ref={localVideoRef} autoPlay muted />
      <video ref={remoteVideoRef} autoPlay />
      <button onClick={startRecording}>Start Recording</button>
      <button onClick={stopRecording}>Stop Recording</button>
      <button onClick={startScreenShare}>Share Screen</button>
    </div>
  );
};

export default Call; 