#!/bin/bash
# Test if all navigation links resolve correctly

echo "🔍 Testing DeathToData navigation links..."
echo ""

BASE="http://localhost:8000"

# Test from homepage
echo "From /deathtodata/:"
curl -s -o /dev/null -w "%{http_code} - $BASE/deathtodata/index.html\n" $BASE/deathtodata/index.html
curl -s -o /dev/null -w "%{http_code} - $BASE/deathtodata/blog/\n" $BASE/deathtodata/blog/
curl -s -o /dev/null -w "%{http_code} - $BASE/deathtodata/pitch-deck.html\n" $BASE/deathtodata/pitch-deck.html
curl -s -o /dev/null -w "%{http_code} - $BASE/deathtodata/business-plan.html\n" $BASE/deathtodata/business-plan.html

echo ""
echo "From /deathtodata/blog/:"
curl -s -o /dev/null -w "%{http_code} - $BASE/deathtodata/blog/index.html\n" $BASE/deathtodata/blog/index.html
curl -s -o /dev/null -w "%{http_code} - $BASE/deathtodata/blog/why-deathtodata-matters-and-the-problem-it-solves.html\n" $BASE/deathtodata/blog/why-deathtodata-matters-and-the-problem-it-solves.html
curl -s -o /dev/null -w "%{http_code} - $BASE/deathtodata/blog/deathtodata-vs-traditional-solutions-key-differences.html\n" $BASE/deathtodata/blog/deathtodata-vs-traditional-solutions-key-differences.html
curl -s -o /dev/null -w "%{http_code} - $BASE/deathtodata/blog/the-future-of-deathtodata-and-our-roadmap.html\n" $BASE/deathtodata/blog/the-future-of-deathtodata-and-our-roadmap.html

echo ""
echo "✅ 200 = link works"
echo "❌ 404 = link broken"
echo ""
echo "Now open http://localhost:8000/deathtodata/blog/ in your browser"
echo "and check the browser console for any errors when clicking links"
