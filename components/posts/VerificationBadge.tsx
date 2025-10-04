'use client';

import { CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function VerificationBadge() {
  return (
    <Badge 
      variant="verified" 
      className="flex items-center space-x-1 text-xs"
    >
      <CheckCircle className="h-3 w-3" />
      <span>Verified</span>
    </Badge>
  );
}
