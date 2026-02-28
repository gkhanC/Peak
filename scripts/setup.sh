#!/bin/bash

# Peak Setup Script for Linux/macOS

echo "🚀 Starting Peak Setup..."

# Install root dependencies
echo "📦 Installing internal dependencies..."
npm install

# Build all packages (core, db) and apps (cli, web)
echo "🏗️ Building Peak Monorepo..."
npm run build

# Link CLI globally (optional, but recommended)
echo "🔗 Installing Peak CLI globally..."

# Get absolute path to the CLI directory
CLI_DIR="$(pwd)/apps/cli"

# Use 'npm install -g' with the direct path to avoid monorepo workspace issues
if [ -w "$(npm config get prefix)/lib/node_modules" ] || [ -w "/usr/local/lib/node_modules" ]; then
    npm install -g "$CLI_DIR"
else
    echo "⚠️ Permission denied. Please enter your password to install 'peak' globally:"
    sudo npm install -g "$CLI_DIR"
fi

echo "✅ Setup complete!"
echo "You can now use 'peak' command or run 'npm run dev' to start the web dashboard."
