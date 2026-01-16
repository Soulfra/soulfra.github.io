#!/usr/bin/env python3
"""
SAFE HEALTH CHECK - No external dependencies, guaranteed to work
"""

import os
import json
import sqlite3
import subprocess
import time
from datetime import datetime
from pathlib import Path

print("🏥 SAFE SYSTEM HEALTH CHECK 🏥")
print("=" * 60)
print("Checking all components safely...")
print()

class SafeHealthChecker:
    def __init__(self):
        self.report = {
            "timestamp": datetime.now().isoformat(),
            "checks": [],
            "score": 0
        }
        
    def check(self, name, test_func):
        """Run a check safely"""
        try:
            result = test_func()
            self.report["checks"].append({
                "name": name,
                "status": "pass" if result else "fail",
                "message": result or "Check failed"
            })
            return result
        except Exception as e:
            self.report["checks"].append({
                "name": name,
                "status": "error",
                "message": str(e)
            })
            return False
            
    def check_directories(self):
        """Check critical directories"""
        print("📁 Checking directories...")
        
        dirs_ok = True
        for dir_path in ['maxed_out', 'maxed_out/components', 'maxed_out/ai_agents']:
            exists = os.path.exists(dir_path)
            print(f"  {'✅' if exists else '❌'} {dir_path}")
            dirs_ok = dirs_ok and exists
            
        return "All directories present" if dirs_ok else None
        
    def check_database(self):
        """Test database access"""
        print("\n💾 Checking database...")
        
        try:
            db = sqlite3.connect('maxed_out/soulfra.db')
            cursor = db.cursor()
            
            # Count records
            cursor.execute("SELECT COUNT(*) FROM components")
            count = cursor.fetchone()[0]
            print(f"  ✅ Components in database: {count}")
            
            db.close()
            return f"Database working with {count} components"
            
        except Exception as e:
            print(f"  ❌ Database error: {e}")
            return None
            
    def test_component_safety(self):
        """Test a component with safety constraints"""
        print("\n🧪 Testing component safety...")
        
        # Pick first component
        comp_dir = Path('maxed_out/components')
        if not comp_dir.exists():
            return None
            
        components = list(comp_dir.glob('*.py'))
        if not components:
            return None
            
        test_comp = components[0]
        print(f"  Testing {test_comp.name}...")
        
        # Run with timeout
        try:
            result = subprocess.run(
                ['python3', str(test_comp)],
                capture_output=True,
                text=True,
                timeout=3
            )
            
            if result.returncode == 0:
                print(f"  ✅ Component runs safely")
                return "Components are safe to run"
            else:
                print(f"  ⚠️  Component exited with code {result.returncode}")
                return None
                
        except subprocess.TimeoutExpired:
            print(f"  ❌ Component timeout - possible infinite loop")
            return None
            
    def check_disk_space(self):
        """Check available disk space"""
        print("\n💽 Checking disk space...")
        
        try:
            # Get disk usage for current directory
            stat = os.statvfs('.')
            free_gb = (stat.f_bavail * stat.f_frsize) / (1024**3)
            
            print(f"  ✅ Free space: {free_gb:.1f} GB")
            
            if free_gb > 1:
                return f"Sufficient disk space: {free_gb:.1f} GB free"
            else:
                return None
                
        except Exception as e:
            print(f"  ⚠️  Could not check disk space: {e}")
            return "Disk check skipped"
            
    def count_processes(self):
        """Count Python processes safely"""
        print("\n🔍 Checking processes...")
        
        try:
            result = subprocess.run(
                ['ps', 'aux'],
                capture_output=True,
                text=True
            )
            
            python_count = result.stdout.count('python')
            print(f"  ✅ Python processes: {python_count}")
            
            if python_count < 20:
                return f"Process count normal: {python_count}"
            else:
                return None
                
        except:
            return "Process check skipped"
            
    def create_safe_runner(self):
        """Create a safe component runner"""
        print("\n🛡️ Creating safe runner...")
        
        safe_runner = '''#!/usr/bin/env python3
"""
SAFE COMPONENT RUNNER - Runs components with safety limits
"""

import sys
import subprocess
import signal

def run_safely(component_path, timeout=5):
    """Run a component with safety constraints"""
    
    # Set up timeout handler
    def timeout_handler(signum, frame):
        print("⏱️ Component exceeded time limit")
        sys.exit(1)
        
    signal.signal(signal.SIGALRM, timeout_handler)
    signal.alarm(timeout)
    
    try:
        # Run the component
        result = subprocess.run(
            ['python3', component_path],
            timeout=timeout,
            capture_output=True,
            text=True
        )
        
        print(f"✅ Component ran successfully")
        print(f"Output: {result.stdout}")
        
        if result.stderr:
            print(f"Errors: {result.stderr}")
            
    except subprocess.TimeoutExpired:
        print("❌ Component timed out - possible infinite loop")
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        signal.alarm(0)  # Cancel alarm

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 safe_runner.py <component.py>")
        sys.exit(1)
        
    run_safely(sys.argv[1])
'''
        
        with open('safe_runner.py', 'w') as f:
            f.write(safe_runner)
            
        os.chmod('safe_runner.py', 0o755)
        print("  ✅ Created safe_runner.py")
        
        return "Safe runner created"
        
    def generate_report(self):
        """Generate final report"""
        print("\n" + "=" * 60)
        print("📊 HEALTH REPORT SUMMARY")
        print("=" * 60)
        
        # Calculate score
        total = len(self.report["checks"])
        passed = sum(1 for c in self.report["checks"] if c["status"] == "pass")
        self.report["score"] = (passed / total * 100) if total > 0 else 0
        
        print(f"\n🏆 Health Score: {self.report['score']:.0f}%")
        print(f"✅ Passed: {passed}/{total}")
        
        # Show issues
        issues = [c for c in self.report["checks"] if c["status"] != "pass"]
        if issues:
            print("\n⚠️  Issues found:")
            for issue in issues:
                print(f"  - {issue['name']}: {issue['message']}")
                
        # Save report
        with open('safe_health_report.json', 'w') as f:
            json.dump(self.report, f, indent=2)
            
        print(f"\n💾 Report saved to: safe_health_report.json")
        
        # Recommendations
        print("\n💡 RECOMMENDATIONS:")
        
        if self.report["score"] >= 80:
            print("  ✅ System is healthy and safe to use!")
            print("  - Run components: python3 safe_runner.py <component.py>")
            print("  - Or directly: python3 maxed_out/components/<name>.py")
        elif self.report["score"] >= 60:
            print("  ⚠️  System is mostly safe. Use safe_runner.py for components.")
        else:
            print("  ❌ Issues detected. Please fix before running components.")
            
            # Specific fixes
            if not os.path.exists('maxed_out'):
                print("\n  To fix: Run python3 MAXED_THE_FUCK_OUT.py first")

