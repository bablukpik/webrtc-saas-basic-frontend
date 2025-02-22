import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
});

export const registerUser = async (data: { email: string; password: string }) => {
  return api.post('/auth/register', data);
};

export const loginUser = async (data: { email: string; password: string }) => {
  return api.post('/auth/login', data);
};

export const startCall = async (data: { initiatorId: string; participantId: string; callType: string }) => {
  return api.post('/call/start', data);
};

export const endCall = async (data: { callId: string }) => {
  return api.post('/call/end', data);
}; 