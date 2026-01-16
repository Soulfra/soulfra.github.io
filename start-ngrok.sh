#!/bin/bash

# 🌐 Soulfra ngrok Startup Script
# Exposes localhost:5050 backend to the internet

echo ""
echo "🚀 Starting ngrok tunnel for Soulfra backend..."
echo ""
echo "This will expose your local backend (localhost:5050) to the internet."
echo ""

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo "❌ ngrok is not installed!"
    echo ""
    echo "Install it with:"
    echo "  brew install ngrok"
    echo ""
    exit 1
fi

# Check if backend is running
if ! lsof -Pi :5050 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Backend is not running on port 5050!"
    echo ""
    echo "Start it with:"
    echo "  npm run backend"
    echo ""
    echo "Or start both servers:"
    echo "  npm run dev"
    echo ""
    read -p "Start backend now? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🔵 Starting backend..."
        node api/unified-backend-v2.js &
        BACKEND_PID=$!
        echo "✅ Backend started (PID: $BACKEND_PID)"
        sleep 2
    else
        echo "❌ Exiting. Start backend first."
        exit 1
    fi
fi

echo "✅ Backend is running on localhost:5050"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🔵 Starting ngrok tunnel..."
echo ""
echo "Your public URL will appear below."
echo "Copy it and update js/api-config.js:"
echo ""
echo "  BASE_URL: 'https://YOUR-NGROK-URL.ngrok.app'"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Start ngrok
ngrok http 5050

# When ngrok exits (Ctrl+C), show cleanup message
echo ""
echo "🛑 ngrok stopped"
echo ""
echo "Remember to update js/api-config.js back to localhost:"
echo "  BASE_URL: 'http://localhost:5050'"
echo ""
