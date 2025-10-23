#!/usr/bin/env node

/**
 * Environment Validation Script
 * Run this to check if all required environment variables are set
 */

console.log('🔍 Checking FlexStream environment configuration...\n');

const requiredEnvVars = {
  'NEXT_PUBLIC_SUPABASE_URL': process.env.NEXT_PUBLIC_SUPABASE_URL,
  'NEXT_PUBLIC_SUPABASE_ANON_KEY': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  'SUPABASE_SERVICE_ROLE_KEY': process.env.SUPABASE_SERVICE_ROLE_KEY,
  'DATABASE_URL': process.env.DATABASE_URL,
  'NEXT_PUBLIC_SOLANA_RPC_URL': process.env.NEXT_PUBLIC_SOLANA_RPC_URL,
  'NEXT_PUBLIC_SOLANA_NETWORK': process.env.NEXT_PUBLIC_SOLANA_NETWORK,
  'POOL_CONFIG_KEY': process.env.POOL_CONFIG_KEY,
};

const optionalEnvVars = {
  'DBC_CREATOR_PRIVATE_KEY': process.env.DBC_CREATOR_PRIVATE_KEY,
  'JWT_SECRET': process.env.JWT_SECRET,
  'UPLOADTHING_SECRET': process.env.UPLOADTHING_SECRET,
  'UPLOADTHING_APP_ID': process.env.UPLOADTHING_APP_ID,
};

let hasErrors = false;

console.log('📋 Required Environment Variables:');
Object.entries(requiredEnvVars).forEach(([key, value]) => {
  const status = value ? '✅' : '❌';
  const displayValue = value ? `${value.substring(0, 20)}...` : 'NOT SET';
  console.log(`  ${status} ${key}: ${displayValue}`);
  
  if (!value) {
    hasErrors = true;
  }
});

console.log('\n📋 Optional Environment Variables:');
Object.entries(optionalEnvVars).forEach(([key, value]) => {
  const status = value ? '✅' : '⚠️';
  const displayValue = value ? `${value.substring(0, 20)}...` : 'NOT SET';
  console.log(`  ${status} ${key}: ${displayValue}`);
});

console.log('\n🔧 Configuration Status:');
console.log(`  Supabase: ${requiredEnvVars.NEXT_PUBLIC_SUPABASE_URL ? '✅ Configured' : '❌ Missing'}`);
console.log(`  Solana RPC: ${requiredEnvVars.NEXT_PUBLIC_SOLANA_RPC_URL ? '✅ Configured' : '❌ Missing'}`);
console.log(`  DBC Config: ${requiredEnvVars.POOL_CONFIG_KEY ? '✅ Configured' : '❌ Missing'}`);

if (hasErrors) {
  console.log('\n❌ Configuration Issues Found!');
  console.log('\nTo fix these issues:');
  console.log('1. Copy env.example to .env.local');
  console.log('2. Fill in your Supabase credentials');
  console.log('3. Set up Solana RPC URL');
  console.log('4. Restart your development server');
  
  console.log('\n📖 Quick Setup:');
  console.log('  cp env.example .env.local');
  console.log('  # Edit .env.local with your values');
  console.log('  npm run dev');
  
  process.exit(1);
} else {
  console.log('\n✅ All required environment variables are configured!');
  console.log('🚀 Your FlexStream app should work correctly.');
}
