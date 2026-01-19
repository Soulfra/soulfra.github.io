#!/usr/bin/env python3
"""
Knowledge Base Query Tool
Retrieves and queries all Ollama analyses and infrastructure audits stored in the database.
"""

import sys
import json
import sqlite3
import requests
from datetime import datetime
from rich.console import Console
from rich.markdown import Markdown
from rich.table import Table
from rich.panel import Panel

# Configuration
DB_PATH = '/Users/matthewmauer/Desktop/soulfra.github.io/deathtodata.db'

def get_all_analyses():
    """Retrieve all Ollama analyses from database"""
    db = sqlite3.connect(DB_PATH)
    cursor = db.cursor()

    cursor.execute('''
        SELECT id, metadata, created_at
        FROM analytics_events
        WHERE event_type = 'ollama_analysis'
        ORDER BY created_at DESC
    ''')

    results = cursor.fetchall()
    db.close()

    analyses = []
    for row in results:
        try:
            metadata = json.loads(row[1])
            analyses.append({
                'id': row[0],
                'query': metadata.get('query', 'N/A'),
                'summary': metadata.get('ollama_summary', 'N/A'),
                'result_count': metadata.get('result_count', 0),
                'sources': metadata.get('top_sources', []),
                'timestamp': row[2]
            })
        except json.JSONDecodeError:
            continue

    return analyses

def get_all_audits():
    """Retrieve all infrastructure audits from database"""
    db = sqlite3.connect(DB_PATH)
    cursor = db.cursor()

    cursor.execute('''
        SELECT id, metadata, created_at
        FROM analytics_events
        WHERE event_type = 'infrastructure_audit'
        ORDER BY created_at DESC
    ''')

    results = cursor.fetchall()
    db.close()

    audits = []
    for row in results:
        try:
            metadata = json.loads(row[1])
            audits.append({
                'id': row[0],
                'audit_type': metadata.get('audit_type', 'N/A'),
                'analysis': metadata.get('ollama_analysis', 'N/A'),
                'findings': metadata.get('findings', {}),
                'timestamp': row[2]
            })
        except json.JSONDecodeError:
            continue

    return audits

def search_knowledge(query):
    """Search knowledge base for specific topic"""
    db = sqlite3.connect(DB_PATH)
    cursor = db.cursor()

    # Search in both ollama_analysis and infrastructure_audit
    cursor.execute('''
        SELECT event_type, metadata, created_at
        FROM analytics_events
        WHERE (event_type = 'ollama_analysis' OR event_type = 'infrastructure_audit')
        AND metadata LIKE ?
        ORDER BY created_at DESC
    ''', (f'%{query}%',))

    results = cursor.fetchall()
    db.close()

    matches = []
    for row in results:
        try:
            metadata = json.loads(row[1])
            matches.append({
                'type': row[0],
                'metadata': metadata,
                'timestamp': row[2]
            })
        except json.JSONDecodeError:
            continue

    return matches

def ask_ollama_about_knowledge(question, context):
    """Ask Ollama to answer questions based on stored knowledge"""
    try:
        prompt = f"""You are a knowledge assistant. Answer this question based on the provided context:

Question: {question}

Context (from knowledge base):
{context}

Provide a concise, helpful answer."""

        response = requests.post('http://localhost:11434/api/generate', json={
            'model': 'llama3.2',
            'prompt': prompt,
            'stream': False
        }, timeout=60)

        response.raise_for_status()
        return response.json()['response']

    except Exception as e:
        return f"Error: {e}"

def display_analyses_table(analyses):
    """Display analyses in a formatted table"""
    console = Console()

    table = Table(title="📚 Stored Ollama Analyses", show_header=True, header_style="bold cyan")
    table.add_column("ID", style="dim", width=6)
    table.add_column("Query", style="cyan", width=25)
    table.add_column("Results", justify="right", width=8)
    table.add_column("Date", style="dim", width=20)

    for analysis in analyses:
        table.add_row(
            str(analysis['id']),
            analysis['query'][:25] + ('...' if len(analysis['query']) > 25 else ''),
            str(analysis['result_count']),
            analysis['timestamp']
        )

    console.print(table)

def display_audits_table(audits):
    """Display audits in a formatted table"""
    console = Console()

    table = Table(title="🔍 Infrastructure Audits", show_header=True, header_style="bold magenta")
    table.add_column("ID", style="dim", width=6)
    table.add_column("Audit Type", style="magenta", width=25)
    table.add_column("Date", style="dim", width=20)

    for audit in audits:
        table.add_row(
            str(audit['id']),
            audit['audit_type'],
            audit['timestamp']
        )

    console.print(table)

def show_analysis_detail(analysis_id):
    """Show detailed view of specific analysis"""
    console = Console()

    analyses = get_all_analyses()
    analysis = next((a for a in analyses if a['id'] == int(analysis_id)), None)

    if not analysis:
        console.print(f"[red]❌ Analysis {analysis_id} not found[/red]")
        return

    console.print(f"\n[bold cyan]Query:[/bold cyan] {analysis['query']}")
    console.print(f"[bold cyan]Date:[/bold cyan] {analysis['timestamp']}")
    console.print(f"[bold cyan]Result Count:[/bold cyan] {analysis['result_count']}\n")

    console.print("[bold green]Ollama's Analysis:[/bold green]")
    console.print(Panel(Markdown(analysis['summary']), title="Summary", border_style="green"))

    if analysis['sources']:
        console.print("\n[bold yellow]Top Sources:[/bold yellow]")
        for i, source in enumerate(analysis['sources'], 1):
            console.print(f"  {i}. {source}")

