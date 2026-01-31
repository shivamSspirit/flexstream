'use client';

import { useState } from 'react';
import { useWallet } from '@/hooks/useWalletCompat';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { SparklesIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Transaction, Connection } from '@solana/web3.js';

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

interface PendingActivation {
  userId: string;
  username: string;
  displayName: string;
  uniqueSymbol: string;
  metadataUri: string;
  walletAddress: string;
  baseMintSecretKey: string;
  unsignedTransaction?: {
    transaction: string;
    baseMintPublicKey: string;
    blockhash: string;
    lastValidBlockHeight: number;
  };
}

export function ActivateCreatorCoinModal({
  isOpen,
  onClose,
  onSuccess,
  userProfile
}: ActivateCreatorCoinModalProps) {
  const { publicKey, connected, signTransaction } = useWallet();
  const [isActivating, setIsActivating] = useState(false);
  const [step, setStep] = useState<'confirm' | 'preparing' | 'signing' | 'confirming' | 'success'>('confirm');
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
    setStep('preparing');

    try {
      console.log('🚀 Activating creator coin (signed flow)...', {
        wallet: publicKey.toBase58(),
        username: userProfile.username,
        displayName: userProfile.display_name
      });

      // Step 1: Get unsigned transaction from API
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
        const errorMsg = result.error || result.details || 'Failed to prepare creator coin transaction';
        throw new Error(errorMsg);
      }

      // Check if this requires signature (new flow)
      if (!result.requiresSignature) {
        // Legacy flow - should not happen anymore
        throw new Error('Unexpected response format');
      }

      const { unsignedTransaction, pendingActivation } = result.data;

      // Step 2: Sign the transaction
      setStep('signing');
      console.log('✍️ Signing transaction...');

      // Deserialize the transaction
      const transactionBuffer = Buffer.from(unsignedTransaction.transaction, 'base64');
      const transaction = Transaction.from(transactionBuffer);

      // Sign with user's wallet
      const signedTransaction = await signTransaction(transaction);

      console.log('✅ Transaction signed');

      // Step 3: Send to Solana
      setStep('confirming');
      console.log('📤 Submitting to Solana...');

      const connection = new Connection(
        process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com',
        'confirmed'
      );

      const signature = await connection.sendRawTransaction(
        signedTransaction.serialize(),
        {
          skipPreflight: false,
          preflightCommitment: 'confirmed',
        }
      );

      console.log('📝 Transaction submitted:', signature);

      // Wait for confirmation
      const confirmation = await connection.confirmTransaction(
        {
          signature,
          blockhash: unsignedTransaction.blockhash,
          lastValidBlockHeight: unsignedTransaction.lastValidBlockHeight,
        },
        'confirmed'
      );

      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
      }

      console.log('✅ Transaction confirmed!');

      // Step 4: Confirm with backend
      const confirmResponse = await fetch('/api/creators/confirm-activation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          signature,
          pendingActivation: {
            ...pendingActivation,
            unsignedTransaction,
          },
        }),
      });

      const confirmResult = await confirmResponse.json();

      if (!confirmResponse.ok || !confirmResult.success) {
        // Token created but DB update failed - still a partial success
        console.warn('⚠️ Token created but confirmation failed:', confirmResult);
        setTokenMint(unsignedTransaction.baseMintPublicKey);
        setStep('success');
        toast.success(
          <div className="flex flex-col gap-2">
            <div className="font-bold">🎉 Creator Coin Created!</div>
            <div className="text-sm">
              <div className="mb-2">Token created on-chain (confirmation pending)</div>
              <div className="font-mono text-xs bg-black/20 p-2 rounded">
                CA: {unsignedTransaction.baseMintPublicKey}
              </div>
            </div>
          </div>,
          { duration: 8000 }
        );
      } else {
        console.log('✅ Creator coin fully activated:', confirmResult.data);

        setTokenMint(confirmResult.data.token.mint);
        setStep('success');

        toast.success(
          <div className="flex flex-col gap-2">
            <div className="font-bold">🎉 Creator Coin Activated!</div>
            <div className="text-sm">
              <div className="mb-2">Your token is now live and tradable</div>
              <div className="font-mono text-xs bg-black/20 p-2 rounded">
                CA: {confirmResult.data.token.mint}
              </div>
            </div>
          </div>,
          { duration: 8000 }
        );
      }

      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (error) {
      console.error('❌ Error activating creator coin:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to activate creator coin';

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

                {step === 'preparing' && (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-accent-green border-t-transparent mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">Preparing...</h3>
                    <p className="text-white/60">Creating token metadata</p>
                  </div>
                )}

                {step === 'signing' && (
                  <div className="text-center py-8">
                    <div className="animate-pulse">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent-cyan/20 flex items-center justify-center">
                        <svg className="w-8 h-8 text-accent-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Sign Transaction</h3>
                    <p className="text-white/60">Please approve the transaction in your wallet</p>
                  </div>
                )}

                {step === 'confirming' && (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-accent-cyan border-t-transparent mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">Confirming...</h3>
                    <p className="text-white/60">Waiting for blockchain confirmation</p>
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
