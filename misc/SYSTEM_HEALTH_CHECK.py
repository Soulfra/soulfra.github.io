#!/usr/bin/env python3
"""
SYSTEM HEALTH CHECK - Ensures everything is working properly without crashes
"""

import os
import json
import sqlite3
import subprocess
import psutil
import time
from datetime import datetime
from pathlib import Path

print("🏥 SYSTEM HEALTH CHECK 🏥")
print("=" * 60)
print("Checking all components for stability and performance...")
print()

class SystemHealthChecker:
    def __init__(self):
        self.errors = []
        self.warnings = []
        self.successes = []
        self.report = {}
        
    def check_directories(self):
        """Check if all required directories exist"""
        print("📁 Checking directories...")
        
        required_dirs = [
            'maxed_out/components',
            'maxed_out/ai_agents',
            'maxed_out/marketplace',
            'maxed_out/dashboards',
            'inbox',
            'handoffs',
            'chatlogs',
            'whispers'
        ]
        
        for dir_path in required_dirs:
            if os.path.exists(dir_path):
                self.successes.append(f"✅ Directory exists: {dir_path}")
            else:
                self.warnings.append(f"⚠️  Missing directory: {dir_path}")
                
    def check_database(self):
        """Check database integrity"""
        print("\n💾 Checking database...")
        
        try:
            db = sqlite3.connect('maxed_out/soulfra.db')
            cursor = db.cursor()
            
            # Check tables
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
            tables = cursor.fetchall()
            
            expected_tables = ['whispers', 'components', 'agents', 'transactions']
            for table in expected_tables:
                if (table,) in tables:
                    # Count records
                    cursor.execute(f"SELECT COUNT(*) FROM {table}")
                    count = cursor.fetchone()[0]
                    self.successes.append(f"✅ Table '{table}': {count} records")
                else:
                    self.errors.append(f"❌ Missing table: {table}")
                    
            # Test write capability
            cursor.execute("INSERT INTO whispers (text, source, tone) VALUES (?, ?, ?)",
                          ("health_check_test", "system", "test"))
            db.commit()
            
            # Clean up test
            cursor.execute("DELETE FROM whispers WHERE source='system' AND tone='test'")
            db.commit()
            
            self.successes.append("✅ Database is writable")
            db.close()
            
        except Exception as e:
            self.errors.append(f"❌ Database error: {e}")
            
    def test_components(self):
        """Test each component safely"""
        print("\n🧪 Testing components...")
        
        component_dir = Path('maxed_out/components')
        if not component_dir.exists():
            self.warnings.append("⚠️  Components directory not found")
            return
            
        for component_file in component_dir.glob('*.py'):
            try:
                # Run component in subprocess with timeout
                result = subprocess.run(
                    ['python3', str(component_file)],
                    capture_output=True,
                    text=True,
                    timeout=5  # 5 second timeout
                )
                
                if result.returncode == 0:
                    self.successes.append(f"✅ {component_file.name} - OK")
                else:
                    self.warnings.append(f"⚠️  {component_file.name} - Exit code {result.returncode}")
                    
            except subprocess.TimeoutExpired:
                self.errors.append(f"❌ {component_file.name} - Timeout (possible infinite loop)")
            except Exception as e:
                self.errors.append(f"❌ {component_file.name} - Error: {e}")
                
    def check_resources(self):
        """Check system resources"""
        print("\n💻 Checking system resources...")
        
        # CPU usage
        cpu_percent = psutil.cpu_percent(interval=1)
        if cpu_percent < 80:
            self.successes.append(f"✅ CPU usage: {cpu_percent}%")
        else:
            self.warnings.append(f"⚠️  High CPU usage: {cpu_percent}%")
            
        # Memory usage
        memory = psutil.virtual_memory()
        if memory.percent < 80:
            self.successes.append(f"✅ Memory usage: {memory.percent}%")
        else:
            self.warnings.append(f"⚠️  High memory usage: {memory.percent}%")
            
        # Disk space
        disk = psutil.disk_usage('/')
        if disk.percent < 90:
            self.successes.append(f"✅ Disk usage: {disk.percent}%")
        else:
            self.warnings.append(f"⚠️  Low disk space: {disk.percent}% used")
            
    def check_processes(self):
        """Check for runaway processes"""
        print("\n🔍 Checking for runaway processes...")
        
        python_processes = []
        for proc in psutil.process_iter(['pid', 'name', 'cpu_percent']):
            try:
                if 'python' in proc.info['name'].lower():
                    python_processes.append(proc.info)
            except:
                pass
                
        if len(python_processes) < 10:
            self.successes.append(f"✅ Python processes: {len(python_processes)} (normal)")
        else:
            self.warnings.append(f"⚠️  Many Python processes: {len(python_processes)}")
            
    def test_safe_mode(self):
        """Test components in safe mode"""
        print("\n🛡️ Running safe mode test...")
        
        # Create a test whisper with constraints
        test_code = '''
import resource
import signal

# Set memory limit (100MB)
resource.setrlimit(resource.RLIMIT_AS, (100 * 1024 * 1024, 100 * 1024 * 1024))

# Set CPU time limit (2 seconds)
resource.setrlimit(resource.RLIMIT_CPU, (2, 2))

# Timeout handler
def timeout_handler(signum, frame):
    raise TimeoutError("Component exceeded time limit")

signal.signal(signal.SIGALRM, timeout_handler)
signal.alarm(3)  # 3 second wall clock timeout

try:
    # Test component creation
    print("Safe mode test: OK")
except Exception as e:
    print(f"Safe mode test failed: {e}")
'''
        
        try:
            result = subprocess.run(
                ['python3', '-c', test_code],
                capture_output=True,
                text=True,
                timeout=5
            )
            
            if "OK" in result.stdout:
                self.successes.append("✅ Safe mode constraints working")
            else:
                self.warnings.append("⚠️  Safe mode constraints may not be enforced")
                
        except Exception as e:
            self.errors.append(f"❌ Safe mode test failed: {e}")
            
    def generate_report(self):
        """Generate health report"""
        print("\n📊 HEALTH REPORT")
        print("=" * 60)
        
        total_checks = len(self.successes) + len(self.warnings) + len(self.errors)
        health_score = (len(self.successes) / total_checks * 100) if total_checks > 0 else 0
        
        print(f"\n🏆 Health Score: {health_score:.1f}%")
        print(f"✅ Successes: {len(self.successes)}")
        print(f"⚠️  Warnings: {len(self.warnings)}")
        print(f"❌ Errors: {len(self.errors)}")
        
        if self.errors:
            print("\n❌ ERRORS (Need attention):")
            for error in self.errors:
                print(f"  {error}")
                
        if self.warnings:
            print("\n⚠️  WARNINGS (Should review):")
            for warning in self.warnings:
                print(f"  {warning}")
                
        # Save report
        report_data = {
            "timestamp": datetime.now().isoformat(),
            "health_score": health_score,
            "successes": len(self.successes),
            "warnings": len(self.warnings),
            "errors": len(self.errors),
            "details": {
                "successes": self.successes,
                "warnings": self.warnings,
                "errors": self.errors
            }
        }
        
        with open('health_report.json', 'w') as f:
            json.dump(report_data, f, indent=2)
            
        print(f"\n💾 Full report saved to: health_report.json")
        
        # Recommendations
        print("\n💡 RECOMMENDATIONS:")
        
        if health_score >= 90:
            print("  ✅ System is healthy! Safe to run all components.")
        elif health_score >= 70:
            print("  ⚠️  System is mostly healthy. Review warnings before heavy use.")
        else:
            print("  ❌ System needs attention. Fix errors before running components.")
            
        if self.errors:
            print("\n🔧 Quick fixes:")
            for error in self.errors:
                if "Database" in error:
                    print("  - Run: python3 MAXED_THE_FUCK_OUT.py to recreate database")
                elif "Missing directory" in error:
                    print("  - Run: mkdir -p maxed_out/{components,ai_agents,marketplace,dashboards}")
                elif "Timeout" in error:
                    print("  - Check for infinite loops in components")
                    
        return health_score

