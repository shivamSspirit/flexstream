'use client';

import { useAuth } from '@clerk/nextjs';

export default function TestPage() {
  const { isLoaded, isSignedIn, userId } = useAuth();

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <h1 className="text-white text-2xl font-bold mb-4">Test Page</h1>
      <div className="text-white">
        <p>Loaded: {isLoaded ? 'Yes' : 'No'}</p>
        <p>Signed In: {isSignedIn ? 'Yes' : 'No'}</p>
        <p>User ID: {userId || 'No ID'}</p>
        {isSignedIn && (
          <div>
            <p>User ID: {userId}</p>
          </div>
        )}
      </div>
    </div>
  );
}
