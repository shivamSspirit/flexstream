'use client';

import { Copy, Download, ExternalLink, Flag, Ban } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface PostOptionsMenuProps {
  children: React.ReactNode;
  tokenAddress?: string | null;
  postId: string;
}

export function PostOptionsMenu({ children, tokenAddress, postId }: PostOptionsMenuProps) {
  const handleCopyAddress = () => {
    if (tokenAddress) {
      navigator.clipboard.writeText(tokenAddress);
      // TODO: Show toast notification
      console.log('Token address copied:', tokenAddress);
    }
  };

  const handleDownload = () => {
    // TODO: Implement download functionality
    console.log('Download post media');
  };

  const handleViewOnBasescan = () => {
    if (tokenAddress) {
      window.open(`https://basescan.org/token/${tokenAddress}`, '_blank');
    }
  };

  const handleViewOnMatcha = () => {
    if (tokenAddress) {
      window.open(`https://matcha.xyz/tokens/base/${tokenAddress}`, '_blank');
    }
  };

  const handleViewOnGeckoTerminal = () => {
    if (tokenAddress) {
      window.open(`https://www.geckoterminal.com/base/pools/${tokenAddress}`, '_blank');
    }
  };

  const handleViewOnDEXScreener = () => {
    if (tokenAddress) {
      window.open(`https://dexscreener.com/base/${tokenAddress}`, '_blank');
    }
  };

  const handleViewOnBubblemaps = () => {
    if (tokenAddress) {
      window.open(`https://app.bubblemaps.io/base/token/${tokenAddress}`, '_blank');
    }
  };

  const handleViewOnTokenChat = () => {
    if (tokenAddress) {
      window.open(`https://tokenchat.io/base/${tokenAddress}`, '_blank');
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

        {/* Blockchain Explorers */}
        <DropdownMenuItem
          onClick={handleViewOnBasescan}
          className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/5 focus:bg-white/5 text-text-primary"
        >
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <ExternalLink className="h-4 w-4 text-blue-400" />
          </div>
          <span className="font-medium">Basescan</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={handleViewOnMatcha}
          className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/5 focus:bg-white/5 text-text-primary"
        >
          <div className="p-2 bg-green-500/10 rounded-lg">
            <ExternalLink className="h-4 w-4 text-green-400" />
          </div>
          <span className="font-medium">Matcha</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={handleViewOnGeckoTerminal}
          className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/5 focus:bg-white/5 text-text-primary"
        >
          <div className="p-2 bg-purple-500/10 rounded-lg">
            <ExternalLink className="h-4 w-4 text-purple-400" />
          </div>
          <span className="font-medium">GeckoTerminal</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={handleViewOnDEXScreener}
          className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/5 focus:bg-white/5 text-text-primary"
        >
          <div className="p-2 bg-gray-500/10 rounded-lg">
            <ExternalLink className="h-4 w-4 text-gray-400" />
          </div>
          <span className="font-medium">DEX Screener</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={handleViewOnBubblemaps}
          className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/5 focus:bg-white/5 text-text-primary"
        >
          <div className="p-2 bg-pink-500/10 rounded-lg">
            <ExternalLink className="h-4 w-4 text-pink-400" />
          </div>
          <span className="font-medium">Bubblemaps</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={handleViewOnTokenChat}
          className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/5 focus:bg-white/5 text-text-primary"
        >
          <div className="p-2 bg-cyan-500/10 rounded-lg">
            <ExternalLink className="h-4 w-4 text-cyan-400" />
          </div>
          <span className="font-medium">TokenChat</span>
        </DropdownMenuItem>

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