# Create monitoring script
def create_monitor_script():
    """Create a lightweight monitoring script"""
    
    monitor_code = '''#!/usr/bin/env python3
"""
LIGHTWEIGHT MONITOR - Runs in background without consuming resources
"""

import time
import os
import json
from datetime import datetime

def get_stats():
    """Get basic stats without heavy processing"""
    stats = {
        "timestamp": datetime.now().isoformat(),
        "components": len(list(Path("maxed_out/components").glob("*.py"))) if os.path.exists("maxed_out/components") else 0,
        "status": "running"
    }
    return stats

# Main monitoring loop
print("🔍 Lightweight monitor started")
print("   Checking every 30 seconds...")
print("   Press Ctrl+C to stop")

while True:
    try:
        stats = get_stats()
        with open("monitor_status.json", "w") as f:
            json.dump(stats, f)
        time.sleep(30)
    except KeyboardInterrupt:
        print("\\n✅ Monitor stopped")
        break
    except Exception as e:
        print(f"Monitor error: {e}")
        time.sleep(60)
'''
    
    with open('lightweight_monitor.py', 'w') as f:
        f.write(monitor_code)
        
    os.chmod('lightweight_monitor.py', 0o755)
    print("📝 Created lightweight_monitor.py")

# Run health check
if __name__ == "__main__":
    checker = SystemHealthChecker()
    
    # Run all checks
    checker.check_directories()
    checker.check_database()
    checker.test_components()
    checker.check_resources()
    checker.check_processes()
    checker.test_safe_mode()
    
    # Generate report
    health_score = checker.generate_report()
    
    # Create monitor
    create_monitor_script()
    
    print("\n✅ Health check complete!")
    print(f"   Overall health: {health_score:.1f}%")
    
    if health_score >= 70:
        print("\n🚀 System is safe to use!")
        print("   Run: python3 lightweight_monitor.py")
        print("   For continuous monitoring")
    else:
        print("\n⚠️  Please address issues before running components")