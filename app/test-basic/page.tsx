'use client';

import { useState } from 'react';

export default function TestBasicPage() {
  const [message, setMessage] = useState('Click a button to test');

  const handleClick = () => {
    console.log('Button clicked!');
    setMessage('Button clicked successfully!');
  };

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Basic Test Page</h1>
        
        <div className="bg-gray-800 p-6 rounded-lg">
          <p className="text-white mb-4">Status: {message}</p>
          
          <button 
            onClick={handleClick}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            Test Button
          </button>
          
          <div className="mt-4 text-gray-300 text-sm">
            <p>1. Click the button above</p>
            <p>2. Check if the message changes</p>
            <p>3. Open browser console (F12) to see logs</p>
          </div>
        </div>
      </div>
    </div>
  );
}
