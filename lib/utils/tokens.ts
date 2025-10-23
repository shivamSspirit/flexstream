import { PublicKey } from '@solana/web3.js';

export const generateTicker = (title: string): string => {
  if (!title) return '';
  // Take first 3-6 alphanumeric characters in uppercase
  const clean = title.replace(/[^A-Z0-9]/gi, '').toUpperCase();
  return clean.substring(0, Math.min(6, Math.max(3, Math.floor(clean.length / 2))));
};

export const validateTokenTicker = (ticker: string): { valid: boolean; message?: string } => {
  if (!ticker || ticker.length < 2 || ticker.length > 6) {
    return { valid: false, message: 'Ticker must be between 2-6 characters' };
  }
  if (!/^[A-Z0-9]+$/.test(ticker)) {
    return { valid: false, message: 'Ticker can only contain letters and numbers' };
  }
  return { valid: true };
};

export const formatSupply = (amount: number, decimals: number = 9): string => {
  return (amount / 10 ** decimals).toLocaleString(undefined, {
    maximumFractionDigits: decimals,
  });
};

export const parseSupply = (value: string, decimals: number = 9): number => {
  return Math.floor(parseFloat(value) * 10 ** decimals);
};

export const calculateMarketCap = (supply: number, price: number): string => {
  return (supply * price).toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const isValidPublicKey = (key: string): boolean => {
  try {
    new PublicKey(key);
    return true;
  } catch (error) {
    return false;
  }
};
