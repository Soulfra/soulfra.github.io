#!/bin/bash
# Soulfra Startup Script
# Starts backend API + frontend server

echo "🛑 Stopping any existing processes..."
pkill -f "node api/unified-backend" 2>/dev/null
pkill -f "python3 -m http.server 8000" 2>/dev/null

# Wait for processes to die
sleep 2

echo ""
echo "🚀 Starting Soulfra..."
echo ""

# Start backend
echo "📡 Starting backend API..."
node api/unified-backend-v2.js > logs/backend.log 2>&1 &
BACKEND_PID=$!
echo "   Backend running on http://localhost:5050 (PID: $BACKEND_PID)"

# Wait for backend to initialize
sleep 3

# Start frontend
echo "🌐 Starting frontend server..."
python3 -m http.server 8000 > logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "   Frontend running on http://localhost:8000 (PID: $FRONTEND_PID)"

echo ""
echo "✅ Soulfra is running!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🤖 AI Assistant Widget"
echo "     http://localhost:8000/soulfra-assistant.html"
echo ""
echo "  📊 Content Brewery"
echo "     http://localhost:8000/content-brewery.html"
echo ""
echo "  🔌 API Endpoints"
echo "     POST http://localhost:5050/api/assistant/chat"
echo "     GET  http://localhost:5050/api/assistant/info"
echo "     GET  http://localhost:5050/api"
echo ""
echo "  📝 Logs"
echo "     tail -f logs/backend.log"
echo "     tail -f logs/frontend.log"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💡 To stop: bash stop.sh"
echo ""
