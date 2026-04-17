import React from 'react';
// This page will host the live tutoring session.
// NOTE: Real-time video/audio requires backend functions for WebRTC integration,
// which is beyond the standard platform capabilities. I will mock the interface.
import VideoChat from '../components/session/VideoChat';
import LiveChat from '../components/session/LiveChat';
import SessionControls from '../components/session/SessionControls';

export default function LiveSession() {
  return (
    <div className="flex h-screen bg-gray-900 text-white">
      <div className="flex-grow flex flex-col p-4">
        <h2 className="text-xl mb-4">Live Session with [Student Name]</h2>
        <VideoChat />
        <SessionControls />
      </div>
      <div className="w-80 bg-gray-800 p-4">
        <LiveChat />
      </div>
    </div>
  );
}