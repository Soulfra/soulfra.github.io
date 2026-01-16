#!/bin/bash
# Launch All Domains - Auto-generate complete websites for all 4 domains
# Uses Ollama + domain-context.js to create landing pages, pitch decks, business plans, SEO content

API_BASE="http://localhost:5050/api"
DOMAINS=("soulfra" "calriven" "deathtodata" "cringeproof")

echo "🚀 Domain Launch System"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if backend is running
echo "🔍 Checking backend..."
if ! curl -s http://localhost:5050/api/health > /dev/null 2>&1; then
  echo "❌ Backend not running. Start it first:"
  echo "   bash start.sh"
  exit 1
fi
echo "✅ Backend is running"
echo ""

# Generate content for each domain
for domain in "${DOMAINS[@]}"; do
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "🌐 Launching: $domain"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""

  # Create directory structure
  mkdir -p "$domain/blog"
  mkdir -p "$domain/assets"

  echo "📁 Directory structure created"
  echo ""

  # 1. Generate Landing Page
  echo "📄 Generating landing page..."
  LANDING_CONTENT=$(curl -s -X POST "$API_BASE/content/generate" \
    -H "Content-Type: application/json" \
    -d "{
      \"domain\": \"$domain\",
      \"type\": \"landing_page\",
      \"topic\": \"Homepage for $domain with hero section, features, and call-to-action\"
    }" | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('data',{}).get('content',{}).get('content',''))")

  if [ -n "$LANDING_CONTENT" ]; then
    cat > "$domain/index.html" << EOF
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>$(echo "$domain" | sed 's/.*/\u&/') - Launch Page</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #f5f5f5;
    }
    .container { max-width: 1200px; margin: 0 auto; padding: 40px 20px; }
    header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 60px 20px; text-align: center; }
    header h1 { font-size: 3em; margin-bottom: 10px; }
    header p { font-size: 1.3em; opacity: 0.95; }
    .content { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-top: 40px; }
    .content h2 { color: #667eea; margin-top: 30px; margin-bottom: 15px; }
    .content p { margin-bottom: 15px; }
    .cta { background: #667eea; color: white; padding: 15px 40px; border-radius: 8px; text-decoration: none; display: inline-block; margin-top: 20px; font-weight: 600; }
    .cta:hover { background: #764ba2; }
  </style>
</head>
<body>
  <header>
    <h1>$(echo "$domain" | sed 's/.*/\u&/')</h1>
    <p>Coming Soon</p>
  </header>
  <div class="container">
    <div class="content">
      <div class="landing-content">
        $LANDING_CONTENT
      </div>
      <a href="#" class="cta">Get Started</a>
    </div>
  </div>
</body>
</html>
EOF
    echo "✅ Landing page created: $domain/index.html"
  else
    echo "⚠️  Landing page generation failed (using template)"
    cat > "$domain/index.html" << EOF
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>$(echo "$domain" | sed 's/.*/\u&/') - Coming Soon</title>
</head>
<body>
  <h1>$(echo "$domain" | sed 's/.*/\u&/')</h1>
  <p>Coming Soon</p>
</body>
</html>
EOF
  fi
  sleep 2
  echo ""

  # 2. Generate Pitch Deck
  echo "📊 Generating pitch deck..."
  PITCH_CONTENT=$(curl -s -X POST "$API_BASE/content/generate" \
    -H "Content-Type: application/json" \
    -d "{
      \"domain\": \"$domain\",
      \"type\": \"article\",
      \"topic\": \"Pitch deck for $domain: problem, solution, market size, business model, and ask\"
    }" | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('data',{}).get('content',{}).get('content',''))")

  if [ -n "$PITCH_CONTENT" ]; then
    echo "$PITCH_CONTENT" > "$domain/pitch-deck.md"
    echo "✅ Pitch deck created: $domain/pitch-deck.md"
  else
    echo "⚠️  Pitch deck generation failed"
  fi
  sleep 2
  echo ""

  # 3. Generate Business Plan
  echo "📋 Generating business plan..."
  BUSINESS_CONTENT=$(curl -s -X POST "$API_BASE/content/generate" \
    -H "Content-Type: application/json" \
    -d "{
      \"domain\": \"$domain\",
      \"type\": \"article\",
      \"topic\": \"Business plan for $domain: executive summary, market analysis, strategy, financial projections, roadmap\"
    }" | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('data',{}).get('content',{}).get('content',''))")

  if [ -n "$BUSINESS_CONTENT" ]; then
    echo "$BUSINESS_CONTENT" > "$domain/business-plan.md"
    echo "✅ Business plan created: $domain/business-plan.md"
  else
    echo "⚠️  Business plan generation failed"
  fi
  sleep 2
  echo ""

  # 4. Generate Blog Posts (5 posts)
  echo "📝 Generating blog posts..."
  BLOG_TOPICS=(
    "Why $domain matters"
    "How $domain works"
    "Getting started with $domain"
    "$domain vs traditional solutions"
    "The future of $domain"
  )

  POST_NUM=1
  for topic in "${BLOG_TOPICS[@]}"; do
    BLOG_CONTENT=$(curl -s -X POST "$API_BASE/content/generate" \
      -H "Content-Type: application/json" \
      -d "{
        \"domain\": \"$domain\",
        \"type\": \"article\",
        \"topic\": \"$topic\"
      }" | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('data',{}).get('content',{}).get('content',''))")

    if [ -n "$BLOG_CONTENT" ]; then
      SLUG=$(echo "$topic" | tr '[:upper:]' '[:lower:]' | sed 's/ /-/g' | sed 's/[^a-z0-9-]//g')
      echo "$BLOG_CONTENT" > "$domain/blog/$SLUG.md"
      echo "  ✅ Post $POST_NUM: $topic"
    fi
    POST_NUM=$((POST_NUM + 1))
    sleep 1
  done
  echo ""

  # 5. Create README
  cat > "$domain/README.md" << EOF
# $(echo "$domain" | sed 's/.*/\u&/')

Auto-generated website for $domain

## Files

- \`index.html\` - Landing page
- \`pitch-deck.md\` - Investment pitch deck
- \`business-plan.md\` - Full business plan
- \`blog/\` - Blog posts (5 articles)

## Deploy

\`\`\`bash
# View locally
python3 -m http.server 8000

# Visit: http://localhost:8000/$domain
\`\`\`

## Generated

This site was auto-generated using:
- Domain context from \`api/llm/domain-context.js\`
- Content generated by Ollama (local AI)
- No API costs, fully self-sovereign
EOF

  echo "✅ $domain launch complete!"
  echo ""
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 ALL DOMAINS LAUNCHED!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "View your sites:"
for domain in "${DOMAINS[@]}"; do
  echo "  🌐 http://localhost:8000/$domain"
done
echo ""
echo "Next steps:"
echo "  1. Review generated content in each domain folder"
echo "  2. Customize as needed"
echo "  3. Deploy to GitHub Pages or your hosting"
echo "  4. Point your actual domains (soulfra.com, etc.) to these sites"
echo ""
