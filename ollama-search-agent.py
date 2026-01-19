#!/usr/bin/env python3
"""
DeathToData Ollama Agent - Simple Version
Teaches Ollama how to search DeathToData and summarize results.
"""

import requests
import sys
import json
import sqlite3
from datetime import datetime
from rich.console import Console
from rich.markdown import Markdown

# Tool: Search DeathToData
def search_deathtodata(query):
    """Call DeathToData API to search"""
    try:
        response = requests.get(f'http://localhost:5051/api/search?q={query}')
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        return {'error': f'Search failed: {str(e)}'}

# Tool: Ask Ollama to summarize results
def ask_ollama(prompt, model='llama3.2'):
    """Send prompt to Ollama and get response"""
    try:
        response = requests.post('http://localhost:11434/api/generate', json={
            'model': model,
            'prompt': prompt,
            'stream': False
        })
        response.raise_for_status()
        return response.json()['response']
    except requests.exceptions.RequestException as e:
        return f'Ollama error: {str(e)}'

# Tool: Save analysis to database
def save_analysis_to_db(query, results, ollama_response):
    """Store Ollama's analysis in the database for future reference"""
    try:
        db = sqlite3.connect('deathtodata.db')

        # Prepare metadata
        metadata = {
            'query': query,
            'result_count': len(results.get('results', [])),
            'ollama_summary': ollama_response,
            'top_sources': [r['url'] for r in results.get('results', [])[:3]],
            'timestamp': datetime.now().isoformat()
        }

        # Insert into analytics_events
        db.execute('''
            INSERT INTO analytics_events (event_type, metadata)
            VALUES (?, ?)
        ''', ('ollama_analysis', json.dumps(metadata)))

        db.commit()
        db.close()

        print("💾 Analysis saved to database")

    except Exception as e:
        print(f"⚠️  Database save failed: {e}")

# Main agent function
def agent_search(query):
    """Complete workflow: Search → Summarize → Answer"""

    print(f"🔍 Searching DeathToData for: {query}")

    # Step 1: Search
    results = search_deathtodata(query)

    if 'error' in results:
        print(f"❌ Error: {results['error']}")
        return

    # Step 2: Format results for Ollama
    search_summary = f"Search results for '{query}':\n\n"
    for i, result in enumerate(results.get('results', [])[:5], 1):
        search_summary += f"{i}. {result['title']}\n"
        search_summary += f"   URL: {result['url']}\n"
        search_summary += f"   {result['snippet'][:150]}...\n\n"

    print(f"\n📊 Found {len(results.get('results', []))} results")

    # Step 3: Ask Ollama to summarize
    print(f"\n🤖 Asking Ollama to analyze...\n")

    ollama_prompt = f"""You are a search assistant. Analyze these search results and provide:
1. A brief summary of what the results are about
2. The 3 most relevant findings
3. A recommendation for the user

{search_summary}

Be concise and helpful."""

    response = ask_ollama(ollama_prompt)

    # Save analysis to database
    save_analysis_to_db(query, results, response)

    print(f"\n💬 Ollama's Analysis:")
    console = Console()
    console.print(Markdown(response))

    return results

if __name__ == '__main__':
    # Get search query from command line
    if len(sys.argv) < 2:
        print("Usage: python3 ollama-search-agent.py <search query>")
        print("\nExample:")
        print("  python3 ollama-search-agent.py privacy tools")
        print("  python3 ollama-search-agent.py 'encrypted messaging'")
        sys.exit(1)

    # Join all arguments as search query
    query = ' '.join(sys.argv[1:])

    # Run the agent
    agent_search(query)
