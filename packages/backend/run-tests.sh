#!/bin/bash

echo "🧪 Running Backend Tests..."
echo "=============================="

# Check if Jest is installed
if [ ! -f "node_modules/.bin/jest" ]; then
    echo "⚠️  Jest not found. Installing testing dependencies..."
    npm install --save-dev jest supertest @faker-js/faker
fi

# Run Jest directly
if [ -f "node_modules/.bin/jest" ]; then
    echo "✅ Running tests with Jest..."
    ./node_modules/.bin/jest
else
    echo "❌ Jest still not found. Please run:"
    echo "   npm install --save-dev jest supertest @faker-js/faker"
    echo ""
    echo "Or install globally:"
    echo "   npm install -g jest"
    echo ""
    echo "Then run: jest"
fi
