'use client';

export function FollowingActivitySkeleton() {
  return (
    <div className="animate-pulse">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="flex items-center gap-3 px-4 py-3"
          style={{ borderBottom: '0.5px solid rgba(255,255,255,0.04)' }}
        >
          <div className="w-9 h-9 rounded-full bg-white/[0.06] flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 bg-white/[0.06] rounded w-3/4" />
            <div className="h-2 bg-white/[0.04] rounded w-1/3" />
          </div>
          <div className="h-7 w-14 bg-white/[0.04] rounded-md flex-shrink-0" />
        </div>
      ))}
    </div>
  );
}
