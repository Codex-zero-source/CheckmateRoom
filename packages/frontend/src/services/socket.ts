import { io, Socket } from 'socket.io-client';

// Create socket connection to backend
const socket: Socket = io('http://localhost:3001', {
  transports: ['websocket'],
  autoConnect: true
});

// Socket event listeners for debugging
socket.on('connect', () => {
  console.log('Connected to backend server');
});

socket.on('disconnect', () => {
  console.log('Disconnected from backend server');
});

socket.on('connect_error', (error) => {
  console.error('Socket connection error:', error);
});

export default socket; 