#!/usr/bin/env python3
"""
INTERNAL TESTING SUITE - Test the Soulfra Standard Before Open Source Release
Let's make sure everything actually works before we claim it's the future of development
"""

import os
import json
import time
import subprocess
import urllib.request
import socket
from datetime import datetime
from FILE_READ_RULE import safe_read_text, safe_write_text, quick_read_check

class InternalTestingSuite:
    """Comprehensive testing of the Soulfra Development Standard"""
    
    def __init__(self):
        self.test_results = {}
        self.start_time = datetime.now()
        self.tests_passed = 0
        self.tests_failed = 0
        self.critical_failures = []
        
    def log_test(self, test_name, status, details="", critical=False):
        """Log test results"""
        timestamp = datetime.now().strftime('%H:%M:%S')
        
        self.test_results[test_name] = {
            "status": status,
            "timestamp": timestamp,
            "details": details,
            "critical": critical
        }
        
        if status == "PASS":
            self.tests_passed += 1
            print(f"✅ [{timestamp}] {test_name}: PASSED")
        else:
            self.tests_failed += 1
            print(f"❌ [{timestamp}] {test_name}: FAILED - {details}")
            if critical:
                self.critical_failures.append(test_name)
        
        if details:
            print(f"   💡 {details}")
    
    def test_compatibility_checking(self):
        """Test the proactive compatibility checking"""
        print("\n🔍 TESTING COMPATIBILITY CHECKING...")
        
        try:
            from SOULFRA_DEV_STANDARD import SoulfraDevelopmentStandard
            std = SoulfraDevelopmentStandard()
            
            # Test port availability checking
            port_check = std.check_port_availability()
            if "available" in port_check and "used" in port_check:
                self.log_test("Port Availability Check", "PASS", 
                             f"Found {len(port_check['available'])} available ports")
            else:
                self.log_test("Port Availability Check", "FAIL", 
                             "Port checking didn't return expected format", critical=True)
            
            # Test process conflict detection
            process_check = std.check_process_conflicts()
            if "conflicts" in process_check:
                self.log_test("Process Conflict Detection", "PASS",
                             f"Detected {len(process_check['conflicts'])} potential conflicts")
            else:
                self.log_test("Process Conflict Detection", "FAIL",
                             "Process checking failed", critical=True)
            
            # Test file dependency checking
            file_check = std.check_file_dependencies()
            if isinstance(file_check, dict):
                ready_files = sum(1 for status in file_check.values() if status == "ready")
                self.log_test("File Dependency Check", "PASS",
                             f"{ready_files} critical files ready")
            else:
                self.log_test("File Dependency Check", "FAIL",
                             "File dependency check failed", critical=True)
                
        except Exception as e:
            self.log_test("Compatibility Checking Module", "FAIL", str(e), critical=True)
    
    def test_error_prevention(self):
        """Test the error prevention systems"""
        print("\n🛡️ TESTING ERROR PREVENTION...")
        
        try:
            # Test file read rule enforcement
            test_file = 'error_prevention_test.txt'
            
            # This should fail (writing without reading)
            try:
                from FILE_READ_RULE import safe_write_text
                safe_write_text(test_file, 'test content')
                self.log_test("File Read Rule Enforcement", "FAIL",
                             "Should have prevented write without read", critical=True)
            except Exception:
                self.log_test("File Read Rule Enforcement", "PASS",
                             "Correctly prevented write without read")
            
            # This should work (read then write)
            try:
                quick_read_check(test_file)
                safe_write_text(test_file, 'test content')
                content = safe_read_text(test_file)
                if content == 'test content':
                    self.log_test("Safe File Operations", "PASS",
                                 "Read-then-write operations work correctly")
                else:
                    self.log_test("Safe File Operations", "FAIL",
                                 "File content doesn't match", critical=True)
                
                # Clean up
                os.remove(test_file)
                
            except Exception as e:
                self.log_test("Safe File Operations", "FAIL", str(e), critical=True)
                
        except Exception as e:
            self.log_test("Error Prevention System", "FAIL", str(e), critical=True)
    
    def test_ecosystem_integration(self):
        """Test that all our ecosystem components are working"""
        print("\n🌐 TESTING ECOSYSTEM INTEGRATION...")
        
        # Test each service endpoint
        services = {
            "Actually Working System": "http://localhost:3030",
            "Full Pipeline System": "http://localhost:4000", 
            "Multimodal System": "http://localhost:5555",
            "Addiction Engine": "http://localhost:7777"
        }
        
        for service_name, url in services.items():
            try:
                response = urllib.request.urlopen(url, timeout=2)
                if response.getcode() == 200:
                    content = response.read().decode('utf-8')
                    if len(content) > 100:  # Has actual content
                        self.log_test(f"Service: {service_name}", "PASS",
                                     f"Responding on {url}")
                    else:
                        self.log_test(f"Service: {service_name}", "FAIL",
                                     f"Empty response from {url}")
                else:
                    self.log_test(f"Service: {service_name}", "FAIL",
                                 f"Bad status code: {response.getcode()}")
            except Exception as e:
                self.log_test(f"Service: {service_name}", "FAIL",
                             f"Connection failed: {str(e)}", critical=True)
    
    def test_addiction_mechanics(self):
        """Test the addiction engine functionality"""
        print("\n🎯 TESTING ADDICTION MECHANICS...")
        
        try:
            # Test addiction engine API
            addiction_url = "http://localhost:7777"
            
            # Test main interface
            response = urllib.request.urlopen(addiction_url, timeout=2)
            content = response.read().decode('utf-8')
            
            # Check for key addiction elements
            addiction_elements = [
                "ADDICTION ENGINE",
                "Level",
                "XP Points", 
                "Day Streak",
                "START LEARNING SESSION",
                "CHALLENGE SOMEONE"
            ]
            
            found_elements = sum(1 for element in addiction_elements if element in content)
            
            if found_elements >= len(addiction_elements) * 0.8:  # 80% of elements found
                self.log_test("Addiction Interface Elements", "PASS",
                             f"Found {found_elements}/{len(addiction_elements)} key elements")
            else:
                self.log_test("Addiction Interface Elements", "FAIL",
                             f"Only found {found_elements}/{len(addiction_elements)} elements")
            
            # Test dashboard endpoint
            try:
                dashboard_response = urllib.request.urlopen(f"{addiction_url}/dashboard", timeout=2)
                if dashboard_response.getcode() == 200:
                    self.log_test("Addiction Dashboard", "PASS", "Dashboard endpoint working")
                else:
                    self.log_test("Addiction Dashboard", "FAIL", "Dashboard not responding")
            except:
                self.log_test("Addiction Dashboard", "FAIL", "Dashboard endpoint failed")
                
        except Exception as e:
            self.log_test("Addiction Engine", "FAIL", str(e), critical=True)
    
    def test_multimodal_capabilities(self):
        """Test multimodal input processing"""
        print("\n🎤 TESTING MULTIMODAL CAPABILITIES...")
        
        try:
            multimodal_url = "http://localhost:5555"
            response = urllib.request.urlopen(multimodal_url, timeout=2)
            content = response.read().decode('utf-8')
            
            # Check for multimodal elements
            multimodal_elements = [
                "voice",
                "video", 
                "screenshot",
                "multimodal",
                "input"
            ]
            
            found_elements = sum(1 for element in multimodal_elements 
                               if element.lower() in content.lower())
            
            if found_elements >= 3:
                self.log_test("Multimodal Interface", "PASS",
                             f"Found {found_elements} multimodal elements")
            else:
                self.log_test("Multimodal Interface", "FAIL",
                             f"Only found {found_elements} multimodal elements")
                
        except Exception as e:
            self.log_test("Multimodal System", "FAIL", str(e), critical=True)
    
    def test_viral_mechanics(self):
        """Test viral sharing and social features"""
        print("\n📱 TESTING VIRAL MECHANICS...")
        
        try:
            # Check addiction engine for viral elements
            addiction_url = "http://localhost:7777"
            response = urllib.request.urlopen(addiction_url, timeout=2)
            content = response.read().decode('utf-8')
            
            viral_elements = [
                "SHARE",
                "VIRAL", 
                "TikTok",
                "Instagram",
                "Twitter",
                "leaderboard",
                "rank"
            ]
            
            found_viral = sum(1 for element in viral_elements 
                            if element.lower() in content.lower())
            
            if found_viral >= 4:
                self.log_test("Viral Mechanics", "PASS",
                             f"Found {found_viral} viral elements")
            else:
                self.log_test("Viral Mechanics", "FAIL",
                             f"Only found {found_viral} viral elements")
                
        except Exception as e:
            self.log_test("Viral Mechanics", "FAIL", str(e))
    
    def test_production_readiness(self):
        """Test production readiness features"""
        print("\n🚀 TESTING PRODUCTION READINESS...")
        
        # Test database creation
        databases = ['addiction_engine.db', 'multimodal.db', 'full_pipeline.db']
        db_count = sum(1 for db in databases if os.path.exists(db))
        
        if db_count >= 2:
            self.log_test("Database Creation", "PASS", f"{db_count} databases exist")
        else:
            self.log_test("Database Creation", "FAIL", 
                         f"Only {db_count} databases found", critical=True)
        
        # Test log file generation
        log_files = [f for f in os.listdir('.') if f.endswith('.log')]
        if len(log_files) > 0:
            self.log_test("Logging System", "PASS", f"Found {len(log_files)} log files")
        else:
            self.log_test("Logging System", "FAIL", "No log files found")
        
        # Test configuration files
        config_files = ['SOULFRA_DEVELOPMENT_FRAMEWORK.json', 
                       'SOULFRA_DEVELOPMENT_STANDARD.md']
        config_count = sum(1 for config in config_files if os.path.exists(config))
        
        if config_count == len(config_files):
            self.log_test("Configuration Files", "PASS", "All config files present")
        else:
            self.log_test("Configuration Files", "FAIL", 
                         f"Missing {len(config_files) - config_count} config files")
    
    def test_performance_load(self):
        """Test system performance under light load"""
        print("\n⚡ TESTING PERFORMANCE...")
        
        services = [
            "http://localhost:3030",
            "http://localhost:5555", 
            "http://localhost:7777"
        ]
        
        response_times = []
        
        for service in services:
            try:
                start_time = time.time()
                response = urllib.request.urlopen(service, timeout=5)
                response_time = time.time() - start_time
                response_times.append(response_time)
                
                if response_time < 1.0:  # Under 1 second
                    self.log_test(f"Performance: {service}", "PASS",
                                 f"Response time: {response_time:.3f}s")
                else:
                    self.log_test(f"Performance: {service}", "FAIL",
                                 f"Slow response: {response_time:.3f}s")
            except Exception as e:
                self.log_test(f"Performance: {service}", "FAIL", str(e))
        
        if response_times:
            avg_response = sum(response_times) / len(response_times)
            if avg_response < 0.5:
                self.log_test("Average Response Time", "PASS", 
                             f"Avg: {avg_response:.3f}s")
            else:
                self.log_test("Average Response Time", "FAIL",
                             f"Avg too slow: {avg_response:.3f}s")
    
    def run_stress_test(self):
        """Run a light stress test"""
        print("\n💪 RUNNING STRESS TEST...")
        
        try:
            import threading
            import time
            
            def hit_endpoint(url, results, index):
                try:
                    start = time.time()
                    response = urllib.request.urlopen(url, timeout=3)
                    duration = time.time() - start
                    results[index] = {"success": True, "duration": duration}
                except Exception as e:
                    results[index] = {"success": False, "error": str(e)}
            
            # Test with 10 concurrent requests to addiction engine
            url = "http://localhost:7777"
            results = {}
            threads = []
            
            start_time = time.time()
            
            for i in range(10):
                thread = threading.Thread(target=hit_endpoint, args=(url, results, i))
                threads.append(thread)
                thread.start()
            
            for thread in threads:
                thread.join()
            
            total_time = time.time() - start_time
            success_count = sum(1 for r in results.values() if r["success"])
            
            if success_count >= 8:  # 80% success rate
                self.log_test("Concurrent Load Test", "PASS",
                             f"{success_count}/10 requests succeeded in {total_time:.2f}s")
            else:
                self.log_test("Concurrent Load Test", "FAIL",
                             f"Only {success_count}/10 requests succeeded")
                
        except Exception as e:
            self.log_test("Stress Test", "FAIL", str(e))
    
    def generate_test_report(self):
        """Generate comprehensive test report"""
        print("\n📊 GENERATING TEST REPORT...")
        
        total_tests = self.tests_passed + self.tests_failed
        success_rate = (self.tests_passed / total_tests * 100) if total_tests > 0 else 0
        
        test_duration = datetime.now() - self.start_time
        
        report = f"""
# 🧪 SOULFRA DEVELOPMENT STANDARD - INTERNAL TEST REPORT

**Test Run:** {self.start_time.strftime('%Y-%m-%d %H:%M:%S')}
**Duration:** {test_duration.total_seconds():.1f} seconds
**Success Rate:** {success_rate:.1f}% ({self.tests_passed}/{total_tests} tests passed)

## 📊 SUMMARY

{'🟢 READY FOR OPEN SOURCE' if success_rate >= 85 and len(self.critical_failures) == 0 else '🟡 NEEDS WORK BEFORE RELEASE' if success_rate >= 70 else '🔴 NOT READY - CRITICAL ISSUES'}

- ✅ **Tests Passed:** {self.tests_passed}
- ❌ **Tests Failed:** {self.tests_failed}
- 🚨 **Critical Failures:** {len(self.critical_failures)}

## 🔍 DETAILED RESULTS

"""
        
        for test_name, result in self.test_results.items():
            status_icon = "✅" if result["status"] == "PASS" else "❌"
            critical_flag = " 🚨" if result["critical"] else ""
            
            report += f"### {status_icon} {test_name}{critical_flag}\n"
            report += f"**Time:** {result['timestamp']}\n"
            if result["details"]:
                report += f"**Details:** {result['details']}\n"
            report += "\n"
        
        if self.critical_failures:
            report += "## 🚨 CRITICAL FAILURES TO FIX\n\n"
            for failure in self.critical_failures:
                report += f"- ❌ **{failure}**\n"
            report += "\n"
        
        report += f"""
## 🎯 RECOMMENDATIONS

{'### ✅ READY FOR OPEN SOURCE RELEASE' if success_rate >= 85 and len(self.critical_failures) == 0 else '### 🔧 FIXES NEEDED BEFORE RELEASE'}

"""
        
        if success_rate >= 85 and len(self.critical_failures) == 0:
            report += """
The Soulfra Development Standard has passed all critical tests and is ready for open source release!

**Next Steps:**
1. Create GitHub repository
2. Package for distribution
3. Write installation guides
4. Create demo videos
5. Launch to developer community

🚀 **This will revolutionize how software is built!**
"""
        else:
            report += f"""
The system needs work before open source release:

**Priority Fixes:**
{chr(10).join(f'- Fix {failure}' for failure in self.critical_failures)}

**Performance Issues:**
- {100 - success_rate:.1f}% of tests failed
- Address failing tests before release

**Recommended Timeline:**
- Fix critical issues: 1-2 days
- Rerun full test suite
- Package for release when success rate > 85%
"""
        
        # Save the report
        quick_read_check('INTERNAL_TEST_REPORT.md')
        safe_write_text('INTERNAL_TEST_REPORT.md', report)
        
        print(f"""
✅ TEST REPORT GENERATED: INTERNAL_TEST_REPORT.md

🎯 RESULTS SUMMARY:
   Success Rate: {success_rate:.1f}%
   Tests Passed: {self.tests_passed}
   Tests Failed: {self.tests_failed}
   Critical Failures: {len(self.critical_failures)}

{'🟢 READY FOR OPEN SOURCE!' if success_rate >= 85 and len(self.critical_failures) == 0 else '🟡 NEEDS MORE WORK' if success_rate >= 70 else '🔴 MAJOR ISSUES FOUND'}
""")
        
        return report
    
    def run_full_test_suite(self):
        """Run the complete internal testing suite"""
        print("""
🧪🧪🧪 SOULFRA DEVELOPMENT STANDARD - INTERNAL TESTING 🧪🧪🧪

Running comprehensive tests before open source release...
Making sure everything actually works as advertised!
""")
        
        # Run all test categories
        self.test_compatibility_checking()
        self.test_error_prevention()
        self.test_ecosystem_integration()
        self.test_addiction_mechanics()
        self.test_multimodal_capabilities()
        self.test_viral_mechanics()
        self.test_production_readiness()
        self.test_performance_load()
        self.run_stress_test()
        
        # Generate final report
        self.generate_test_report()
        
        return self.test_results

def run_internal_tests():
    """Run the internal testing suite"""
    suite = InternalTestingSuite()
    results = suite.run_full_test_suite()
    return suite, results

if __name__ == '__main__':
    run_internal_tests()