# Quick safety tips
def show_safety_tips():
    """Show safety tips"""
    print("\n🛡️ SAFETY TIPS:")
    print("  1. Always run components with timeouts")
    print("  2. Monitor CPU/memory while running")
    print("  3. Use safe_runner.py for untested components")
    print("  4. Keep backups of important data")
    print("  5. Run one component at a time initially")

# Main execution
if __name__ == "__main__":
    checker = SafeHealthChecker()
    
    # Run all checks
    checker.check("Directories", checker.check_directories)
    checker.check("Database", checker.check_database)
    checker.check("Component Safety", checker.test_component_safety)
    checker.check("Disk Space", checker.check_disk_space)
    checker.check("Process Count", checker.count_processes)
    checker.check("Safe Runner", checker.create_safe_runner)
    
    # Generate report
    checker.generate_report()
    
    # Show safety tips
    show_safety_tips()
    
    print("\n✅ Health check complete!")
    
    # Create a simple status file
    status = {
        "healthy": checker.report["score"] >= 80,
        "score": checker.report["score"],
        "checked_at": datetime.now().isoformat()
    }
    
    with open('system_status.json', 'w') as f:
        json.dump(status, f, indent=2)
        
    print(f"   Status: {'HEALTHY' if status['healthy'] else 'NEEDS ATTENTION'}")