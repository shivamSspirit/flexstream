'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useWallet } from '@solana/wallet-adapter-react';
import { SignIn } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { WalletMultiButton } from '@/lib/wallet';
import { supabase } from '@/lib/supabase';
import { 
  WalletIcon, 
  UserIcon, 
  CheckCircleIcon,
  SparklesIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

export default function SignInPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const { connected, publicKey } = useWallet();

  // Check if user is already authenticated and has profile
  useEffect(() => {
    const checkUserProfile = async () => {
      if (user && connected && publicKey && supabase) {
        try {
          const { data: existingProfile } = await supabase
            .from('users')
            .select('id')
            .eq('id', user.id)
            .single();

          if (existingProfile) {
            // User has profile, go to home page
            router.push('/');
          } else {
            // User doesn't have profile, go to onboarding
            router.push('/auth/onboarding');
          }
        } catch (error) {
          // No profile found, go to onboarding
          router.push('/auth/onboarding');
        }
      }
    };

    if (isLoaded && user && connected) {
      checkUserProfile();
    }
  }, [user, connected, publicKey, isLoaded, router]);

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
            Welcome Back
          </h1>
          <p className="text-xl text-gray-300">
            Sign in to continue sharing your trading success
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Wallet Connection */}
          <Card className="bg-white/5 backdrop-blur-md border-white/10">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <WalletIcon className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-white text-xl">Connect Wallet</CardTitle>
              <CardDescription className="text-gray-300">
                Connect your Solana wallet for earnings verification
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <WalletMultiButton />
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">💰</span>
                  </div>
                  <div>
                    <h4 className="text-white font-semibold text-sm">Earnings Verification</h4>
                    <p className="text-gray-400 text-xs">Verify your trading profits</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">🎯</span>
                  </div>
                  <div>
                    <h4 className="text-white font-semibold text-sm">Premium Access</h4>
                    <p className="text-gray-400 text-xs">Unlock exclusive content</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Clerk Sign In */}
          <Card className="bg-white/5 backdrop-blur-md border-white/10">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserIcon className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-white text-xl">Sign In</CardTitle>
              <CardDescription className="text-gray-300">
                Access your FlexStream account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SignIn 
                appearance={{
                  elements: {
                    formButtonPrimary: 'bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700',
                    card: 'bg-transparent shadow-none',
                    headerTitle: 'text-white text-xl font-bold',
                    headerSubtitle: 'text-gray-300',
                    socialButtonsBlockButton: 'bg-white/10 border-white/20 hover:bg-white/20 text-white',
                    formFieldInput: 'bg-white/10 border-white/20 text-white placeholder-gray-400',
                    footerActionLink: 'text-emerald-300 hover:text-emerald-200',
                    identityPreviewText: 'text-gray-300',
                    formFieldLabel: 'text-gray-300',
                  }
                }}
                redirectUrl="/"
                afterSignInUrl="/"
              />
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <div className="flex items-center justify-center space-x-2 text-gray-400 text-sm mb-4">
            <Badge variant="outline" className="border-emerald-500/30 text-emerald-300">
              <SparklesIcon className="w-3 h-3 mr-1" />
              Secure
            </Badge>
            <Badge variant="outline" className="border-cyan-500/30 text-cyan-300">
              <CheckCircleIcon className="w-3 h-3 mr-1" />
              Fast
            </Badge>
            <Badge variant="outline" className="border-blue-500/30 text-blue-300">
              <ArrowRightIcon className="w-3 h-3 mr-1" />
              Easy
            </Badge>
          </div>
          <p className="text-gray-400 text-sm">
            Don't have an account?{' '}
            <button 
              onClick={() => router.push('/auth/signup')}
              className="text-emerald-400 hover:text-emerald-300 font-medium"
            >
              Sign up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
