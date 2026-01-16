#!/bin/bash
# Soulfra Stop Script
# Stops all running processes

echo "🛑 Stopping Soulfra..."
echo ""

# Kill backend
if pkill -f "node api/unified-backend" 2>/dev/null; then
  echo "✅ Backend stopped"
else
  echo "ℹ️  Backend was not running"
fi

# Kill frontend
if pkill -f "python3 -m http.server 8000" 2>/dev/null; then
  echo "✅ Frontend stopped"
else
  echo "ℹ️  Frontend was not running"
fi

echo ""
echo "✅ All stopped"
echo ""
