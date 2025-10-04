#!/bin/bash

echo "🚀 FlexStream Setup Script"
echo "=========================="

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "❌ .env.local file not found!"
    exit 1
fi

echo "✅ .env.local file found"

# Check for placeholder values
if grep -q "your_anon_key_here" .env.local; then
    echo "⚠️  Please update SUPABASE_ANON_KEY in .env.local"
    echo "   Get it from: Supabase Dashboard > Settings > API > anon public key"
fi

if grep -q "\[YOUR-PASSWORD\]" .env.local; then
    echo "⚠️  Please update DATABASE_URL password in .env.local"
    echo "   Get it from: Supabase Dashboard > Settings > Database > Connection string"
fi

if grep -q "pk_test_demo_key_for_development_only" .env.local; then
    echo "⚠️  Please update Clerk keys in .env.local"
    echo "   Get them from: https://clerk.com > Create Application"
fi

echo ""
echo "📋 Next Steps:"
echo "1. Update your .env.local file with real credentials"
echo "2. Run the database setup: Copy setup-database.sql to Supabase SQL Editor"
echo "3. Restart the development server: npm run dev"
echo ""
echo "🔗 Useful Links:"
echo "   - Supabase Dashboard: https://supabase.com/dashboard"
echo "   - Clerk Dashboard: https://clerk.com/dashboard"
echo "   - Your App: http://localhost:3000"
