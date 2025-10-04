'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useSignUp, useSignIn } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type ClerkError = { code?: string; message?: string; longMessage?: string };

export default function SignUpPage() {
  const router = useRouter();
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const { isLoaded: signUpLoaded, signUp, setActive } = useSignUp();
  const { isLoaded: signInLoaded, signIn } = useSignIn();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [phase, setPhase] = useState<'collect' | 'verify'>('collect');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<ClerkError | null>(null);

  useEffect(() => {
    if (authLoaded && isSignedIn) router.push('/');
  }, [authLoaded, isSignedIn, router]);

  const handleSignUp = async () => {
    if (!signUpLoaded || !signUp) return;
    setSubmitting(true);
    setError(null);
    try {
      await signUp.create({ emailAddress: email, password });
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPhase('verify');
    } catch (e: any) {
      const err = (e?.errors?.[0] as ClerkError) || { message: e?.message };
      console.error('[SignUp:create] error', e);
      setError(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify = async () => {
    if (!signUpLoaded || !signUp) return;
    setSubmitting(true);
    setError(null);
    try {
      const complete = await signUp.attemptEmailAddressVerification({ code });
      if (complete?.status === 'complete') {
        await setActive({ session: complete.createdSessionId });
        router.push('/');
      } else {
        setError({ message: 'Verification incomplete. Please try again.' });
      }
    } catch (e: any) {
      const err = (e?.errors?.[0] as ClerkError) || { message: e?.message };
      console.error('[SignUp:verify] error', e);
      setError(err);
    } finally {
      setSubmitting(false);
    }
  };

  const oauthRedirect = {
    redirectUrl: '/auth/signin',
    redirectUrlComplete: '/',
  };

  const handleOAuth = async (strategy: 'oauth_google' | 'oauth_twitter' | 'oauth_github') => {
    if (!signInLoaded || !signIn) return;
    setError(null);
    try {
      await signIn.authenticateWithRedirect({ strategy, ...oauthRedirect });
    } catch (e: any) {
      const err = (e?.errors?.[0] as ClerkError) || { message: e?.message };
      console.error('[SignUp:oauth] error', e);
      setError(err);
    }
  };

  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-white">Create your account</CardTitle>
            <CardDescription className="text-gray-300">
              Sign up with email or continue with a provider
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!publishableKey && (
              <div className="mb-4 p-3 rounded bg-red-500/20 border border-red-500/30 text-red-200 text-sm">
                NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is not set. Add Clerk keys to your env.
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 rounded bg-red-500/20 border border-red-500/30 text-red-200 text-sm">
                <div className="font-medium">Sign up failed</div>
                <div>{error.longMessage || error.message || 'Unknown error'}</div>
                {error.code && <div className="opacity-75 text-xs mt-1">Code: {error.code}</div>}
              </div>
            )}

            {phase === 'collect' ? (
              <div className="space-y-3">
                <input
                  className="w-full px-3 py-2 rounded bg-white/10 border border-white/20 text-white placeholder-gray-400"
                  placeholder="Email address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <input
                  className="w-full px-3 py-2 rounded bg-white/10 border border-white/20 text-white placeholder-gray-400"
                  placeholder="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Button
                  onClick={handleSignUp}
                  disabled={submitting || !email || !password}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {submitting ? 'Creating account...' : 'Create account'}
                </Button>

                <div className="mt-4 grid grid-cols-1 gap-2">
                  <Button onClick={() => handleOAuth('oauth_google')} className="w-full bg-white text-gray-900 hover:opacity-90">
                    Continue with Google
                  </Button>
                  <Button onClick={() => handleOAuth('oauth_github')} className="w-full bg-white text-gray-900 hover:opacity-90">
                    Continue with GitHub
                  </Button>
                </div>

                <div className="text-center mt-4">
                  <a href="/auth/signin" className="text-gray-300 text-sm hover:underline">Have an account? Sign in</a>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-gray-200 text-sm">
                  We sent a verification code to <span className="font-medium">{email}</span>
                </div>
                <input
                  className="w-full px-3 py-2 rounded bg-white/10 border border-white/20 text-white placeholder-gray-400"
                  placeholder="Verification code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
                <Button
                  onClick={handleVerify}
                  disabled={submitting || !code}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {submitting ? 'Verifying...' : 'Verify & Continue'}
                </Button>
                <div className="text-center mt-4">
                  <button onClick={() => setPhase('collect')} className="text-gray-300 text-sm hover:underline">Back</button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}



