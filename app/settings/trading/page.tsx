'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { ArrowLeftIcon, BoltIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

export default function TradingSettingsPage() {
  const router = useRouter();

  const [slippage, setSlippage] = useState('1');
  const [priorityFee, setPriorityFee] = useState('medium');
  const [fastMode, setFastMode] = useState(false);
  const [defaultBuyAmounts, setDefaultBuyAmounts] = useState(['5', '10', '25', '50']);

  const slippageOptions = ['0.5', '1', '2', '5'];
  const priorityOptions = [
    { id: 'low', label: 'Low', description: '~30s confirmation' },
    { id: 'medium', label: 'Medium', description: '~15s confirmation' },
    { id: 'high', label: 'High', description: '~5s confirmation' },
    { id: 'turbo', label: 'Turbo (Jito)', description: 'Instant with MEV protection' },
  ];

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
            <h1 className="heading-3">Trading Preferences</h1>
            <p className="body-sm">Configure your trading settings</p>
          </div>
        </div>

        {/* Slippage Tolerance */}
        <div className="mb-8">
          <h2 className="font-semibold text-white mb-2">Slippage Tolerance</h2>
          <p className="text-sm text-text-muted mb-4">
            Maximum price difference you're willing to accept
          </p>
          <div className="flex gap-2">
            {slippageOptions.map((option) => (
              <button
                key={option}
                onClick={() => setSlippage(option)}
                className={cn(
                  'flex-1 py-3 rounded-xl font-semibold text-sm transition-all',
                  slippage === option
                    ? 'bg-accent-green text-black'
                    : 'bg-card-bg border border-white/10 text-white hover:bg-card-hover'
                )}
              >
                {option}%
              </button>
            ))}
            <div className="flex-1">
              <input
                type="text"
                placeholder="Custom"
                value={!slippageOptions.includes(slippage) ? slippage : ''}
                onChange={(e) => setSlippage(e.target.value)}
                className="w-full py-3 px-4 rounded-xl bg-card-bg border border-white/10 text-white placeholder:text-text-muted text-center text-sm focus:outline-none focus:border-accent-green/50"
              />
            </div>
          </div>
        </div>

        {/* Priority Fee */}
        <div className="mb-8">
          <h2 className="font-semibold text-white mb-2">Transaction Priority</h2>
          <p className="text-sm text-text-muted mb-4">
            Higher priority = faster confirmation but higher fees
          </p>
          <div className="space-y-2">
            {priorityOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => setPriorityFee(option.id)}
                className={cn(
                  'w-full p-4 rounded-xl text-left transition-all flex items-center justify-between',
                  priorityFee === option.id
                    ? 'bg-accent-green/10 border-2 border-accent-green'
                    : 'bg-card-bg border border-white/10 hover:border-white/20'
                )}
              >
                <div className="flex items-center gap-3">
                  {option.id === 'turbo' && (
                    <BoltIcon className={cn(
                      'w-5 h-5',
                      priorityFee === option.id ? 'text-accent-green' : 'text-accent-gold'
                    )} />
                  )}
                  <div>
                    <p className={cn(
                      'font-medium',
                      priorityFee === option.id ? 'text-accent-green' : 'text-white'
                    )}>
                      {option.label}
                    </p>
                    <p className="text-sm text-text-muted">{option.description}</p>
                  </div>
                </div>
                {priorityFee === option.id && (
                  <div className="w-5 h-5 rounded-full bg-accent-green flex items-center justify-center">
                    <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Buy Amounts */}
        <div className="mb-8">
          <h2 className="font-semibold text-white mb-2">Quick Buy Amounts</h2>
          <p className="text-sm text-text-muted mb-4">
            Default amounts shown on quick buy buttons (in USD)
          </p>
          <div className="grid grid-cols-4 gap-2">
            {defaultBuyAmounts.map((amount, index) => (
              <div key={index} className="relative">
                <CurrencyDollarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="text"
                  value={amount}
                  onChange={(e) => {
                    const newAmounts = [...defaultBuyAmounts];
                    newAmounts[index] = e.target.value;
                    setDefaultBuyAmounts(newAmounts);
                  }}
                  className="w-full py-3 pl-8 pr-3 rounded-xl bg-card-bg border border-white/10 text-white text-center focus:outline-none focus:border-accent-green/50"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Fast Mode */}
        <div>
          <div className="bg-gradient-to-r from-accent-gold/10 to-accent-green/10 border border-accent-gold/30 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent-gold/20 flex items-center justify-center">
                  <BoltIcon className="w-5 h-5 text-accent-gold" />
                </div>
                <div>
                  <p className="font-medium text-white">Fast Mode (Jito Bundles)</p>
                  <p className="text-sm text-text-muted">
                    Use Jito bundles for instant trades with MEV protection
                  </p>
                </div>
              </div>
              <button
                onClick={() => setFastMode(!fastMode)}
                className={cn(
                  'w-12 h-7 rounded-full relative transition-colors shrink-0',
                  fastMode ? 'bg-accent-gold' : 'bg-white/20'
                )}
              >
                <div className={cn(
                  'absolute top-1 w-5 h-5 rounded-full bg-white transition-all',
                  fastMode ? 'right-1' : 'left-1'
                )} />
              </button>
            </div>
            {fastMode && (
              <div className="mt-3 pt-3 border-t border-white/10">
                <p className="text-xs text-text-muted">
                  ⚡ Fast mode adds a small tip (~0.001 SOL) to Jito validators for priority inclusion.
                  Your trades will be protected from sandwich attacks.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
