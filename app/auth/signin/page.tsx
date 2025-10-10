'use client';

import { SignIn } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function SignInPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-app-bg flex flex-col relative overflow-hidden">
      {/* Gradient Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <div className="relative z-10 p-4">
        <Button
          variant="ghost"
          onClick={() => router.push('/')}
          className="text-secondary hover:text-primary"
        >
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          Back
        </Button>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-6">
        <div className="w-full max-w-md">
          {/* Logo & Title */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 mx-auto mb-4 flexstream-gradient rounded-2xl flex items-center justify-center shadow-xl shadow-purple-500/30">
              <span className="text-white font-bold text-xl">F</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-primary mb-2">
              Welcome Back
            </h1>
            <p className="text-sm text-secondary">
              Sign in to continue to FlexStream
            </p>
          </div>

          {/* Sign In Card */}
          <div className="bg-gradient-to-br from-card-bg to-card-bg/50 rounded-2xl p-6 border border-white/10 shadow-2xl">
            <SignIn
              appearance={{
                elements: {
                  rootBox: 'w-full',
                  card: 'bg-transparent border-0 shadow-none p-0',
                  headerTitle: 'hidden',
                  headerSubtitle: 'hidden',
                  socialButtonsBlockButton: 'bg-white/5 border border-white/10 text-primary hover:bg-white/10 transition-all rounded-xl h-11 font-medium text-sm',
                  socialButtonsBlockButtonText: 'text-primary',
                  formButtonPrimary: 'flexstream-gradient hover:opacity-90 h-11 rounded-xl font-semibold shadow-lg shadow-purple-500/30',
                  footerActionLink: 'text-purple-400 hover:text-purple-300 font-medium text-sm',
                  formFieldLabel: 'text-primary font-medium text-sm mb-2',
                  formFieldInput: 'bg-white/5 border border-white/10 text-primary h-11 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20',
                  formFieldInputShowPasswordButton: 'text-secondary hover:text-primary',
                  identityPreviewText: 'text-primary text-sm',
                  identityPreviewEditButton: 'text-purple-400 text-sm',
                  dividerLine: 'bg-white/10',
                  dividerText: 'text-secondary text-xs',
                  formHeaderTitle: 'text-primary text-lg font-bold mb-1',
                  formHeaderSubtitle: 'text-secondary text-xs',
                  otpCodeFieldInput: 'bg-white/5 border border-white/10 text-primary rounded-xl',
                  formResendCodeLink: 'text-purple-400 hover:text-purple-300 text-sm',
                  alertText: 'text-xs',
                  footer: 'hidden',
                }
              }}
              redirectUrl="/"
              signUpUrl="/auth/signup"
            />
          </div>

          {/* Footer Link */}
          <div className="mt-6 text-center">
            <p className="text-secondary text-sm">
              Don't have an account?{' '}
              <button
                onClick={() => router.push('/auth/signup')}
                className="text-purple-400 hover:text-purple-300 font-semibold transition-colors"
              >
                Sign up
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
