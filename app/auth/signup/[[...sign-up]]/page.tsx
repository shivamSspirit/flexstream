'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useWallet } from '@solana/wallet-adapter-react';
import { SignUp } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { WalletMultiButton } from '@/lib/wallet';
import { supabase } from '@/lib/supabase';
import {
  WalletIcon,
  UserIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

export default function SignUpPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const { connected, publicKey, connecting, disconnect, wallet } = useWallet();
  const [signupStep, setSignupStep] = useState<'wallet' | 'clerk'>('wallet');
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Track wallet connection state
  useEffect(() => {
    if (connected && publicKey) {
      setWalletConnected(true);
      setWalletError(null);
      // Auto-advance to Clerk signup after wallet connection
      setTimeout(() => {
        setSignupStep('clerk');
      }, 1500);
    } else if (!connected && !connecting) {
      setWalletConnected(false);
    }
  }, [connected, publicKey, connecting]);

  // Note: Wallet generation removed - using Jupiter wallet adapter only

  // Check if user is already fully set up (has both Clerk account and profile)
  useEffect(() => {
    const checkUserProfile = async () => {
      setIsCheckingAuth(true);
      
      // Only redirect if user is authenticated
      if (user && supabase) {
        try {
          const { data: existingProfile } = await supabase
            .from('users')
            .select('id')
            .eq('clerk_user_id', user.id)
            .single();

          if (existingProfile) {
            // User has profile, go to home page
            router.push('/');
            return;
          }
          // If no profile found, stay on signup page - user needs to complete setup
        } catch (error) {
          // No profile found, stay on signup page - user needs to complete setup
          console.log('User needs to complete signup process');
        }
      }
      
      setIsCheckingAuth(false);
    };

    // Only check if user is loaded
    if (isLoaded) {
      checkUserProfile();
    }
  }, [user, isLoaded, router]);

  const handleSkipWallet = () => {
    setSignupStep('clerk');
  };

  const handleBackToWallet = () => {
    setSignupStep('wallet');
  };

  const handleDisconnectWallet = async () => {
    try {
      await disconnect();
      setWalletConnected(false);
      setWalletError(null);
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      setWalletError('Failed to disconnect wallet');
    }
  };

  // Show loading while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-zinc-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-zinc-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">FS</span>
            </div>
            <span className="text-white font-bold text-3xl">FlexStream</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">
            Join the Creator Economy
          </h1>
          <p className="text-xl text-gray-300">
            Connect your wallet and start monetizing your trading success
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 ${walletConnected || signupStep === 'clerk' ? 'text-emerald-400' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                walletConnected || signupStep === 'clerk' ? 'bg-emerald-500' : 'bg-gray-600'
              }`}>
                {walletConnected ? (
                  <CheckCircleIcon className="w-5 h-5 text-white" />
                ) : (
                  <span className="text-white text-sm font-bold">1</span>
                )}
              </div>
              <span className="font-medium">Connect Wallet</span>
            </div>
            
            <ArrowRightIcon className={`w-5 h-5 ${walletConnected || signupStep === 'clerk' ? 'text-emerald-400' : 'text-gray-400'}`} />
            
            <div className={`flex items-center space-x-2 ${signupStep === 'clerk' ? 'text-emerald-400' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                signupStep === 'clerk' ? 'bg-emerald-500' : 'bg-gray-600'
              }`}>
                <span className="text-white text-sm font-bold">2</span>
              </div>
              <span className="font-medium">Create Account</span>
            </div>
          </div>
        </div>

        {/* Step 1: Wallet Connection */}
        {signupStep === 'wallet' && (
          <Card className="bg-white/5 backdrop-blur-md border-white/10">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <WalletIcon className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-white text-2xl">Connect Your Solana Wallet</CardTitle>
              <CardDescription className="text-gray-300 text-lg">
                Connect your wallet to verify earnings and unlock premium features. 
                <br />
                <span className="text-emerald-400 font-medium">Don't have a wallet? We'll create one for you automatically!</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <WalletMultiButton />
                
                {/* Wallet Connection Status */}
                {connecting && (
                  <div className="mt-4 flex items-center justify-center space-x-2 text-emerald-400">
                    <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm">Connecting wallet...</span>
                  </div>
                )}
                
                {connected && publicKey && (
                  <div className="mt-4 flex items-center justify-center space-x-2 text-emerald-400">
                    <CheckCircleIcon className="w-4 h-4" />
                    <span className="text-sm">Wallet connected: {publicKey.toString().slice(0, 8)}...{publicKey.toString().slice(-8)}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="ml-2 border-red-500/50 text-red-400 hover:bg-red-500/10 px-2 py-1"
                      onClick={handleDisconnectWallet}
                    >
                      Disconnect
                    </Button>
                  </div>
                )}
                
                {walletError && (
                  <div className="mt-4 flex items-center justify-center space-x-2 text-red-400">
                    <span className="text-sm">Error: {walletError}</span>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                <div className="text-center p-4 bg-white/5 rounded-lg">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-white text-sm font-bold">💰</span>
                  </div>
                  <h3 className="text-white font-semibold mb-1">Earnings Verification</h3>
                  <p className="text-gray-400 text-sm">Verify your trading profits on-chain</p>
                </div>
                
                <div className="text-center p-4 bg-white/5 rounded-lg">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-white text-sm font-bold">🎯</span>
                  </div>
                  <h3 className="text-white font-semibold mb-1">Premium Content</h3>
                  <p className="text-gray-400 text-sm">Access exclusive trading insights</p>
                </div>
                
                <div className="text-center p-4 bg-white/5 rounded-lg">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-white text-sm font-bold">🚀</span>
                  </div>
                  <h3 className="text-white font-semibold mb-1">Creator Coins</h3>
                  <p className="text-gray-400 text-sm">Pump fun streamers and creators coins</p>
                </div>
              </div>

              <div className="text-center">
                <Button
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                  onClick={handleSkipWallet}
                >
                  Skip for now
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Clerk Signup */}
        {signupStep === 'clerk' && (
          <Card className="bg-white/5 backdrop-blur-md border-white/10">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserIcon className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-white text-2xl">Create Your Account</CardTitle>
              <CardDescription className="text-gray-300 text-lg">
                Set up your profile to start sharing your success
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Back Button */}
              <div className="mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/20 text-white hover:bg-white/10"
                  onClick={handleBackToWallet}
                >
                  ← Back to Wallet
                </Button>
              </div>
              
              <div className="clerk-signup-container">
                <SignUp 
                  appearance={{
                    baseTheme: undefined,
                    elements: {
                      formButtonPrimary: 'bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors',
                      card: 'bg-white/10 backdrop-blur-md border border-white/20 shadow-xl',
                      headerTitle: 'text-white text-2xl font-bold mb-2',
                      headerSubtitle: 'text-gray-300 text-sm mb-6',
                      socialButtonsBlockButton: 'bg-white/10 border border-white/20 hover:bg-white/20 text-white font-medium py-2 px-4 rounded-lg transition-colors',
                      formFieldInput: 'bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg px-3 py-2',
                      footerActionLink: 'text-emerald-300 hover:text-emerald-200 font-medium',
                      identityPreviewText: 'text-gray-300',
                      formFieldLabel: 'text-gray-300 font-medium mb-1',
                      formFieldInputShowPasswordButton: 'text-gray-400 hover:text-white',
                      formFieldInputShowPasswordIcon: 'text-gray-400',
                      formFieldSuccessText: 'text-emerald-400',
                      formFieldErrorText: 'text-red-400',
                      formFieldWarningText: 'text-yellow-400',
                      formFieldHintText: 'text-gray-400 text-sm',
                      formResendCodeLink: 'text-emerald-300 hover:text-emerald-200',
                      otpCodeFieldInput: 'bg-white/10 border border-white/20 text-white text-center font-mono text-lg',
                      formHeaderTitle: 'text-white text-2xl font-bold',
                      formHeaderSubtitle: 'text-gray-300',
                      dividerLine: 'bg-white/20',
                      dividerText: 'text-gray-400',
                      formFieldRow: 'mb-4',
                      identityPreview: 'bg-white/5 border border-white/20 rounded-lg p-3',
                      identityPreviewEditButton: 'text-emerald-300 hover:text-emerald-200',
                    }
                  }}
                  redirectUrl="/auth/onboarding"
                  afterSignUpUrl="/auth/onboarding"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center mt-8">
          <div className="flex items-center justify-center space-x-2 text-gray-400 text-sm mb-4">
            <Badge variant="outline" className="border-emerald-500/30 text-emerald-300">
              <SparklesIcon className="w-3 h-3 mr-1" />
              Free to Start
            </Badge>
            <Badge variant="outline" className="border-cyan-500/30 text-cyan-300">
              <CheckCircleIcon className="w-3 h-3 mr-1" />
              No Credit Card
            </Badge>
            <Badge variant="outline" className="border-blue-500/30 text-blue-300">
              <ArrowRightIcon className="w-3 h-3 mr-1" />
              Start Earning Today
            </Badge>
          </div>
          <p className="text-gray-400 text-sm">
            Already have an account?{' '}
            <button 
              onClick={() => router.push('/auth/signin')}
              className="text-emerald-400 hover:text-emerald-300 font-medium"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
