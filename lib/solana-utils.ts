/**
 * Utility functions for Solana wallet detection and validation
 */

/**
 * Check if a wallet address is a Solana address
 * Solana addresses are base58 encoded and typically 32-44 characters long
 */
export function isSolanaAddress(address: string): boolean {
  if (!address) return false;
  
  // Solana addresses are base58 encoded
  // They typically start with numbers and are 32-44 characters long
  const solanaPattern = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  return solanaPattern.test(address);
}

/**
 * Get the first Solana wallet from a list of wallets
 */
export function getSolanaWallet(wallets: any[]): any | null {
  if (!wallets || wallets.length === 0) return null;
  
  // First, try to find a wallet explicitly marked as Solana
  let solanaWallet = wallets.find(wallet =>
    wallet.chainType === 'solana'
  );
  
  // If not found, try to find by address format
  if (!solanaWallet) {
    solanaWallet = wallets.find(wallet => 
      isSolanaAddress(wallet.address)
    );
  }
  
  // If still not found, return the first wallet (fallback)
  return solanaWallet || wallets[0] || null;
}

/**
 * Format a Solana address for display (show first 4 and last 4 characters)
 */
export function formatSolanaAddress(address: string): string {
  if (!address) return '';
  if (address.length <= 8) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

/**
 * Validate if a string is a valid Solana public key
 */
export function isValidSolanaPublicKey(publicKey: string): boolean {
  try {
    // Basic validation - Solana public keys are 32 bytes encoded in base58
    return isSolanaAddress(publicKey);
  } catch {
    return false;
  }
}
