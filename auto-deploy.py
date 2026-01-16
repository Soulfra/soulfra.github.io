#!/usr/bin/env python3
"""
Auto-Deploy to GitHub Pages (Dropbox-Style Sync)

Watches the stpetepros/ folder for changes and automatically commits + pushes to GitHub.
Like Dropbox auto-sync, but for your website.

Usage:
    python3 auto-deploy.py

Stop with: Ctrl+C
"""

import os
import time
import subprocess
import hashlib
from pathlib import Path
from datetime import datetime

# Configuration
WATCH_DIR = Path(__file__).parent / "stpetepros"
CHECK_INTERVAL = 2  # seconds between checks
GIT_REPO = Path(__file__).parent

# State tracking
file_hashes = {}


def get_file_hash(filepath):
    """Get MD5 hash of file contents"""
    try:
        with open(filepath, 'rb') as f:
            return hashlib.md5(f.read()).hexdigest()
    except Exception:
        return None


def scan_directory():
    """Scan directory and return dict of file paths -> hashes"""
    hashes = {}
    for filepath in WATCH_DIR.rglob('*'):
        if filepath.is_file() and not filepath.name.startswith('.'):
            hashes[str(filepath)] = get_file_hash(filepath)
    return hashes


def git_status():
    """Get git status"""
    result = subprocess.run(
        ['git', 'status', '--porcelain', 'stpetepros/'],
        cwd=GIT_REPO,
        capture_output=True,
        text=True
    )
    return result.stdout.strip()


def git_commit_and_push(changed_files):
    """Commit and push changes to GitHub"""
    try:
        # Add changed files
        subprocess.run(['git', 'add', 'stpetepros/'], cwd=GIT_REPO, check=True)

        # Create commit message
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        file_list = "\n".join([f"  - {Path(f).name}" for f in changed_files[:5]])
        if len(changed_files) > 5:
            file_list += f"\n  - ... and {len(changed_files) - 5} more"

        commit_msg = f"""Auto-deploy: {len(changed_files)} file(s) updated

{file_list}

🤖 Auto-deployed at {timestamp}"""

        # Commit
        subprocess.run(
            ['git', 'commit', '-m', commit_msg],
            cwd=GIT_REPO,
            check=True,
            capture_output=True
        )

        # Push
        print(f"📤 Pushing to GitHub...")
        result = subprocess.run(
            ['git', 'push'],
            cwd=GIT_REPO,
            check=True,
            capture_output=True,
            text=True
        )

        print(f"✅ Deployed! Live at https://soulfra.github.io/stpetepros/")
        print(f"   Updated: {', '.join([Path(f).name for f in changed_files[:3]])}")
        if len(changed_files) > 3:
            print(f"   ... and {len(changed_files) - 3} more")
        print()

        return True

    except subprocess.CalledProcessError as e:
        print(f"❌ Git error: {e}")
        if e.stderr:
            print(f"   {e.stderr}")
        return False


def main():
    global file_hashes

    print("🔄 Auto-Deploy: Watching for changes...")
    print(f"📁 Directory: {WATCH_DIR}")
    print(f"🌐 Deploys to: https://soulfra.github.io/stpetepros/")
    print(f"⏱️  Check interval: {CHECK_INTERVAL}s")
    print()
    print("💡 Edit any file in stpetepros/ → auto-deploys to GitHub Pages")
    print("   Stop with: Ctrl+C")
    print()

    # Initial scan
    file_hashes = scan_directory()
    print(f"👀 Watching {len(file_hashes)} files...")
    print()

    try:
        while True:
            time.sleep(CHECK_INTERVAL)

            # Scan for changes
            current_hashes = scan_directory()

            # Find changed/new files
            changed = []
            for filepath, current_hash in current_hashes.items():
                old_hash = file_hashes.get(filepath)
                if old_hash != current_hash:
                    changed.append(filepath)

            # Find deleted files
            for filepath in file_hashes:
                if filepath not in current_hashes:
                    changed.append(filepath)

            # If changes detected, deploy
            if changed:
                print(f"🔔 Detected {len(changed)} change(s)")
                for filepath in changed:
                    status = "modified" if filepath in current_hashes else "deleted"
                    print(f"   {status}: {Path(filepath).name}")
                print()

                # Check git status first
                status = git_status()
                if status:
                    git_commit_and_push(changed)
                    # Update our hash cache
                    file_hashes = current_hashes
                else:
                    print("   (No git changes detected, skipping)")
                    print()

    except KeyboardInterrupt:
        print()
        print("⏹️  Auto-deploy stopped")
        print()


if __name__ == '__main__':
    main()
