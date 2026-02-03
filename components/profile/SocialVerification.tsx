'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CheckBadgeIcon,
  ArrowTopRightOnSquareIcon,
  XMarkIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/solid';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface SocialPlatform {
  id: 'twitter' | 'youtube' | 'tiktok';
  name: string;
  icon: React.ReactNode;
  color: string;
  bgGradient: string;
  borderColor: string;
  verified: boolean;
  username?: string;
  followers: number;
  verifiedAt?: string;
}

interface SocialVerificationProps {
  walletAddress: string;
  twitterVerified?: boolean;
  twitterUsername?: string;
  twitterFollowers?: number;
  twitterVerifiedAt?: string;
  youtubeVerified?: boolean;
  youtubeChannelName?: string;
  youtubeSubscribers?: number;
  youtubeVerifiedAt?: string;
  tiktokVerified?: boolean;
  tiktokUsername?: string;
  tiktokFollowers?: number;
  tiktokVerifiedAt?: string;
  onVerificationChange?: () => void;
  readOnly?: boolean;
}

export function SocialVerification({
  walletAddress,
  twitterVerified = false,
  twitterUsername,
  twitterFollowers = 0,
  twitterVerifiedAt,
  youtubeVerified = false,
  youtubeChannelName,
  youtubeSubscribers = 0,
  youtubeVerifiedAt,
  tiktokVerified = false,
  tiktokUsername,
  tiktokFollowers = 0,
  tiktokVerifiedAt,
  onVerificationChange,
  readOnly = false,
}: SocialVerificationProps) {
  const [connecting, setConnecting] = useState<string | null>(null);

  const platforms: SocialPlatform[] = [
    {
      id: 'twitter',
      name: 'Twitter / X',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
      color: 'text-white',
      bgGradient: 'from-zinc-800 to-zinc-900',
      borderColor: 'border-zinc-600 hover:border-zinc-400',
      verified: twitterVerified,
      username: twitterUsername,
      followers: twitterFollowers,
      verifiedAt: twitterVerifiedAt,
    },
    {
      id: 'youtube',
      name: 'YouTube',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      ),
      color: 'text-red-500',
      bgGradient: 'from-red-950 to-red-900',
      borderColor: 'border-red-800 hover:border-red-500',
      verified: youtubeVerified,
      username: youtubeChannelName,
      followers: youtubeSubscribers,
      verifiedAt: youtubeVerifiedAt,
    },
    {
      id: 'tiktok',
      name: 'TikTok',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
        </svg>
      ),
      color: 'text-pink-400',
      bgGradient: 'from-pink-950 via-purple-950 to-cyan-950',
      borderColor: 'border-pink-700 hover:border-pink-400',
      verified: tiktokVerified,
      username: tiktokUsername,
      followers: tiktokFollowers,
      verifiedAt: tiktokVerifiedAt,
    },
  ];

  const handleConnect = async (platform: 'twitter' | 'youtube' | 'tiktok') => {
    if (!walletAddress) {
      toast.error('Please connect your wallet first');
      return;
    }

    setConnecting(platform);

    try {
      const response = await fetch(`/api/auth/${platform}/connect?wallet=${walletAddress}`);
      const data = await response.json();

      if (data.success && data.authUrl) {
        // Redirect to OAuth provider
        window.location.href = data.authUrl;
      } else {
        toast.error(data.error || `Failed to connect ${platform}`);
      }
    } catch (error) {
      console.error(`Error connecting ${platform}:`, error);
      toast.error(`Failed to connect ${platform}`);
    } finally {
      setConnecting(null);
    }
  };

  const formatFollowers = (count: number): string => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const verifiedCount = platforms.filter(p => p.verified).length;
  const totalFollowers = platforms.reduce((sum, p) => sum + p.followers, 0);

  return (
    <div className="space-y-4">
      {/* Header with Trust Score Preview */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <CheckBadgeIcon className="w-5 h-5 text-accent-cyan" />
            Social Verification
          </h3>
          <p className="text-sm text-white/50">
            Verify your accounts to build trust with your audience
          </p>
        </div>
        {verifiedCount > 0 && (
          <div className="text-right">
            <div className="flex items-center gap-1.5">
              <span className="text-2xl font-black bg-gradient-to-r from-accent-green to-accent-cyan bg-clip-text text-transparent">
                {verifiedCount}/3
              </span>
              <span className="text-sm text-white/50">verified</span>
            </div>
            <p className="text-xs text-white/40">
              {formatFollowers(totalFollowers)} total followers
            </p>
          </div>
        )}
      </div>

      {/* Platform Cards */}
      <div className="space-y-3">
        {platforms.map((platform) => (
          <div
            key={platform.id}
            className={cn(
              'relative overflow-hidden rounded-xl border-2 transition-all duration-300',
              platform.verified
                ? 'bg-gradient-to-r ' + platform.bgGradient + ' border-accent-green/50'
                : 'bg-white/5 ' + platform.borderColor
            )}
          >
            {/* Verified glow effect */}
            {platform.verified && (
              <div className="absolute inset-0 bg-gradient-to-r from-accent-green/10 to-transparent animate-pulse" />
            )}

            <div className="relative p-4">
              <div className="flex items-center justify-between">
                {/* Platform Info */}
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'w-12 h-12 rounded-xl flex items-center justify-center',
                      platform.verified
                        ? 'bg-white/10'
                        : 'bg-white/5'
                    )}
                  >
                    <span className={platform.color}>{platform.icon}</span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{platform.name}</span>
                      {platform.verified && (
                        <Badge className="bg-accent-green/20 text-accent-green border-accent-green/30 text-xs px-1.5 py-0">
                          <CheckBadgeIcon className="w-3 h-3 mr-0.5" />
                          Verified
                        </Badge>
                      )}
                    </div>

                    {platform.verified && platform.username ? (
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-sm text-white/70">@{platform.username}</span>
                        <span className="text-white/30">•</span>
                        <span className="text-sm font-semibold text-accent-cyan">
                          {formatFollowers(platform.followers)} followers
                        </span>
                      </div>
                    ) : (
                      <p className="text-sm text-white/40">Not connected</p>
                    )}
                  </div>
                </div>

                {/* Action Button */}
                {!readOnly && (
                  <div>
                    {platform.verified ? (
                      <div className="flex items-center gap-2">
                        <a
                          href={
                            platform.id === 'twitter'
                              ? `https://twitter.com/${platform.username}`
                              : platform.id === 'youtube'
                              ? `https://youtube.com/@${platform.username}`
                              : `https://tiktok.com/@${platform.username}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                        >
                          <ArrowTopRightOnSquareIcon className="w-4 h-4 text-white/70" />
                        </a>
                      </div>
                    ) : (
                      <Button
                        onClick={() => handleConnect(platform.id)}
                        disabled={connecting === platform.id}
                        className={cn(
                          'font-bold transition-all',
                          platform.id === 'twitter' && 'bg-white text-black hover:bg-white/90',
                          platform.id === 'youtube' && 'bg-red-600 hover:bg-red-500 text-white',
                          platform.id === 'tiktok' && 'bg-gradient-to-r from-pink-500 to-cyan-400 text-black hover:from-pink-400 hover:to-cyan-300'
                        )}
                      >
                        {connecting === platform.id ? (
                          <ArrowPathIcon className="w-4 h-4 animate-spin mr-2" />
                        ) : null}
                        Connect
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Verified timestamp */}
              {platform.verified && platform.verifiedAt && (
                <p className="text-xs text-white/30 mt-2 pl-15">
                  Verified {new Date(platform.verifiedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Trust Score Info */}
      <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-accent-purple/10 to-accent-cyan/10 border border-white/10">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-purple to-accent-cyan flex items-center justify-center flex-shrink-0">
            <span className="text-lg">🛡️</span>
          </div>
          <div>
            <h4 className="font-bold text-white text-sm">Build Your Trust Score</h4>
            <p className="text-xs text-white/60 mt-1 leading-relaxed">
              Verified accounts earn up to <span className="text-accent-green font-semibold">+20 points</span> each.
              High follower counts add <span className="text-accent-cyan font-semibold">+5 to +15 bonus points</span>.
              A higher trust score means better visibility and credibility on Flexit.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
