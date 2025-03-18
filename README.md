# WebRTC SaaS Platform - Frontend

A Next.js-based frontend for WebRTC video calling platform.

## Features

- Real-time video/audio calling
- Screen sharing capability
- Call recording
- User management
- Responsive design
- Modern UI with Shadcn UI
- WebRTC integration

## Tech Stack

- Next.js 15 (App Router)
- TypeScript
- WebRTC API
- Socket.IO Client
- Redux Toolkit + RTK Query
- Shadcn UI
- Tailwind CSS
- Sonner (Toast notifications)

## Prerequisites

- Node.js >= 18
- Backend server running

## Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL="http://localhost:5000"
NEXT_PUBLIC_SOCKET_URL="http://localhost:5000"
NEXT_PUBLIC_TURN_SERVER_URL="your-turn-server-url"
NEXT_PUBLIC_TURN_USERNAME="your-turn-username"
NEXT_PUBLIC_TURN_PASSWORD="your-turn-password"
```

## Installation

1. Install dependencies

```bash
npm install
```

2. Run the development server

```bash
npm run dev
```

## Project Structure

```
frontend/
├── src/
│ ├── app/ # App router pages
│ ├── components/ # Reusable components
│ ├── lib/ # Utilities and configurations
│ ├── providers/ # Context providers
│ ├── store/ # Redux store
│ └── utils/ # Helper functions
```

## Key Components

### WebRTC Provider

- Manages WebRTC connections
- Handles media streams
- Manages call state
- Implements screen sharing
- Handles call recording

### Socket Provider

- Manages Socket.IO connection
- Handles real-time events
- Maintains connection state

### Call Page

- Displays video streams
- Provides call controls
- Handles screen sharing
- Manages recording

### User Management

- Lists available users
- Initiates calls
- Manages user roles
- Handles user deletion

## WebRTC Implementation

### Media Handling

```typescript
const initializeMediaStream = async () => {
  // Get user media with fallbacks
  // Handle permissions
  // Configure constraints
};
```

### Connection Setup

```typescript
const setupPeerConnection = (
  stream: MediaStream,
  targetUserId: string,
  socket: Socket,
  onTrack: (stream: MediaStream) => void
) => {
  // Create RTCPeerConnection
  // Add tracks
  // Handle ICE candidates
  // Set up event handlers
};
```

## State Management

- User authentication state
- Call status
- Media stream states
- Connection status
- Recording state

## Error Handling

- Media access errors
- Connection failures
- Permission denials
- Network issues

## Best Practices

1. Always clean up media streams
2. Handle permissions properly
3. Implement proper error feedback
4. Maintain consistent state
5. Follow WebRTC security guidelines

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT
