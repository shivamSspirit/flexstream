'use client';

import { useState } from 'react';
import { Copy } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  postUrl: string;
  postId: string;
}

export function ShareModal({ isOpen, onClose, postUrl, postId }: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(postUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = (platform: string) => {
    let shareUrl = '';

    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(postUrl)}`;
        break;
      case 'farcaster':
        shareUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(postUrl)}`;
        break;
      case 'lens':
        shareUrl = `https://hey.xyz/?text=${encodeURIComponent(postUrl)}`;
        break;
      case 'telegram':
        shareUrl = `https://t.me/share/url?url=${encodeURIComponent(postUrl)}`;
        break;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
  };

  const shareOptions = [
    {
      id: 'twitter',
      name: 'X',
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
      bgColor: 'bg-black',
      hoverColor: 'hover:bg-gray-900',
    },
    {
      id: 'farcaster',
      name: 'Farcaster',
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
          <path d="M6 4h12v16h-2V8H8v12H6V4z"/>
        </svg>
      ),
      bgColor: 'bg-purple-600',
      hoverColor: 'hover:bg-purple-700',
    },
    {
      id: 'lens',
      name: 'Lens',
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
          <circle cx="12" cy="12" r="8"/>
        </svg>
      ),
      bgColor: 'bg-green-600',
      hoverColor: 'hover:bg-green-700',
    },
    {
      id: 'telegram',
      name: 'Telegram',
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
        </svg>
      ),
      bgColor: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600',
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-card-bg to-app-bg border-2 border-white/10 text-text-primary p-0 gap-0">
        {/* Header - Bold & Vibrant */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 border-b border-white/10 bg-gradient-to-r from-accent-purple/5 to-accent-pink/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-accent-purple to-accent-pink flex items-center justify-center shadow-lg">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-accent-purple via-accent-pink to-accent-blue">Share & Earn</h2>
          </div>
        </div>

        {/* Content - Mobile Optimized */}
        <div className="px-4 sm:px-6 py-5 sm:py-6 space-y-5 sm:space-y-6">
          {/* Share Icons - Bigger & Bolder */}
          <div className="grid grid-cols-4 gap-3 sm:gap-4">
            {shareOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => handleShare(option.id)}
                className={`${option.bgColor} ${option.hoverColor} p-4 sm:p-5 rounded-2xl text-white transition-all hover:scale-110 active:scale-95 shadow-lg flex flex-col items-center gap-2`}
                title={`Share on ${option.name}`}
              >
                <div className="w-6 h-6 sm:w-7 sm:h-7">
                  {option.icon}
                </div>
                <span className="text-xs font-bold hidden sm:block">{option.name}</span>
              </button>
            ))}
          </div>

          {/* URL Copy Section - Enhanced */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 sm:p-4 bg-white/5 border-2 border-white/10 rounded-xl hover:border-white/20 transition-colors">
              <input
                type="text"
                value={postUrl}
                readOnly
                className="flex-1 bg-transparent text-text-secondary text-xs sm:text-sm outline-none truncate font-mono"
              />
            </div>
            <Button
              onClick={handleCopy}
              className="w-full bg-gradient-to-r from-accent-green to-accent-cyan hover:from-accent-green/90 hover:to-accent-cyan/90 text-black font-black py-3 sm:py-3.5 rounded-xl transition-all hover:scale-105 shadow-lg text-sm sm:text-base h-12 sm:h-auto"
            >
              <Copy className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              {copied ? '✓ Copied!' : 'Copy Link'}
            </Button>
          </div>

          {/* Rewards Section - More Engaging */}
          <div className="flex items-start gap-3 p-4 sm:p-5 bg-gradient-to-br from-accent-purple/10 to-accent-pink/10 border-2 border-accent-purple/20 rounded-xl hover:border-accent-purple/30 transition-colors">
            <div className="p-2 sm:p-2.5 bg-gradient-to-br from-accent-purple to-accent-pink rounded-xl shadow-lg flex-shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm sm:text-base font-black text-transparent bg-clip-text bg-gradient-to-r from-accent-purple to-accent-pink mb-1">
                💰 Earn Rewards
              </p>
              <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
                Get paid when someone buys from your share link!
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
