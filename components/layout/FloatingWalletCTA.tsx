'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@jup-ag/wallet-adapter';
import { RocketLaunchIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Floating CTA to encourage anonymous users to connect wallet
 * Only shows if wallet is NOT connected
 * Nikita Bier strategy: Make the path to value clear and enticing
 */
export function FloatingWalletCTA() {
  const { connected, publicKey } = useWallet();
  const [dismissed, setDismissed] = useState(false);
  const [visible, setVisible] = useState(false);

  // Show CTA after 3 seconds of browsing (let them see content first!)
  useEffect(() => {
    if (!connected && !dismissed) {
      const timer = setTimeout(() => {
        setVisible(true);
      }, 3000);

      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [connected, dismissed]);

  // Don't show if wallet is connected or user dismissed
  if (connected || dismissed || !visible) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 z-40 w-full max-w-md px-4 transition-all duration-500",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )}
    >
      <div className="relative">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-accent-purple via-accent-pink to-accent-blue rounded-2xl blur-xl opacity-50"></div>

        {/* Card */}
        <div className="relative bg-gradient-to-br from-card-bg to-app-bg border-2 border-white/20 rounded-2xl p-4 shadow-2xl backdrop-blur-sm">
          {/* Close button */}
          <button
            onClick={() => setDismissed(true)}
            className="absolute top-3 right-3 text-text-muted hover:text-white transition-colors"
            aria-label="Dismiss"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>

          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className="relative shrink-0">
              <div className="absolute inset-0 bg-gradient-to-br from-accent-green to-accent-cyan rounded-xl blur-md opacity-50"></div>
              <div className="relative w-12 h-12 bg-gradient-to-br from-accent-green to-accent-cyan rounded-xl flex items-center justify-center shadow-lg">
                <RocketLaunchIcon className="w-6 h-6 text-black" />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 pr-6">
              <h3 className="text-white font-bold text-lg mb-1">
                Connect to Start Trading
              </h3>
              <p className="text-text-muted text-sm mb-3">
                Connect your wallet to buy tokens, create posts, and earn rewards
              </p>

              <Button
                onClick={() => {
                  // Trigger wallet connection
                  // This will be handled by the UniversalHeader wallet button
                  document.querySelector<HTMLButtonElement>('[data-wallet-button]')?.click();
                  setDismissed(true);
                }}
                className="bg-gradient-to-r from-accent-green via-accent-cyan to-accent-blue hover:from-accent-green/90 hover:via-accent-cyan/90 hover:to-accent-blue/90 text-black font-bold px-6 py-2 rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-105"
              >
                Connect Wallet
              </Button>
            </div>
          </div>

          {/* Social proof */}
          <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-text-muted">
            <span className="flex items-center gap-1">
              <span className="text-accent-green">🔥</span>
              <span>247 traders active now</span>
            </span>
            <span>💰 $12.3M volume today</span>
          </div>
        </div>
      </div>
    </div>
  );
}
