'use client';

import { Copy, Download, Flag, Ban } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface PostOptionsMenuProps {
  children: React.ReactNode;
  tokenAddress?: string | null;
  postId: string;
  poolAddress?: string | null;
}

export function PostOptionsMenu({ children, tokenAddress, postId, poolAddress }: PostOptionsMenuProps) {
  const handleCopyAddress = () => {
    if (tokenAddress) {
      navigator.clipboard.writeText(tokenAddress);
      toast.success('Token address copied!');
    }
  };

  const handleDownload = () => {
    // TODO: Implement download functionality
    console.log('Download post media');
  };

  // Solana Explorer Links
  const handleViewOnSolscan = () => {
    if (tokenAddress) {
      window.open(`https://solscan.io/token/${tokenAddress}`, '_blank');
    }
  };

  const handleViewOnDEXScreener = () => {
    if (tokenAddress) {
      const address = poolAddress || tokenAddress;
      window.open(`https://dexscreener.com/solana/${address}`, '_blank');
    }
  };

  const handleViewOnSolanaExplorer = () => {
    if (tokenAddress) {
      window.open(`https://explorer.solana.com/address/${tokenAddress}`, '_blank');
    }
  };

  const handleViewOnBirdeye = () => {
    if (tokenAddress) {
      window.open(`https://birdeye.so/token/${tokenAddress}?chain=solana`, '_blank');
    }
  };

  const handleViewOnCoinGecko = () => {
    window.open('https://www.coingecko.com/en/coins/solana-ecosystem', '_blank');
  };

  const handleViewOnPhoton = () => {
    if (poolAddress) {
      window.open(`https://photon-sol.tinyastro.io/en/lp/${poolAddress}`, '_blank');
    } else if (tokenAddress) {
      window.open(`https://photon-sol.tinyastro.io/en/lp/${tokenAddress}`, '_blank');
    }
  };

  const handleReport = () => {
    // TODO: Implement report functionality
    console.log('Report post:', postId);
  };

  const handleBlock = () => {
    // TODO: Implement block user functionality
    console.log('Block user from post:', postId);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {children}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-56 bg-card-bg border-white/10 shadow-xl"
      >
        {/* Top actions */}
        <DropdownMenuItem
          onClick={handleCopyAddress}
          className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/5 focus:bg-white/5 text-text-primary"
        >
          <div className="p-2 bg-white/5 rounded-lg">
            <Copy className="h-4 w-4" />
          </div>
          <span className="font-medium">Copy address</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={handleDownload}
          className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/5 focus:bg-white/5 text-text-primary"
        >
          <div className="p-2 bg-white/5 rounded-lg">
            <Download className="h-4 w-4" />
          </div>
          <span className="font-medium">Download</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-white/10" />

        {/* Solana Explorers */}
        {tokenAddress && (
          <>
            <DropdownMenuItem
              onClick={handleViewOnSolscan}
              className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/5 focus:bg-white/5 text-text-primary"
            >
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <svg className="h-4 w-4 text-purple-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
              <span className="font-medium">Solscan</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={handleViewOnDEXScreener}
              className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/5 focus:bg-white/5 text-text-primary"
            >
              <div className="p-2 bg-gray-500/10 rounded-lg">
                <svg className="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <span className="font-medium">DEXScreener</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={handleViewOnSolanaExplorer}
              className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/5 focus:bg-white/5 text-text-primary"
            >
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <svg className="h-4 w-4 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <span className="font-medium">Solana Explorer</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={handleViewOnBirdeye}
              className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/5 focus:bg-white/5 text-text-primary"
            >
              <div className="p-2 bg-green-500/10 rounded-lg">
                <svg className="h-4 w-4 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <span className="font-medium">Birdeye</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={handleViewOnCoinGecko}
              className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/5 focus:bg-white/5 text-text-primary"
            >
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <svg className="h-4 w-4 text-yellow-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="font-medium">CoinGecko</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={handleViewOnPhoton}
              className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/5 focus:bg-white/5 text-text-primary"
            >
              <div className="p-2 bg-cyan-500/10 rounded-lg">
                <svg className="h-4 w-4 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="font-medium">Photon</span>
            </DropdownMenuItem>
          </>
        )}

        <DropdownMenuSeparator className="bg-white/10" />

        {/* Moderation actions */}
        <DropdownMenuItem
          onClick={handleReport}
          className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-red-500/10 focus:bg-red-500/10 text-red-400"
        >
          <div className="p-2 bg-red-500/10 rounded-lg">
            <Flag className="h-4 w-4" />
          </div>
          <span className="font-medium">Report</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={handleBlock}
          className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-red-500/10 focus:bg-red-500/10 text-red-400"
        >
          <div className="p-2 bg-red-500/10 rounded-lg">
            <Ban className="h-4 w-4" />
          </div>
          <span className="font-medium">Block</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
