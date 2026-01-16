#!/usr/bin/env python3
"""
Live Monitor - See everything happening in real-time
"""

import os
import time
import json
import requests
from datetime import datetime
import threading
import queue

class LiveMonitor:
    def __init__(self):
        self.services = {
            'easy_mode': {'port': 1234, 'name': 'Easy Mode Control', 'emoji': '🎮'},
            'visual_dash': {'port': 5678, 'name': 'Visual Dashboard', 'emoji': '🎨'},
            'crampal': {'port': 7000, 'name': 'CramPal Learning', 'emoji': '📚'},
            'mobile': {'port': 8080, 'name': 'Mobile App', 'emoji': '📱'},
            'vibe': {'port': 8888, 'name': 'Vibe Platform', 'emoji': '🎉'},
            'filter': {'port': 9999, 'name': 'Cringeproof Filter', 'emoji': '🛡️'},
            'empathy': {'port': 5000, 'name': 'Empathy Game', 'emoji': '❤️'},
            'docs': {'port': 4201, 'name': 'Doc Generator', 'emoji': '📝'},
            'soul': {'port': 9000, 'name': 'Soulfra', 'emoji': '✨'}
        }
        self.log_queue = queue.Queue()
        self.start_monitoring()
    
    def check_service(self, port):
        """Check if service is responding"""
        try:
            resp = requests.get(f'http://localhost:{port}', timeout=1)
            return resp.status_code < 500
        except:
            return False
    
    def test_emoji_support(self, port):
        """Test if service handles emojis correctly"""
        try:
            test_data = {'test': 'Hello 🚀 World 💯'}
            resp = requests.post(
                f'http://localhost:{port}/api/test',
                json=test_data,
                timeout=1
            )
            return '🚀' in resp.text or '💯' in resp.text
        except:
            return None
    
    def monitor_logs(self):
        """Monitor log files for errors"""
        log_files = [
            'logs/crampal.log',
            'logs/cringeproof.log',
            'logs/vibe_platform.log',
            'logs/easy_mode.log'
        ]
        
        # Track file positions
        positions = {}
        
        while True:
            for log_file in log_files:
                if os.path.exists(log_file):
                    with open(log_file, 'r') as f:
                        # Go to last position
                        if log_file in positions:
                            f.seek(positions[log_file])
                        
                        # Read new lines
                        new_lines = f.readlines()
                        positions[log_file] = f.tell()
                        
                        # Check for errors
                        for line in new_lines:
                            if 'error' in line.lower() or 'exception' in line.lower():
                                self.log_queue.put({
                                    'type': 'error',
                                    'file': log_file,
                                    'message': line.strip()
                                })
            
            time.sleep(1)
    
    def start_monitoring(self):
        """Start background monitoring"""
        thread = threading.Thread(target=self.monitor_logs, daemon=True)
        thread.start()
    
    def get_status_report(self):
        """Get complete status report"""
        report = {
            'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'services': {},
            'summary': {
                'total': len(self.services),
                'online': 0,
                'offline': 0,
                'emoji_support': 0
            }
        }
        
        for key, service in self.services.items():
            is_online = self.check_service(service['port'])
            emoji_ok = self.test_emoji_support(service['port']) if is_online else False
            
            report['services'][key] = {
                'name': service['name'],
                'port': service['port'],
                'url': f"http://localhost:{service['port']}",
                'status': '🟢 Online' if is_online else '🔴 Offline',
                'emoji_support': '✅' if emoji_ok else '❓' if emoji_ok is None else '❌',
                'emoji': service['emoji']
            }
            
            if is_online:
                report['summary']['online'] += 1
                if emoji_ok:
                    report['summary']['emoji_support'] += 1
            else:
                report['summary']['offline'] += 1
        
        # Get recent errors
        errors = []
        while not self.log_queue.empty():
            try:
                errors.append(self.log_queue.get_nowait())
            except:
                break
        report['recent_errors'] = errors[-5:]  # Last 5 errors
        
        return report
    
    def print_live_status(self):
        """Print live status to console"""
        os.system('clear' if os.name == 'posix' else 'cls')
        
        report = self.get_status_report()
        
        print("=" * 60)
        print(f"   LIVE SYSTEM MONITOR - {report['timestamp']}")
        print("=" * 60)
        print()
        
        # Summary
        summary = report['summary']
        print(f"OVERALL: {summary['online']}/{summary['total']} services online")
        print(f"EMOJI SUPPORT: {summary['emoji_support']}/{summary['online']} working")
        print()
        
        # Service table
        print("SERVICE STATUS:")
        print("-" * 60)
        print(f"{'Service':<20} {'Port':<8} {'Status':<15} {'Emojis':<10} {'URL'}")
        print("-" * 60)
        
        for key, service in report['services'].items():
            print(f"{service['emoji']} {service['name']:<18} "
                  f"{service['port']:<8} "
                  f"{service['status']:<15} "
                  f"{service['emoji_support']:<10} "
                  f"{service['url']}")
        
        print()
        
        # Recent errors
        if report['recent_errors']:
            print("RECENT ERRORS:")
            print("-" * 60)
            for error in report['recent_errors']:
                print(f"[{error['file']}] {error['message'][:80]}...")
        
        print()
        print("Press Ctrl+C to exit")
    
    def run_live_monitor(self):
        """Run continuous monitoring"""
        try:
            while True:
                self.print_live_status()
                time.sleep(2)
        except KeyboardInterrupt:
            print("\n\nMonitoring stopped.")

def quick_test_all():
    """Quick test of all services"""
    monitor = LiveMonitor()
    report = monitor.get_status_report()
    
    print("\n🔍 QUICK SERVICE TEST")
    print("=" * 40)
    
    # Test each service
    for key, service in report['services'].items():
        print(f"\n{service['emoji']} Testing {service['name']}...")
        print(f"   URL: {service['url']}")
        print(f"   Status: {service['status']}")
        
        if '🟢' in service['status']:
            print(f"   Emoji Support: {service['emoji_support']}")
            
            # Try to open in browser
            print(f"   → Open in browser: {service['url']}")
    
    print("\n" + "=" * 40)
    print(f"✅ {report['summary']['online']} services are working!")
    print(f"❌ {report['summary']['offline']} services are not running")
    
    if report['summary']['offline'] > 0:
        print("\n💡 To start missing services:")
        print("   ./ONE_CLICK_EVERYTHING.sh")
    
    return report

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "quick":
        # Quick test mode
        quick_test_all()
    else:
        # Live monitoring mode
        monitor = LiveMonitor()
        monitor.run_live_monitor()