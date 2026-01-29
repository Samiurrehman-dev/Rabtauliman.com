#!/bin/bash

# Rabta-ul-Iman - Quick Setup Script
# ===================================

echo "🚀 Setting up Rabta-ul-Iman Admin Dashboard..."
echo ""

# Step 1: Create .env.local if it doesn't exist
if [ ! -f ".env.local" ]; then
    echo "📝 Creating .env.local from template..."
    cp .env.local.example .env.local
    echo "✅ .env.local created!"
    echo ""
    echo "⚠️  IMPORTANT: Please edit .env.local and add your MongoDB connection string"
    echo "   Example: mongodb+srv://username:password@cluster.mongodb.net/rabta-ul-iman"
    echo ""
    
    # Check if the user wants to open the file
    read -p "Would you like to open .env.local now? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if command -v code &> /dev/null; then
            code .env.local
        elif command -v nano &> /dev/null; then
            nano .env.local
        else
            open -a TextEdit .env.local
        fi
    fi
else
    echo "✅ .env.local already exists"
fi

echo ""
echo "======================================================"
echo "✅ Setup complete!"
echo ""
echo "📖 Next steps:"
echo "   1. Make sure MONGODB_URI is configured in .env.local"
echo "   2. Run: npm run dev"
echo "   3. Visit: http://localhost:3000/admin/dashboard"
echo ""
echo "📚 Documentation:"
echo "   - Setup Guide: ADMIN_DASHBOARD_README.md"
echo "   - Implementation Details: IMPLEMENTATION_SUMMARY.md"
echo ""
echo "🧪 To verify your setup, run: ./verify-setup.sh"
echo "======================================================"
