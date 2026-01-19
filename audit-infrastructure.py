#!/usr/bin/env python3
"""
Infrastructure Audit Agent
Uses Ollama to analyze your own codebase and find configuration issues.
"""

import os
import re
import json
import sqlite3
import requests
import subprocess
from datetime import datetime
from rich.console import Console
from rich.markdown import Markdown
from rich.table import Table

# Configuration
PROJECT_ROOT = '/Users/matthewmauer/Desktop/soulfra.github.io'
DB_PATH = f'{PROJECT_ROOT}/deathtodata.db'

def search_codebase(pattern, file_types=None):
    """Search codebase for patterns using grep"""
    cmd = ['grep', '-r', '-n', '-i', pattern, PROJECT_ROOT]

    if file_types:
        for ft in file_types:
            cmd.extend(['--include', ft])

    # Exclude common directories
    cmd.extend(['--exclude-dir=node_modules', '--exclude-dir=.git', '--exclude-dir=archive'])

    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
        return result.stdout
    except Exception as e:
        return f"Search error: {e}"

def extract_api_urls():
    """Find all API URL configurations"""
    patterns = [
        (r'API_URL.*=.*["\'](.+?)["\']', 'API_URL assignments'),
        (r'localhost:\d+', 'localhost URLs'),
        (r'https?://[a-zA-Z0-9.-]+', 'HTTP/HTTPS URLs'),
    ]

    findings = {}
    for pattern, description in patterns:
        results = search_codebase(pattern, ['*.js', '*.py', '*.json'])
        if results and results.strip():
            findings[description] = results.split('\n')[:10]  # Limit to 10 results

    return findings

def extract_ports():
    """Find all port configurations"""
    results = search_codebase(r'port.*\d{4,5}', ['*.js', '*.py', '*.json', '*.sh'])
    ports = set()

    for line in results.split('\n'):
        # Extract port numbers
        matches = re.findall(r'\d{4,5}', line)
        ports.update(matches)

    return list(ports)

def extract_domains():
    """Find all domain references"""
    results = search_codebase(r'deathtodata\.com|soulfra\.com', ['*.js', '*.html', '*.json', '*.md'])

    domains = []
    for line in results.split('\n')[:20]:  # Limit output
        if line.strip():
            domains.append(line)

    return domains

def ask_ollama(prompt, model='llama3.2'):
    """Send prompt to Ollama and get response"""
    try:
        response = requests.post('http://localhost:11434/api/generate', json={
            'model': model,
            'prompt': prompt,
            'stream': False
        }, timeout=60)
        response.raise_for_status()
        return response.json()['response']
    except requests.exceptions.RequestException as e:
        return f'Ollama error: {str(e)}'

def save_audit_to_db(audit_type, findings, ollama_analysis):
    """Store audit findings in database"""
    try:
        db = sqlite3.connect(DB_PATH)

        metadata = {
            'audit_type': audit_type,
            'findings': findings,
            'ollama_analysis': ollama_analysis,
            'timestamp': datetime.now().isoformat()
        }

        db.execute('''
            INSERT INTO analytics_events (event_type, metadata)
            VALUES (?, ?)
        ''', ('infrastructure_audit', json.dumps(metadata)))

        db.commit()
        db.close()

        print("💾 Audit saved to database")

    except Exception as e:
        print(f"⚠️  Database save failed: {e}")

def audit_api_configuration():
    """Audit API URL configurations for disconnects"""
    console = Console()

    console.print("\n[bold cyan]🔍 Auditing API Configurations...[/bold cyan]\n")

    # Extract findings
    api_urls = extract_api_urls()
    ports = extract_ports()

    # Create summary for Ollama
    summary = "# API Configuration Audit\n\n"
    summary += "## API URLs Found:\n"
    for desc, urls in api_urls.items():
        summary += f"\n### {desc}:\n"
        for url in urls[:5]:
            summary += f"- {url}\n"

    summary += f"\n## Ports Found:\n"
    for port in ports:
        summary += f"- {port}\n"

    # Display findings
    console.print(summary)

    # Ask Ollama to analyze
    console.print("\n[bold yellow]🤖 Asking Ollama to analyze for disconnects...[/bold yellow]\n")

    prompt = f"""You are an infrastructure auditor. Analyze these API configurations and identify:
1. Any disconnects or mismatches (e.g., frontend pointing to wrong backend URL)
2. Potential issues (e.g., hardcoded localhost that won't work in production)
3. Recommendations to fix

{summary}

Be specific and actionable."""

    analysis = ask_ollama(prompt)

    console.print("[bold green]💬 Ollama's Analysis:[/bold green]")
    console.print(Markdown(analysis))

    # Save to database
    save_audit_to_db('api_configuration', {
        'api_urls': api_urls,
        'ports': list(ports)
    }, analysis)

    return analysis

def audit_domain_configuration():
    """Audit domain configurations"""
    console = Console()

    console.print("\n[bold cyan]🔍 Auditing Domain Configurations...[/bold cyan]\n")

    # Extract findings
    domains = extract_domains()

    # Create summary
    summary = "# Domain Configuration Audit\n\n"
    summary += "## Domain References Found:\n"
    for domain in domains[:20]:
        summary += f"- {domain}\n"

    console.print(summary)

    # Ask Ollama to analyze
    console.print("\n[bold yellow]🤖 Asking Ollama to analyze domain setup...[/bold yellow]\n")

    prompt = f"""You are an infrastructure auditor. Analyze these domain configurations and identify:
1. What domains are being used and where
2. Any inconsistencies in how domains are referenced
3. Recommendations for proper domain management

{summary}

Be specific and actionable."""

    analysis = ask_ollama(prompt)

    console.print("[bold green]💬 Ollama's Analysis:[/bold green]")
    console.print(Markdown(analysis))

    # Save to database
    save_audit_to_db('domain_configuration', {
        'domains': domains[:20]
    }, analysis)

    return analysis

def run_full_audit():
    """Run complete infrastructure audit"""
    console = Console()

    console.print("[bold magenta]" + "="*60 + "[/bold magenta]")
    console.print("[bold magenta]  DeathToData Infrastructure Audit[/bold magenta]")
    console.print("[bold magenta]" + "="*60 + "[/bold magenta]")

    # Run all audits
    audit_api_configuration()
    audit_domain_configuration()

    console.print("\n[bold green]✅ Audit complete! Check database for stored findings.[/bold green]")
    console.print(f"[dim]Query: sqlite3 {DB_PATH} \"SELECT * FROM analytics_events WHERE event_type='infrastructure_audit'\"[/dim]\n")

if __name__ == '__main__':
    import sys

    if len(sys.argv) > 1:
        audit_type = sys.argv[1]

        if audit_type == 'api':
            audit_api_configuration()
        elif audit_type == 'domains':
            audit_domain_configuration()
        else:
            print("Usage: python3 audit-infrastructure.py [api|domains]")
            print("   or: python3 audit-infrastructure.py (runs all audits)")
    else:
        run_full_audit()
