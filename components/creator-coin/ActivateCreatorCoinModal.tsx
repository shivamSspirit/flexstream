'use client';

import { useState } from 'react';
import { useWallet } from '@jup-ag/wallet-adapter';
import { Connection, Transaction } from '@solana/web3.js';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { SparklesIcon, RocketLaunchIcon } from '@heroicons/react/24/outline';

interface ActivateCreatorCoinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  userProfile: {
    username: string;
    display_name: string;
    avatar_url?: string;
    bio?: string;
  };
}

type ActivationStep = 'idle' | 'creating' | 'signing' | 'confirming' | 'complete';

export function ActivateCreatorCoinModal({
  isOpen,
  onClose,
  onSuccess,
  userProfile
}: ActivateCreatorCoinModalProps) {
  const { connected, publicKey, sendTransaction } = useWallet();
  const [step, setStep] = useState<ActivationStep>('idle');
  const [progress, setProgress] = useState('');
  const [tokenData, setTokenData] = useState<any>(null);

  const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com';
  const connection = new Connection(rpcUrl, 'confirmed');

  const handleActivate = async () => {
    if (!connected || !publicKey) {
      toast.error('Please connect your wallet');
      return;
    }

    // Validate profile requirements
    if (!userProfile.username) {
      toast.error('Please set a username in your profile first');
      return;
    }

    if (!userProfile.avatar_url) {
      toast.error('Please upload a profile avatar first');
      return;
    }

    try {
      // Step 1: Create token
      setStep('creating');
      setProgress('Creating your creator coin...');

      console.log('🪙 Activating creator coin for:', userProfile.username);

      const response = await fetch('/api/creator-coin/activate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: publicKey.toBase58(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Activation error:', errorData);
        throw new Error(errorData.error || `Failed to create creator coin (${response.status})`);
      }

      const result = await response.json();
      console.log('✅ Creator coin created:', result);

      if (!result.requiresSignature || !result.data?.transaction) {
        throw new Error('Invalid response from server');
      }

      setTokenData(result.data.token);

      // Step 2: Deserialize and sign transaction
      setStep('signing');
      setProgress('Please sign the transaction in your wallet...');

      const transactionBuffer = Buffer.from(result.data.transaction, 'base64');
      const transaction = Transaction.from(transactionBuffer);

      console.log('🔐 Requesting user signature...');

      const signature = await sendTransaction(transaction, connection);
      console.log('✅ Transaction sent:', signature);

      // Step 3: Wait for confirmation
      setStep('confirming');
      setProgress('Confirming on blockchain...');

      const latestBlockhash = await connection.getLatestBlockhash();
      const confirmation = await connection.confirmTransaction({
        signature,
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight
      }, 'confirmed');

      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
      }

      console.log('✅ Transaction confirmed');

      // Step 4: Save to database
      setProgress('Saving creator coin data...');

      const confirmResponse = await fetch('/api/creator-coin/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          signature,
          walletAddress: publicKey.toBase58(),
          tokenData: result.data.token,
        }),
      });

      if (!confirmResponse.ok) {
        const errorData = await confirmResponse.json();
        console.error('❌ Confirmation error:', errorData);
        // Don't throw - transaction is already on chain
        console.warn('⚠️ Creator coin created on-chain but failed to save to database');
      }

      const confirmResult = await confirmResponse.json();
      console.log('✅ Creator coin saved:', confirmResult);

      // Step 5: Complete
      setStep('complete');
      setProgress('Creator coin activated!');

      toast.success('🎉 Creator coin activated successfully!', {
        description: `$${result.data.token.symbol} is now live and tradable!`
      });

      setTimeout(() => {
        onSuccess?.();
        onClose();
        // Refresh page to show new creator coin
        window.location.reload();
      }, 2000);

    } catch (error) {
      console.error('❌ Error activating creator coin:', error);
      setStep('idle');
      toast.error(error instanceof Error ? error.message : 'Failed to activate creator coin');
    }
  };

  const tokenSymbol = userProfile.username?.toUpperCase().substring(0, 10) || 'TOKEN';
  const tokenName = `${userProfile.display_name || userProfile.username} Creator Coin`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-card-bg border-white/10">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2">
            <SparklesIcon className="w-6 h-6 text-accent-purple" />
            Activate Creator Coin
          </DialogTitle>
          <DialogDescription className="text-white/60">
            Launch your own tradable token on Solana
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Preview */}
          <div className="bg-black/40 rounded-xl p-6 border border-white/10">
            <div className="flex items-center gap-4 mb-4">
              <Avatar className="h-16 w-16 ring-2 ring-brand-primary">
                <AvatarImage src={userProfile.avatar_url} />
                <AvatarFallback className="bg-gradient-to-br from-brand-primary to-brand-secondary text-white font-bold text-xl">
                  {userProfile.username?.[0]?.toUpperCase() || 'C'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-lg font-bold text-white">${tokenSymbol}</h3>
                <p className="text-sm text-white/60">{tokenName}</p>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-white/60">Initial Supply:</span>
                <span className="text-white font-semibold">1,000,000,000</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Network:</span>
                <span className="text-white font-semibold">Solana</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Protocol:</span>
                <span className="text-white font-semibold">Meteora DBC</span>
              </div>
            </div>
          </div>

          {/* Requirements Check */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                userProfile.username ? 'bg-success' : 'bg-danger'
              }`}>
                {userProfile.username ? '✓' : '✗'}
              </div>
              <span className="text-white/80">Username set</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                userProfile.avatar_url ? 'bg-success' : 'bg-danger'
              }`}>
                {userProfile.avatar_url ? '✓' : '✗'}
              </div>
              <span className="text-white/80">Profile avatar uploaded</span>
            </div>
          </div>

          {/* Progress */}
          {step !== 'idle' && (
            <div className="bg-black/40 rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
                <span className="text-white/80 text-sm">{progress}</span>
              </div>
            </div>
          )}

          {/* Success State */}
          {step === 'complete' && tokenData && (
            <div className="bg-success/10 border border-success/30 rounded-xl p-4">
              <p className="text-success text-sm font-semibold mb-2">🎉 Creator Coin Activated!</p>
              <p className="text-white/60 text-xs">Your token is now live and tradable on Solana</p>
              <div className="flex gap-2 mt-3">
                <a
                  href={tokenData.jupiterUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-brand-secondary hover:text-brand-secondary/80"
                >
                  View on Jupiter →
                </a>
                <a
                  href={tokenData.meteoraUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-brand-primary hover:text-brand-primary/80"
                >
                  View on Meteora →
                </a>
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 border-white/20 text-white hover:bg-white/5"
              disabled={step !== 'idle' && step !== 'complete'}
            >
              Cancel
            </Button>
            <Button
              onClick={handleActivate}
              disabled={!userProfile.username || !userProfile.avatar_url || step !== 'idle'}
              className="flex-1 btn-primary"
            >
              {step === 'idle' ? (
                <>
                  <RocketLaunchIcon className="w-4 h-4 mr-2" />
                  Activate Coin
                </>
              ) : step === 'complete' ? (
                'Completed!'
              ) : (
                'Processing...'
              )}
            </Button>
          </div>

          {/* Warning */}
          {(!userProfile.username || !userProfile.avatar_url) && (
            <p className="text-xs text-warning/80 text-center">
              ⚠️ Please complete your profile before activating your creator coin
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
