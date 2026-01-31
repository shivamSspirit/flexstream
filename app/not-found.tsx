import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505]">
      <div className="text-center px-6">
        <h1 className="text-6xl font-bold text-white/90 mb-4">404</h1>
        <h2 className="text-xl text-white/60 mb-6">Page not found</h2>
        <p className="text-white/40 mb-8 max-w-md">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-teal-500/90 hover:bg-teal-500 text-white font-medium rounded-lg transition-colors"
        >
          Go back home
        </Link>
      </div>
    </div>
  );
}
