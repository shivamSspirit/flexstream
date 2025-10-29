/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree
 * Follows React error boundary pattern
 */

'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

// ============================================================================
// ERROR BOUNDARY COMPONENT
// ============================================================================

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to console
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Update state with error details
    this.setState({
      error,
      errorInfo,
    });

    // Call optional error callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // In production, you might want to log to an error reporting service
    // Example: Sentry.captureException(error, { contexts: { react: errorInfo } });
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback UI from props
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <DefaultErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onReset={this.handleReset}
          showDetails={this.props.showDetails}
        />
      );
    }

    return this.props.children;
  }
}

// ============================================================================
// DEFAULT ERROR FALLBACK UI
// ============================================================================

interface DefaultErrorFallbackProps {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  onReset: () => void;
  showDetails?: boolean;
}

function DefaultErrorFallback({
  error,
  errorInfo,
  onReset,
  showDetails = process.env.NODE_ENV === 'development',
}: DefaultErrorFallbackProps) {
  return (
    <div className="min-h-[400px] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-card-bg border border-white/10 rounded-2xl p-6 sm:p-8">
        {/* Error Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
        </div>

        {/* Error Title */}
        <h2 className="text-xl sm:text-2xl font-bold text-white text-center mb-2">
          Something Went Wrong
        </h2>

        {/* Error Message */}
        <p className="text-text-muted text-center mb-6">
          We encountered an unexpected error. Please try again or contact support
          if the problem persists.
        </p>

        {/* Error Details (Development Only) */}
        {showDetails && error && (
          <div className="mb-6 p-4 bg-red-500/5 border border-red-500/20 rounded-lg">
            <p className="text-xs font-mono text-red-400 mb-2 font-bold">
              Error Details:
            </p>
            <p className="text-xs font-mono text-red-300 break-words">
              {error.toString()}
            </p>
            {errorInfo && (
              <details className="mt-2">
                <summary className="text-xs text-red-400 cursor-pointer hover:text-red-300">
                  Stack Trace
                </summary>
                <pre className="text-xs text-red-300 mt-2 overflow-x-auto">
                  {errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={onReset}
            className="flex-1 bg-gradient-to-r from-accent-purple to-accent-pink hover:from-accent-purple/90 hover:to-accent-pink/90"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
          <Button
            onClick={() => (window.location.href = '/')}
            variant="outline"
            className="flex-1 border-white/20 text-white hover:bg-white/5"
          >
            Go Home
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SPECIALIZED ERROR BOUNDARIES
// ============================================================================

/**
 * Error boundary for feed components
 */
export function FeedErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="p-6 text-center">
          <p className="text-text-muted mb-4">Failed to load feed</p>
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            className="border-white/20 text-white"
          >
            Reload Page
          </Button>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}

/**
 * Error boundary for post cards
 */
export function PostCardErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="card-base p-4 text-center">
          <p className="text-text-muted text-sm">Failed to load post</p>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}

/**
 * Error boundary for modals
 */
export function ModalErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-white font-semibold mb-2">Modal Error</p>
          <p className="text-text-muted text-sm mb-4">
            This modal encountered an error
          </p>
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            className="border-white/20 text-white"
          >
            Reload Page
          </Button>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}

// ============================================================================
// HOOK FOR FUNCTIONAL COMPONENTS
// ============================================================================

/**
 * Hook to manually trigger error boundary (for async errors)
 * Usage:
 *   const throwError = useErrorHandler();
 *   try { await someAsyncOperation() }
 *   catch (error) { throwError(error) }
 */
export function useErrorHandler() {
  const [, setError] = React.useState<Error>();

  return React.useCallback(
    (error: Error) => {
      setError(() => {
        throw error;
      });
    },
    [setError]
  );
}
