import { Keypair, PublicKey } from '@solana/web3.js';
import crypto from 'crypto';

export interface GeneratedWallet {
  publicKey: string;
  privateKey: string; // Base64 encoded
  secretKey: Uint8Array;
}

/**
 * Generate a new Solana wallet for a user
 */
export function generateSolanaWallet(): GeneratedWallet {
  console.log('🔑 [Wallet] Generating new Solana wallet...');
  
  try {
    // Generate a new keypair
    const keypair = Keypair.generate();
    
    // Get the public key as string
    const publicKey = keypair.publicKey.toString();
    
    // Get the private key as base64 string for storage
    const privateKey = Buffer.from(keypair.secretKey).toString('base64');
    
    console.log('✅ [Wallet] Wallet generated successfully:', {
      publicKey: publicKey.slice(0, 8) + '...' + publicKey.slice(-8),
      privateKeyLength: privateKey.length
    });
    
    return {
      publicKey,
      privateKey,
      secretKey: keypair.secretKey
    };
  } catch (error) {
    console.error('❌ [Wallet] Error generating wallet:', error);
    throw new Error('Failed to generate Solana wallet');
  }
}

/**
 * Encrypt private key for secure storage
 */
export function encryptPrivateKey(privateKey: string, password: string): string {
  try {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(password, 'flexstream-salt', 32);
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipher(algorithm, key);
    
    let encrypted = cipher.update(privateKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return `${iv.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('❌ [Wallet] Error encrypting private key:', error);
    throw new Error('Failed to encrypt private key');
  }
}

/**
 * Decrypt private key
 */
export function decryptPrivateKey(encryptedKey: string, password: string): string {
  try {
    if (!encryptedKey || typeof encryptedKey !== 'string') {
      throw new Error('Invalid encrypted key');
    }
    
    const [ivHex, encrypted] = encryptedKey.split(':');
    
    if (!ivHex || !encrypted) {
      throw new Error('Invalid encrypted key format');
    }
    
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(password, 'flexstream-salt', 32);
    
    const decipher = crypto.createDecipher(algorithm, key);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('❌ [Wallet] Error decrypting private key:', error);
    throw new Error('Failed to decrypt private key');
  }
}

/**
 * Validate Solana public key format
 */
export function isValidSolanaAddress(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

/**
 * Create a keypair from base64 encoded private key
 */
export function createKeypairFromPrivateKey(privateKeyBase64: string): Keypair {
  try {
    const secretKey = Buffer.from(privateKeyBase64, 'base64');
    return Keypair.fromSecretKey(secretKey);
  } catch (error) {
    console.error('❌ [Wallet] Error creating keypair from private key:', error);
    throw new Error('Invalid private key format');
  }
}

/**
 * Get wallet address from private key
 */
export function getWalletAddressFromPrivateKey(privateKeyBase64: string): string {
  const keypair = createKeypairFromPrivateKey(privateKeyBase64);
  return keypair.publicKey.toString();
}
