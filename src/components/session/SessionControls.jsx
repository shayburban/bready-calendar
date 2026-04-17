import React from 'react';
// This component will contain controls for the live session,
// such as recording, AI summary, and language simplification.
export default function SessionControls() {
    return (
        <div className="mt-4 flex items-center justify-center space-x-4">
            <button className="p-2 bg-red-500 rounded-full">Record</button>
            <button className="p-2 bg-blue-500 rounded">AI Summary</button>
            <button className="p-2 bg-green-500 rounded">Simplify Language</button>
        </div>
    );
}