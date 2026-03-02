#!/bin/bash

# Peak Setup Script for Linux/macOS

# Ensure we are in the project root
cd "$(dirname "$0")/.." || exit 1

echo "🚀 Starting Peak Setup..."

# Install root dependencies
echo "📦 Installing internal dependencies..."
npm install

# Build all packages (core, db) and apps (cli, web)
echo "🏗️ Building Peak Monorepo..."
npm run build

# Link CLI globally (optional, but recommended)
echo "🔗 Linking Peak CLI globally..."

# Use 'npm install -g .' from within the cli directory to install it natively without workspace issues
cd apps/cli || exit 1

if [ -w "$(npm config get prefix)/lib/node_modules" ] || [ -w "/usr/local/lib/node_modules" ]; then
    npm install -g .
else
    echo "⚠️ Permission denied. Please enter your password to link 'peak' globally:"
    sudo npm install -g .
fi

cd ../.. || exit 1

echo "⚙️  Saving Peak configuration..."
PROJECT_ROOT=$(pwd)
echo "{\"projectRoot\": \"$PROJECT_ROOT\"}" > "$HOME/.peak-config.json"

echo "🖥️  Creating Desktop Shortcut..."
node apps/cli/dist/index.js create-shortcut

echo "✅ Setup complete!"
echo "You can now use 'peak' command or run 'npm run dev' to start the web dashboard."
