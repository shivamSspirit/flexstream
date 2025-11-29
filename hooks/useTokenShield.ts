import { useState, useEffect, useCallback } from 'react';

export interface TokenWarning {
  type: string;
  severity: 'warning' | 'info' | 'error';
  message: string;
}

export interface TokenShieldData {
  mint: string;
  warnings: TokenWarning[];
  errors?: string[];
  metadata?: {
    name?: string;
    symbol?: string;
    verified?: boolean;
  };
}

export interface ShieldSummary {
  totalTokens: number;
  hasWarnings: boolean;
  hasErrors: boolean;
}

export interface ShieldResponse {
  tokens: Record<string, TokenShieldData>;
  summary: ShieldSummary;
}

export function useTokenShield(mints?: string | string[]) {
  const [loading, setLoading] = useState(false);
  const [shieldData, setShieldData] = useState<ShieldResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check shield for given mints
  const checkShield = useCallback(async (tokenMints: string | string[]) => {
    if (!tokenMints) {
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const mintsString = Array.isArray(tokenMints)
        ? tokenMints.join(',')
        : tokenMints;

      const response = await fetch(
        `/api/jupiter/shield?mints=${encodeURIComponent(mintsString)}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to check token risks');
      }

      const data: ShieldResponse = await response.json();
      setShieldData(data);
      return data;

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to check token risks';
      setError(errorMsg);
      return null;

    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-fetch on mount if mints provided
  useEffect(() => {
    if (mints) {
      checkShield(mints);
    }
  }, [mints, checkShield]);

  // Helper to get warnings for specific mint
  const getWarningsForMint = useCallback(
    (mint: string): TokenWarning[] => {
      if (!shieldData || !shieldData.tokens || !shieldData.tokens[mint]) {
        return [];
      }

      return shieldData.tokens[mint].warnings || [];
    },
    [shieldData]
  );

  // Helper to check if token is risky
  const isRisky = useCallback(
    (mint: string): boolean => {
      const warnings = getWarningsForMint(mint);
      return warnings.some(w => w.severity === 'warning' || w.severity === 'error');
    },
    [getWarningsForMint]
  );

  // Helper to get risk level
  const getRiskLevel = useCallback(
    (mint: string): 'safe' | 'low' | 'medium' | 'high' => {
      const warnings = getWarningsForMint(mint);

      if (warnings.length === 0) return 'safe';

      const hasError = warnings.some(w => w.severity === 'error');
      const hasWarning = warnings.some(w => w.severity === 'warning');
      const warningCount = warnings.length;

      if (hasError || warningCount >= 3) return 'high';
      if (hasWarning || warningCount === 2) return 'medium';
      return 'low';
    },
    [getWarningsForMint]
  );

  return {
    // State
    loading,
    shieldData,
    error,

    // Functions
    checkShield,
    getWarningsForMint,
    isRisky,
    getRiskLevel
  };
}
