#!/bin/bash

# Rabta-ul-Iman - Quick Setup Test Script
# ========================================

echo "🚀 Rabta-ul-Iman Admin Dashboard - Setup Verification"
echo "======================================================"
echo ""

# Check if .env.local exists
echo "📋 Checking environment configuration..."
if [ -f ".env.local" ]; then
    echo "✅ .env.local found"
    if grep -q "MONGODB_URI=mongodb" .env.local; then
        echo "✅ MONGODB_URI is configured"
    else
        echo "⚠️  Please configure MONGODB_URI in .env.local"
    fi
else
    echo "⚠️  .env.local not found. Please create it from .env.local.example"
    echo "   Run: cp .env.local.example .env.local"
fi

echo ""

# Check if node_modules exists
echo "📦 Checking dependencies..."
if [ -d "node_modules" ]; then
    echo "✅ Dependencies installed"
else
    echo "⚠️  Dependencies not found. Run: npm install"
fi

echo ""

# Check key files
echo "📁 Verifying project files..."
files=(
    "src/lib/db.ts"
    "src/models/Transaction.ts"
    "src/app/api/admin/transactions/route.ts"
    "src/app/api/admin/transactions/[id]/route.ts"
    "src/app/admin/dashboard/page.tsx"
    "components/ui/button.tsx"
    "components/ui/card.tsx"
    "components/ui/table.tsx"
    "components/ui/dialog.tsx"
    "components/ui/badge.tsx"
)

all_files_exist=true
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file (missing)"
        all_files_exist=false
    fi
done

echo ""
echo "======================================================"

if [ -f ".env.local" ] && [ -d "node_modules" ] && [ "$all_files_exist" = true ]; then
    echo "✅ All checks passed! You're ready to go!"
    echo ""
    echo "🚀 Start the development server:"
    echo "   npm run dev"
    echo ""
    echo "📱 Then visit: http://localhost:3000/admin/dashboard"
else
    echo "⚠️  Some checks failed. Please review the issues above."
    echo ""
    echo "📖 For detailed setup instructions, see: ADMIN_DASHBOARD_README.md"
fi

echo ""
