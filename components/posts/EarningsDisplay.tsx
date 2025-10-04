'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, CheckCircle, Clock, XCircle } from 'lucide-react';
import { formatEarnings, truncateAddress } from '@/lib/utils';

interface EarningsDisplayProps {
  amount: number;
  verified: boolean;
  tokenAddress?: string;
}

export function EarningsDisplay({ amount, verified, tokenAddress }: EarningsDisplayProps) {
  const getVerificationIcon = () => {
    if (verified) {
      return <CheckCircle className="h-4 w-4 text-green-400" />;
    }
    return <Clock className="h-4 w-4 text-yellow-400" />;
  };

  const getVerificationText = () => {
    if (verified) {
      return 'Verified';
    }
    return 'Pending Verification';
  };

  const getVerificationColor = () => {
    if (verified) {
      return 'bg-green-500/20 text-green-400 border-green-500/30';
    }
    return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
  };

  return (
    <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="text-2xl">💰</div>
          <div>
            <div className="text-2xl font-bold text-green-400">
              {formatEarnings(amount)}
            </div>
            <div className="text-sm text-gray-400">
              Earnings from this trade
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge 
            variant="outline" 
            className={`${getVerificationColor()} flex items-center space-x-1`}
          >
            {getVerificationIcon()}
            <span className="text-xs">{getVerificationText()}</span>
          </Badge>
        </div>
      </div>
      
      {tokenAddress && (
        <div className="mt-3 pt-3 border-t border-green-500/20">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-400">
              Token: {truncateAddress(tokenAddress)}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-green-400 hover:text-green-300"
              onClick={() => window.open(`https://solscan.io/token/${tokenAddress}`, '_blank')}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              View Token
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
