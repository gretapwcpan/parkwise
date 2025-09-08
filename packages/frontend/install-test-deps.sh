#!/bin/bash

echo "🔧 Installing Frontend Testing Dependencies..."
echo "============================================"

# Navigate to frontend directory
cd "$(dirname "$0")"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "⚠️  node_modules not found. Running npm install first..."
    npm install
fi

# Install testing libraries one by one
echo ""
echo "📦 Installing @testing-library/jest-dom..."
npm install --save-dev @testing-library/jest-dom@^6.1.5

echo ""
echo "📦 Installing @testing-library/react..."
npm install --save-dev @testing-library/react@^14.1.2

echo ""
echo "📦 Installing @testing-library/user-event..."
npm install --save-dev @testing-library/user-event@^14.5.1

# Verify installation
echo ""
echo "✅ Verifying installation..."
if [ -d "node_modules/@testing-library" ]; then
    echo "✓ Testing libraries installed successfully!"
    ls -la node_modules/@testing-library/
else
    echo "❌ Installation failed. Please check npm errors above."
    echo ""
    echo "Try these manual steps:"
    echo "1. rm -rf node_modules package-lock.json"
    echo "2. npm cache clean --force"
    echo "3. npm install"
    echo "4. npm install --save-dev @testing-library/jest-dom @testing-library/react @testing-library/user-event"
fi

echo ""
echo "📋 Package.json devDependencies:"
grep -A 10 '"devDependencies"' package.json
