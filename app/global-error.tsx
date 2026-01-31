'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="bg-[#050505]">
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center px-6">
            <h1 className="text-6xl font-bold text-white/90 mb-4">500</h1>
            <h2 className="text-xl text-white/60 mb-6">Something went wrong</h2>
            <p className="text-white/40 mb-8 max-w-md">
              An unexpected error occurred. Please try again.
            </p>
            <button
              onClick={() => reset()}
              className="inline-flex items-center gap-2 px-6 py-3 bg-teal-500/90 hover:bg-teal-500 text-white font-medium rounded-lg transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
