#!/bin/bash

# Deployment Verification Script
# Tests all academy URLs like a "radio broadcast check"

set -e

echo "🔍 DEPLOYMENT VERIFICATION - What's Actually Live?"
echo "══════════════════════════════════════════════════════════════════"
echo ""

BASE_URL="https://soulfra.github.io"

# Test a URL and report status
test_url() {
  local url="$1"
  local name="$2"

  status_code=$(curl -sI "$url" 2>/dev/null | head -1 | awk '{print $2}')

  if [ "$status_code" = "200" ]; then
    echo "  ✅ $name"
    echo "     $url"
  elif [ "$status_code" = "404" ]; then
    echo "  ❌ $name (404 NOT FOUND)"
    echo "     $url"
  else
    echo "  ⚠️  $name ($status_code)"
    echo "     $url"
  fi
}

echo "📍 MAIN PAGES"
echo "──────────────────────────────────────────────────────────────────"
test_url "$BASE_URL/" "Homepage"
test_url "$BASE_URL/public/academy/" "Academy Hub"
test_url "$BASE_URL/learn/" "Learn Hub"

echo ""
echo "📚 LESSONS"
echo "──────────────────────────────────────────────────────────────────"
test_url "$BASE_URL/learn/pools-101.html" "Lesson 1 - Database Pools"
test_url "$BASE_URL/learn/pools-102.html" "Lesson 2 - Thread Pools"
test_url "$BASE_URL/learn/pools-103.html" "Lesson 3 - Connection Pools"
test_url "$BASE_URL/learn/index.html" "Lesson 4 - Learn Index"

echo ""
echo "🔗 NAVIGATION TEST"
echo "──────────────────────────────────────────────────────────────────"
echo "Testing if academy hub links work..."

# Fetch academy hub and extract lesson URLs
academy_html=$(curl -s "$BASE_URL/public/academy/")

# Check if pools-101 link exists in academy HTML
if echo "$academy_html" | grep -q "pools-101.html"; then
  echo "  ✅ Academy hub contains pools-101.html link"
else
  echo "  ❌ Academy hub missing pools-101.html link"
fi

# Check completion tracking code
if echo "$academy_html" | grep -q "completeLesson"; then
  echo "  ✅ Completion tracking code found"
else
  echo "  ❌ Completion tracking code missing"
fi

# Check pools-101 return link
pools_html=$(curl -s "$BASE_URL/learn/pools-101.html")
if echo "$pools_html" | grep -q "public/academy"; then
  echo "  ✅ Pools-101 has return link to academy"
else
  echo "  ❌ Pools-101 missing return link to academy"
fi

echo ""
echo "📊 LOCAL VS GITHUB COMPARISON"
echo "──────────────────────────────────────────────────────────────────"

# Check if local files match deployed files
echo "Checking file timestamps..."

local_academy_time=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M:%S" public/academy/index.html 2>/dev/null || echo "N/A")
local_pools_time=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M:%S" learn/pools-101.html 2>/dev/null || echo "N/A")

echo "  Local academy: $local_academy_time"
echo "  Local pools-101: $local_pools_time"

# Get last GitHub deploy time
github_time=$(curl -sI "$BASE_URL/learn/pools-101.html" | grep -i "last-modified" | cut -d' ' -f2-)
echo "  GitHub deploy: $github_time"

echo ""
echo "💡 QUICK LINKS (Copy & Paste)"
echo "══════════════════════════════════════════════════════════════════"
echo "  Academy Hub:  $BASE_URL/public/academy/"
echo "  Lesson 1:     $BASE_URL/learn/pools-101.html"
echo "  Lesson 2:     $BASE_URL/learn/pools-102.html"
echo "  Lesson 3:     $BASE_URL/learn/pools-103.html"
echo ""
echo "🧪 TEST WORKFLOW"
echo "══════════════════════════════════════════════════════════════════"
echo "  1. Open Academy Hub (link above)"
echo "  2. Click 'Start Lesson 1'"
echo "  3. Answer quiz questions correctly"
echo "  4. Check for '+100 XP' popup"
echo "  5. Click 'Return to Academy'"
echo "  6. Verify Lesson 1 marked complete"
echo "  7. Verify Lesson 2 unlocked"
echo ""
