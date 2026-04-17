import React from 'react';
// This component mocks the live chat during a session.
// It could be made partially functional by polling the Session entity.
export default function LiveChat() {
    return (
        <div className="h-full flex flex-col">
            <h3 className="font-bold mb-2">Live Chat</h3>
            <div className="flex-grow bg-gray-700 rounded p-2">
                <p className="text-sm">[Student]: Hi! Can we go over calculus?</p>
            </div>
            <input type="text" placeholder="Type a message..." className="w-full mt-2 p-2 rounded bg-gray-600 border-gray-500" />
        </div>
    );
}