def show_audit_detail(audit_id):
    """Show detailed view of specific audit"""
    console = Console()

    audits = get_all_audits()
    audit = next((a for a in audits if a['id'] == int(audit_id)), None)

    if not audit:
        console.print(f"[red]❌ Audit {audit_id} not found[/red]")
        return

    console.print(f"\n[bold magenta]Audit Type:[/bold magenta] {audit['audit_type']}")
    console.print(f"[bold magenta]Date:[/bold magenta] {audit['timestamp']}\n")

    console.print("[bold green]Ollama's Analysis:[/bold green]")
    console.print(Panel(Markdown(audit['analysis']), title="Analysis", border_style="magenta"))

def interactive_query():
    """Interactive mode - ask questions about stored knowledge"""
    console = Console()

    console.print("\n[bold cyan]🧠 Knowledge Base Query Mode[/bold cyan]")
    console.print("[dim]Ask questions about what you've learned (type 'exit' to quit)[/dim]\n")

    while True:
        question = input("❓ Question: ").strip()

        if not question or question.lower() == 'exit':
            break

        # Search for relevant knowledge
        matches = search_knowledge(question)

        if not matches:
            console.print("[yellow]⚠️  No relevant knowledge found. Try searching the web first.[/yellow]\n")
            continue

        # Build context from matches
        context = ""
        for match in matches[:5]:  # Use top 5 matches
            if match['type'] == 'ollama_analysis':
                context += f"\nTopic: {match['metadata'].get('query', 'N/A')}\n"
                context += f"Summary: {match['metadata'].get('ollama_summary', 'N/A')[:500]}\n"
            else:
                context += f"\nAudit: {match['metadata'].get('audit_type', 'N/A')}\n"
                context += f"Analysis: {match['metadata'].get('ollama_analysis', 'N/A')[:500]}\n"

        # Ask Ollama
        console.print("\n[yellow]🤖 Consulting knowledge base...[/yellow]\n")
        answer = ask_ollama_about_knowledge(question, context)

        console.print("[bold green]💬 Answer:[/bold green]")
        console.print(Markdown(answer))
        console.print()

if __name__ == '__main__':
    console = Console()

    if len(sys.argv) == 1:
        # No arguments - show summary
        console.print("\n[bold]📊 Knowledge Base Summary[/bold]\n")

        analyses = get_all_analyses()
        audits = get_all_audits()

        console.print(f"Total Ollama Analyses: [cyan]{len(analyses)}[/cyan]")
        console.print(f"Total Infrastructure Audits: [magenta]{len(audits)}[/magenta]\n")

        if analyses:
            display_analyses_table(analyses[:10])  # Show latest 10

        if audits:
            console.print()
            display_audits_table(audits[:10])  # Show latest 10

        console.print("\n[dim]Usage:[/dim]")
        console.print("[dim]  python3 query-knowledge.py list         - List all analyses[/dim]")
        console.print("[dim]  python3 query-knowledge.py audits       - List all audits[/dim]")
        console.print("[dim]  python3 query-knowledge.py show <id>    - Show analysis detail[/dim]")
        console.print("[dim]  python3 query-knowledge.py audit <id>   - Show audit detail[/dim]")
        console.print("[dim]  python3 query-knowledge.py search <term> - Search knowledge[/dim]")
        console.print("[dim]  python3 query-knowledge.py ask          - Interactive Q&A mode[/dim]\n")

    elif sys.argv[1] == 'list':
        analyses = get_all_analyses()
        display_analyses_table(analyses)

    elif sys.argv[1] == 'audits':
        audits = get_all_audits()
        display_audits_table(audits)

    elif sys.argv[1] == 'show' and len(sys.argv) > 2:
        show_analysis_detail(sys.argv[2])

    elif sys.argv[1] == 'audit' and len(sys.argv) > 2:
        show_audit_detail(sys.argv[2])

    elif sys.argv[1] == 'search' and len(sys.argv) > 2:
        query = ' '.join(sys.argv[2:])
        matches = search_knowledge(query)

        console.print(f"\n[bold cyan]🔍 Search Results for: {query}[/bold cyan]\n")
        console.print(f"Found {len(matches)} matches\n")

        for i, match in enumerate(matches, 1):
            console.print(f"[bold]{i}. {match['type']}[/bold] ({match['timestamp']})")
            if match['type'] == 'ollama_analysis':
                console.print(f"   Query: {match['metadata'].get('query', 'N/A')}")
            else:
                console.print(f"   Audit: {match['metadata'].get('audit_type', 'N/A')}")
            console.print()

    elif sys.argv[1] == 'ask':
        interactive_query()

    else:
        console.print("[red]Invalid command. Run without arguments to see usage.[/red]")
