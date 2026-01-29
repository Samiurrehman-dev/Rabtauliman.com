#!/bin/bash

# Rabta-ul-Iman Donor Portal - Quick Setup Script

echo "🚀 Setting up Rabta-ul-Iman Donor Portal..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ npm version: $(npm -v)"

# Check if MongoDB is running
echo ""
echo "📦 Checking MongoDB connection..."
if ! nc -z localhost 27017 2>/dev/null; then
    echo "⚠️  MongoDB doesn't appear to be running on localhost:27017"
    echo "   Please start MongoDB before running the application"
else
    echo "✅ MongoDB is running"
fi

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Check if .env.local exists
echo ""
if [ ! -f .env.local ]; then
    echo "⚠️  .env.local file not found!"
    echo "   Creating .env.local with template..."
    cat > .env.local << 'EOF'
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/rabta-ul-iman

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-super-secret-key-change-this-in-production

# Admin Credentials (optional - defaults available)
# ADMIN_USERNAME=admin
# ADMIN_PASSWORD_HASH=$2a$10$8K1p/a0dL3LcnPCzm8J/L.v7w2FqL8Q0R3K8L3qD8YvL9p3L1L2L3
EOF
    echo "✅ Created .env.local file"
    echo "   Please update NEXTAUTH_SECRET and MONGODB_URI if needed"
else
    echo "✅ .env.local file exists"
fi

echo ""
echo "✨ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Make sure MongoDB is running"
echo "   2. Update .env.local with your configuration"
echo "   3. Run 'npm run dev' to start the development server"
echo "   4. Visit http://localhost:3000/donor/signup to create your first donor account"
echo "   5. Visit http://localhost:3000/admin/login to access admin dashboard (admin/admin123)"
echo ""
echo "📚 Documentation:"
echo "   - Implementation details: DONOR_PORTAL_IMPLEMENTATION.md"
echo "   - Admin dashboard: ADMIN_DASHBOARD_README.md"
echo ""
