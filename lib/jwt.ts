import jwt from 'jsonwebtoken';

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-fallback-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

export interface JWTPayload {
  userId: string;
  email: string;
  walletAddress?: string;
  iat?: number;
  exp?: number;
}

/**
 * Generate a JWT token for Pump.fun API authentication
 */
export function generatePumpFunToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  console.log('🔑 [JWT] generatePumpFunToken called with payload:', { ...payload, walletAddress: payload.walletAddress ? '[REDACTED]' : undefined });
  
  try {
    if (!JWT_SECRET) {
      console.error('❌ [JWT] JWT_SECRET is not configured');
      throw new Error('JWT_SECRET is not configured. Cannot generate token.');
    }
    
    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
      issuer: 'flexstream',
      audience: 'pump.fun-api'
    } as jwt.SignOptions);
    
    console.log('✅ [JWT] Token generated successfully, length:', token.length);
    return token;
  } catch (error) {
    console.error('❌ [JWT] Error generating JWT token:', error);
    throw new Error('Failed to generate authentication token');
  }
}

/**
 * Verify and decode a JWT token
 */
export function verifyPumpFunToken(token: string): JWTPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'flexstream',
      audience: 'pump.fun-api'
    }) as JWTPayload;
    
    return decoded;
  } catch (error) {
    console.error('Error verifying JWT token:', error);
    throw new Error('Invalid or expired token');
  }
}

/**
 * Check if a JWT token is valid (not expired)
 */
export function isTokenValid(token: string): boolean {
  try {
    jwt.verify(token, JWT_SECRET);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get token expiration time
 */
export function getTokenExpiration(token: string): Date | null {
  try {
    const decoded = jwt.decode(token) as JWTPayload;
    if (decoded && decoded.exp) {
      return new Date(decoded.exp * 1000);
    }
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token: string): boolean {
  const expiration = getTokenExpiration(token);
  if (!expiration) return true;
  
  return new Date() > expiration;
}

/**
 * Generate a token for a Clerk user
 */
export function generateTokenForClerkUser(userId: string, email: string, walletAddress?: string): string {
  return generatePumpFunToken({
    userId,
    email,
    walletAddress
  });
}
