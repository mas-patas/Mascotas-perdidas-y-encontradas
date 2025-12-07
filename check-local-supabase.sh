#!/bin/bash

echo "=========================================="
echo "Local Supabase Setup Verification"
echo "=========================================="
echo ""

# Check if we're in the right directory
if [ ! -f "supabase/config.toml" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

echo "1. Checking Supabase CLI..."
if command -v supabase &> /dev/null; then
    echo "   ✅ Supabase CLI found: $(which supabase)"
    SUPABASE_CMD="supabase"
elif command -v npx &> /dev/null; then
    echo "   ✅ Using npx supabase"
    SUPABASE_CMD="npx supabase"
else
    echo "   ❌ Supabase CLI not found. Install with: npm install -g supabase"
    exit 1
fi

echo ""
echo "2. Checking Supabase status..."
$SUPABASE_CMD status

echo ""
echo "3. Checking if local API is accessible..."
if curl -s http://127.0.0.1:54321/rest/v1/ > /dev/null 2>&1; then
    echo "   ✅ Local Supabase API is responding at http://127.0.0.1:54321"
else
    echo "   ❌ Local Supabase API is NOT responding"
    echo "   💡 Make sure you've started Supabase with: $SUPABASE_CMD start"
fi

echo ""
echo "4. Current .env configuration:"
if [ -f ".env" ]; then
    echo "   Current VITE_SUPABASE_URL:"
    grep "VITE_SUPABASE_URL" .env || echo "   (not found)"
    echo ""
    echo "   Expected for local: VITE_SUPABASE_URL=http://127.0.0.1:54321"
else
    echo "   ⚠️  .env file not found"
fi

echo ""
echo "=========================================="
echo "To get your local anon key, run:"
echo "  $SUPABASE_CMD status"
echo ""
echo "Look for 'anon key' or 'anon_key' in the output"
echo "=========================================="
