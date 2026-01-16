#!/usr/bin/env python3
"""
Workflow Status Dashboard

Shows dev/staging/prod status for StPetePros.
Like 'git status' but for the whole deployment pipeline.

Usage:
    python3 workflow-status.py
"""

import subprocess
import os
from pathlib import Path
from datetime import datetime
import json

# Configuration
REPO_DIR = Path(__file__).parent
STPETEPROS_DIR = REPO_DIR / "stpetepros"
FLASK_DIR = Path.home() / "Desktop" / "roommate-chat" / "soulfra-simple"


def run_cmd(cmd, cwd=None):
    """Run command and return output"""
    try:
        result = subprocess.run(
            cmd,
            cwd=cwd or REPO_DIR,
            capture_output=True,
            text=True,
            shell=isinstance(cmd, str)
        )
        return result.stdout.strip(), result.returncode == 0
    except Exception as e:
        return str(e), False


def get_git_status():
    """Get git repo status"""
    # Check for uncommitted changes
    status, _ = run_cmd(['git', 'status', '--porcelain', 'stpetepros/'])
    uncommitted = len([line for line in status.split('\n') if line.strip()])

    # Check for unpushed commits
    unpushed, _ = run_cmd(['git', 'log', 'origin/main..HEAD', '--oneline'])
    unpushed_count = len([line for line in unpushed.split('\n') if line.strip()])

    # Get last commit
    last_commit, _ = run_cmd(['git', 'log', '-1', '--format=%h - %s (%ar)'])

    # Get current branch
    branch, _ = run_cmd(['git', 'rev-parse', '--abbrev-ref', 'HEAD'])

    return {
        'uncommitted': uncommitted,
        'unpushed': unpushed_count,
        'last_commit': last_commit,
        'branch': branch
    }


def get_file_status():
    """Get status of key files"""
    files = {
        'signup.html': STPETEPROS_DIR / 'signup.html',
        'signup-demo.html': STPETEPROS_DIR / 'signup-demo.html',
        'index.html': STPETEPROS_DIR / 'index.html',
    }

    statuses = {}
    for name, path in files.items():
        if path.exists():
            # Check if committed
            committed_cmd = f"git log -1 --format=%h -- {path.relative_to(REPO_DIR)}"
            last_commit, success = run_cmd(committed_cmd)

            # Check if modified
            diff_cmd = f"git diff {path.relative_to(REPO_DIR)}"
            diff, _ = run_cmd(diff_cmd)

            statuses[name] = {
                'exists': True,
                'committed': bool(last_commit),
                'modified': bool(diff),
                'last_commit': last_commit or 'never',
                'size': path.stat().st_size
            }
        else:
            statuses[name] = {'exists': False}

    return statuses


def get_flask_status():
    """Check Flask app status"""
    if not FLASK_DIR.exists():
        return {'running': False, 'reason': 'Directory not found'}

    # Check if Flask is running
    ps_output, _ = run_cmd("ps aux | grep '[p]ython3.*app.py' | grep -v grep")

    if ps_output:
        return {
            'running': True,
            'processes': len(ps_output.split('\n')),
            'dir': str(FLASK_DIR)
        }
    else:
        return {
            'running': False,
            'dir': str(FLASK_DIR),
            'reason': 'Not running'
        }


def get_github_pages_status():
    """Estimate GitHub Pages deployment status"""
    git = get_git_status()

    if git['unpushed'] > 0:
        return {
            'status': 'behind',
            'message': f"{git['unpushed']} commit(s) not pushed yet"
        }
    elif git['uncommitted'] > 0:
        return {
            'status': 'behind',
            'message': f"{git['uncommitted']} file(s) not committed yet"
        }
    else:
        return {
            'status': 'synced',
            'message': 'In sync with local (may take 30s to deploy)'
        }


def print_header(text, char='='):
    """Print section header"""
    print()
    print(char * 60)
    print(f"  {text}")
    print(char * 60)
    print()


def print_status_line(label, value, status=None):
    """Print formatted status line"""
    # Status indicators
    indicators = {
        'good': '✅',
        'warning': '⚠️ ',
        'error': '❌',
        'info': 'ℹ️ ',
        'sync': '🔄',
        'live': '🌐'
    }

    indicator = indicators.get(status, '  ')
    print(f"{indicator} {label:.<40} {value}")


def main():
    print()
    print("=" * 60)
    print("  StPetePros Workflow Status")
    print("  " + datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    print("=" * 60)

    # Git Status
    print_header("LOCAL (Development)", '-')
    git = get_git_status()
    print_status_line(
        "Branch",
        git['branch'],
        'info'
    )
    print_status_line(
        "Last commit",
        git['last_commit'],
        'info'
    )
    print_status_line(
        "Uncommitted changes",
        f"{git['uncommitted']} file(s)",
        'warning' if git['uncommitted'] > 0 else 'good'
    )
    print_status_line(
        "Unpushed commits",
        f"{git['unpushed']} commit(s)",
        'warning' if git['unpushed'] > 0 else 'good'
    )

    # File Status
    print_header("KEY FILES", '-')
    files = get_file_status()
    for name, status in files.items():
        if status['exists']:
            state = []
            if status['modified']:
                state.append("modified")
            if not status['committed']:
                state.append("not committed")

            state_str = ", ".join(state) if state else "committed"
            file_status = 'warning' if state else 'good'

            print_status_line(
                name,
                state_str,
                file_status
            )
        else:
            print_status_line(name, "not found", 'error')

    # GitHub (Staging)
    print_header("GITHUB (Code Repository)", '-')
    print_status_line(
        "Repository",
        "github.com/Soulfra/soulfra.github.io",
        'info'
    )
    if git['unpushed'] > 0:
        print_status_line(
            "Status",
            f"Behind by {git['unpushed']} commit(s)",
            'warning'
        )
        print_status_line(
            "Action needed",
            "Run: git push",
            'info'
        )
    else:
        print_status_line(
            "Status",
            "Up to date",
            'good'
        )

    # GitHub Pages (Production)
    print_header("GITHUB PAGES (Production Website)", '-')
    gh_pages = get_github_pages_status()
    print_status_line(
        "URL",
        "soulfra.github.io/stpetepros",
        'live'
    )
    print_status_line(
        "Deployment status",
        gh_pages['message'],
        'good' if gh_pages['status'] == 'synced' else 'warning'
    )

    # Flask Backend
    print_header("FLASK BACKEND (Local Server)", '-')
    flask = get_flask_status()
    if flask['running']:
        print_status_line(
            "Status",
            f"Running ({flask['processes']} process)",
            'good'
        )
        print_status_line(
            "URL (local only)",
            "localhost:5001",
            'info'
        )
    else:
        print_status_line(
            "Status",
            flask.get('reason', 'Not running'),
            'warning'
        )
        print_status_line(
            "Start with",
            "cd ~/Desktop/roommate-chat/soulfra-simple && python3 app.py",
            'info'
        )

    # Summary
    print_header("SUMMARY", '-')

    if git['uncommitted'] > 0:
        print_status_line(
            "Next action",
            "Commit changes: cd ~/Desktop/soulfra.github.io && git add . && git commit -m 'Update'",
            'info'
        )
    elif git['unpushed'] > 0:
        print_status_line(
            "Next action",
            "Push to GitHub: git push",
            'info'
        )
    else:
        print_status_line(
            "Status",
            "Everything in sync!",
            'good'
        )
        print_status_line(
            "Live at",
            "https://soulfra.github.io/stpetepros/",
            'live'
        )

    print()
    print("=" * 60)
    print()


if __name__ == '__main__':
    main()
