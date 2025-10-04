#!/bin/bash

echo "🚀 Setting up DebsMatch Beta Testing"
echo "====================================="

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    echo "❌ EAS CLI not found. Installing..."
    npm install -g eas-cli
else
    echo "✅ EAS CLI is already installed"
fi

# Check if user is logged in
echo "🔐 Checking EAS login status..."
if eas whoami &> /dev/null; then
    echo "✅ Already logged in to EAS"
else
    echo "❌ Not logged in. Please run: eas login"
    echo "   You'll need to create an Expo account at https://expo.dev"
fi

# Initialize EAS project
echo "⚙️  Initializing EAS project..."
if [ ! -f "eas.json" ]; then
    echo "❌ eas.json not found. Run: eas build:configure"
else
    echo "✅ eas.json found"
fi

echo ""
echo "📋 Next Steps:"
echo "1. Run: eas login (if not already logged in)"
echo "2. Run: eas build:configure"
echo "3. Run: eas build --profile development --platform all"
echo "4. Follow the BETA_TESTING_GUIDE.md for distribution"
echo ""
echo "💡 Quick start with Expo Go:"
echo "1. Run: expo start"
echo "2. Share QR code with friends"
echo "3. They install Expo Go and scan the code"


