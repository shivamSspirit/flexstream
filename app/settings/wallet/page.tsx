'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { useWallet } from '@/hooks/useWalletCompat';
import { Button } from '@/components/ui/button';
import {
  ArrowLeftIcon,
  WalletIcon,
  ShieldCheckIcon,
  KeyIcon,
  DocumentDuplicateIcon,
  ExclamationTriangleIcon,
  CheckIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function WalletSettingsPage() {
  const router = useRouter();
  const { publicKey, connected, disconnect, wallet } = useWallet();
  const [copied, setCopied] = useState(false);

  const copyAddress = () => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey.toBase58());
      setCopied(true);
      toast.success('Address copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <AppLayout showWallet={true} showSearch={false}>
      <div className="max-w-2xl mx-auto pb-20 md:pb-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="heading-3">Wallet & Security</h1>
            <p className="body-sm">Manage your connected wallets</p>
          </div>
        </div>

        {/* Connected Wallet */}
        <div className="mb-8">
          <h2 className="font-semibold text-white mb-4">Connected Wallet</h2>

          {connected && publicKey ? (
            <div className="bg-card-bg border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-accent-green/10 flex items-center justify-center">
                  <WalletIcon className="w-6 h-6 text-accent-green" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-white">{wallet?.adapter.name || 'Wallet'}</p>
                    <span className="px-2 py-0.5 bg-accent-green/20 text-accent-green text-xs rounded-full font-medium">
                      Connected
                    </span>
                  </div>
                  <p className="text-sm text-text-muted font-mono truncate">
                    {publicKey.toBase58()}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyAddress}
                  className="flex-1"
                >
                  {copied ? (
                    <CheckIcon className="w-4 h-4 mr-2 text-accent-green" />
                  ) : (
                    <DocumentDuplicateIcon className="w-4 h-4 mr-2" />
                  )}
                  {copied ? 'Copied!' : 'Copy Address'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => disconnect()}
                  className="flex-1 text-metric-red border-metric-red/30 hover:bg-metric-red/10"
                >
                  Disconnect
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-card-bg border border-white/10 rounded-xl p-6 text-center">
              <WalletIcon className="w-12 h-12 text-text-muted mx-auto mb-4" />
              <p className="text-white font-medium mb-2">No wallet connected</p>
              <p className="text-sm text-text-muted mb-4">Connect a wallet to get started</p>
              <Button className="bg-accent-green text-black hover:bg-accent-green/90">
                <PlusIcon className="w-4 h-4 mr-2" />
                Connect Wallet
              </Button>
            </div>
          )}
        </div>

        {/* Security Settings */}
        <div className="mb-8">
          <h2 className="font-semibold text-white mb-4">Security</h2>
          <div className="space-y-3">
            {/* Transaction Signing */}
            <div className="bg-card-bg border border-white/10 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                    <ShieldCheckIcon className="w-5 h-5 text-text-secondary" />
                  </div>
                  <div>
                    <p className="font-medium text-white">Confirm All Transactions</p>
                    <p className="text-sm text-text-muted">Require approval for every transaction</p>
                  </div>
                </div>
                <button className="w-12 h-7 rounded-full bg-accent-green relative">
                  <div className="absolute right-1 top-1 w-5 h-5 rounded-full bg-white transition-all" />
                </button>
              </div>
            </div>

            {/* Auto-lock */}
            <div className="bg-card-bg border border-white/10 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                    <KeyIcon className="w-5 h-5 text-text-secondary" />
                  </div>
                  <div>
                    <p className="font-medium text-white">Auto-lock Session</p>
                    <p className="text-sm text-text-muted">Lock after 30 minutes of inactivity</p>
                  </div>
                </div>
                <button className="w-12 h-7 rounded-full bg-white/20 relative">
                  <div className="absolute left-1 top-1 w-5 h-5 rounded-full bg-white transition-all" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div>
          <h2 className="font-semibold text-metric-red mb-4">Danger Zone</h2>
          <div className="bg-metric-red/5 border border-metric-red/20 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <ExclamationTriangleIcon className="w-6 h-6 text-metric-red shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-white mb-1">Delete Account</p>
                <p className="text-sm text-text-muted mb-4">
                  This will permanently delete your account and all associated data.
                  Your tokens and on-chain assets will remain in your wallet.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-metric-red border-metric-red/30 hover:bg-metric-red/10"
                >
                  Delete Account
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
