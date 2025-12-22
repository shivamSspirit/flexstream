'use client';

import { useState } from 'react';
import { useWallet } from '@jup-ag/wallet-adapter';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { XMarkIcon, SparklesIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

interface ActivateCreatorCoinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userProfile: {
    username: string;
    display_name: string;
    avatar_url?: string;
    bio?: string;
  };
}

export function ActivateCreatorCoinModal({
  isOpen,
  onClose,
  onSuccess,
  userProfile
}: ActivateCreatorCoinModalProps) {
  const { publicKey, connected } = useWallet();
  const [isActivating, setIsActivating] = useState(false);
  const [step, setStep] = useState<'confirm' | 'activating' | 'success'>('confirm');
  const [tokenMint, setTokenMint] = useState<string>('');

  const handleActivate = async () => {
    if (!publicKey || !connected) {
      toast.error('Please connect your wallet first');
      return;
    }

    // Validate that we have at least a display name
    if (!userProfile.display_name) {
      toast.error('Please set up your profile first (display name required)');
      return;
    }

    setIsActivating(true);
    setStep('activating');

    try {
      console.log('🚀 Activating creator coin...', {
        wallet: publicKey.toBase58(),
        username: userProfile.username,
        displayName: userProfile.display_name
      });

      const response = await fetch('/api/creators/activate-coin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: publicKey.toBase58(),
          username: userProfile.username || `user_${Date.now().toString(36)}`,
          displayName: userProfile.display_name,
          bio: userProfile.bio || `${userProfile.display_name}'s profile`,
          avatarUrl: userProfile.avatar_url || null,
        }),
      });

      const result = await response.json();

      console.log('📡 Activation response:', result);

      if (!response.ok || !result.success) {
        // Show detailed error message
        const errorMsg = result.error || result.details || 'Failed to activate creator coin';
        throw new Error(errorMsg);
      }

      console.log('✅ Creator coin activated:', result.data);

      setTokenMint(result.data.token.mint);
      setStep('success');

      // Show detailed success notification with CA
      toast.success(
        <div className="flex flex-col gap-2">
          <div className="font-bold">🎉 Creator Coin Activated!</div>
          <div className="text-sm">
            <div className="mb-2">Your token is now live and tradable</div>
            <div className="font-mono text-xs bg-black/20 p-2 rounded">
              CA: {result.data.token.mint}
            </div>
          </div>
        </div>,
        { duration: 8000 }
      );

      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (error) {
      console.error('❌ Error activating creator coin:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to activate creator coin';

      // Show detailed error toast
      toast.error(
        <div className="flex flex-col gap-1">
          <div className="font-bold">Activation Failed</div>
          <div className="text-sm">{errorMessage}</div>
          <div className="text-xs text-white/60 mt-1">
            Check console for details or try again
          </div>
        </div>,
        { duration: 6000 }
      );

      setStep('confirm');
    } finally {
      setIsActivating(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 to-black border border-white/10 p-6 text-left align-middle shadow-xl transition-all">
                {step === 'confirm' && (
                  <>
                    <Dialog.Title className="text-2xl font-black text-white mb-4 flex items-center gap-2">
                      <SparklesIcon className="w-6 h-6 text-accent-green" />
                      Activate Creator Coin
                    </Dialog.Title>

                    <div className="mt-4 space-y-4">
                      <p className="text-white/70">
                        Launch your own token <span className="text-accent-green font-bold">${userProfile.username.toUpperCase()}</span> and let your fans invest in your success!
                      </p>

                      <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                        <h4 className="text-white font-bold mb-2">Benefits:</h4>
                        <ul className="space-y-1 text-sm text-white/60">
                          <li>✓ Monetize your content</li>
                          <li>✓ Reward your supporters</li>
                          <li>✓ Build your community</li>
                          <li>✓ Earn from trading fees</li>
                        </ul>
                      </div>
                    </div>

                    <div className="mt-6 flex gap-3">
                      <Button
                        onClick={onClose}
                        variant="outline"
                        className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleActivate}
                        className="flex-1 bg-gradient-to-r from-accent-green to-accent-cyan text-black font-bold"
                        disabled={isActivating}
                      >
                        Activate
                      </Button>
                    </div>
                  </>
                )}

                {step === 'activating' && (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-accent-green border-t-transparent mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">Activating...</h3>
                    <p className="text-white/60">Creating your creator coin</p>
                  </div>
                )}

                {step === 'success' && (
                  <div className="text-center py-8">
                    <CheckCircleIcon className="w-16 h-16 text-accent-green mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">Success!</h3>
                    <p className="text-white/60">Your creator coin is now live</p>
                    {tokenMint && (
                      <a
                        href={`https://solscan.io/token/${tokenMint}?cluster=devnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 mt-4 text-accent-cyan hover:text-accent-green transition-colors text-sm"
                      >
                        View on Solscan
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    )}
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
