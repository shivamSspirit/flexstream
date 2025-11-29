interface LoadingSpinnerProps {
  message?: string;
  submessage?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function LoadingSpinner({
  message = 'Loading',
  submessage = 'Getting everything ready...',
  size = 'md'
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-20 h-20',
    lg: 'w-24 h-24'
  };

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        {/* Enhanced loading spinner */}
        <div className={`relative ${sizeClasses[size]} mx-auto mb-6`}>
          <div className="absolute inset-0 border-4 border-accent-green/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-transparent border-t-accent-green rounded-full animate-spin"></div>
          <div className="absolute inset-2 border-4 border-transparent border-t-accent-cyan rounded-full animate-spin-slow"></div>
          <div className="absolute inset-4 border-4 border-transparent border-t-accent-blue rounded-full animate-spin-slower"></div>
        </div>
        <p className="text-white/90 font-bold text-lg mb-2">{message}</p>
        <p className="text-white/60 text-sm animate-pulse">{submessage}</p>
      </div>
    </div>
  );
}
