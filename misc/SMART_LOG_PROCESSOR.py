from FILE_READ_RULE import safe_read_text, safe_write_text, quick_read_check

#!/usr/bin/env python3
"""
SMART LOG PROCESSOR - Intelligently process logs with errors and important content
- Filters out noise
- Extracts key insights
- Identifies patterns
- Provides actionable summaries
"""

import os
import re
import json
from datetime import datetime
from collections import Counter, defaultdict
from typing import Dict, List, Tuple

class SmartLogProcessor:
    def __init__(self):
        self.log_dir = "logs"
        self.processed_dir = "processed_logs"
        self.insights_dir = "log_insights"
        self.setup_directories()
        
    def setup_directories(self):
        for d in [self.processed_dir, self.insights_dir]:
            os.makedirs(d, exist_ok=True)
            
    def process_all_logs(self) -> Dict:
        """Process all logs intelligently"""
        results = {
            'total_files': 0,
            'total_lines': 0,
            'errors_found': 0,
            'important_patterns': {},
            'insights': [],
            'recommendations': []
        }
        
        # Find all log files
        log_files = []
        for root, dirs, files in os.walk(self.log_dir):
            for file in files:
                if file.endswith('.log'):
                    log_files.append(os.path.join(root, file))
                    
        results['total_files'] = len(log_files)
        
        # Process each log file
        all_errors = []
        all_patterns = defaultdict(int)
        
        for log_file in log_files:
            file_results = self.process_single_log(log_file)
            results['total_lines'] += file_results['lines']
            results['errors_found'] += len(file_results['errors'])
            all_errors.extend(file_results['errors'])
            
            # Aggregate patterns
            for pattern, count in file_results['patterns'].items():
                all_patterns[pattern] += count
                
        # Analyze errors
        error_insights = self.analyze_errors(all_errors)
        results['insights'].extend(error_insights)
        
        # Find important patterns
        results['important_patterns'] = dict(sorted(
            all_patterns.items(), 
            key=lambda x: x[1], 
            reverse=True
        )[:20])
        
        # Generate recommendations
        results['recommendations'] = self.generate_recommendations(results)
        
        # Save summary
        self.save_insights(results)
        
        return results
        
    def process_single_log(self, log_file: str) -> Dict:
        """Process a single log file"""
        results = {
            'file': log_file,
            'lines': 0,
            'errors': [],
            'warnings': [],
            'patterns': Counter(),
            'important_lines': []
        }
        
        try:
            with open(log_file, 'r', encoding='utf-8', errors='ignore') as f:
                for line_num, line in enumerate(f, 1):
                    results['lines'] += 1
                    
                    # Check for errors
                    if self.is_error_line(line):
                        results['errors'].append({
                            'line_num': line_num,
                            'content': line.strip(),
                            'type': self.classify_error(line)
                        })
                        
                    # Check for warnings
                    elif self.is_warning_line(line):
                        results['warnings'].append({
                            'line_num': line_num,
                            'content': line.strip()
                        })
                        
                    # Extract patterns
                    patterns = self.extract_patterns(line)
                    for pattern in patterns:
                        results['patterns'][pattern] += 1
                        
                    # Check if line is important
                    if self.is_important_line(line):
                        results['important_lines'].append({
                            'line_num': line_num,
                            'content': line.strip()
                        })
                        
        except Exception as e:
            results['errors'].append({
                'line_num': 0,
                'content': f"Error reading file: {str(e)}",
                'type': 'file_error'
            })
            
        return results
        
    def is_error_line(self, line: str) -> bool:
        """Check if line contains an error"""
        error_indicators = [
            'error', 'ERROR', 'Error',
            'exception', 'Exception', 'EXCEPTION',
            'failed', 'Failed', 'FAILED',
            'traceback', 'Traceback',
            'fatal', 'Fatal', 'FATAL',
            '500', '404', '403', '400'
        ]
        return any(indicator in line for indicator in error_indicators)
        
    def is_warning_line(self, line: str) -> bool:
        """Check if line contains a warning"""
        warning_indicators = [
            'warning', 'Warning', 'WARNING',
            'warn', 'Warn', 'WARN',
            'deprecated', 'Deprecated',
            'caution', 'Caution'
        ]
        return any(indicator in line for indicator in warning_indicators)
        
    def is_important_line(self, line: str) -> bool:
        """Check if line contains important information"""
        important_indicators = [
            'success', 'Success', 'SUCCESS',
            'complete', 'Complete', 'COMPLETE',
            'started', 'Started', 'STARTED',
            'listening', 'Listening',
            'connected', 'Connected',
            'revenue', 'Revenue',
            'profit', 'Profit',
            'user', 'User',
            'launch', 'Launch'
        ]
        return any(indicator in line for indicator in important_indicators)
        
    def classify_error(self, line: str) -> str:
        """Classify the type of error"""
        if 'api' in line.lower() or '400' in line or '500' in line:
            return 'api_error'
        elif 'connection' in line.lower() or 'timeout' in line.lower():
            return 'connection_error'
        elif 'permission' in line.lower() or 'denied' in line.lower():
            return 'permission_error'
        elif 'syntax' in line.lower() or 'parse' in line.lower():
            return 'syntax_error'
        elif 'import' in line.lower() or 'module' in line.lower():
            return 'import_error'
        else:
            return 'general_error'
            
    def extract_patterns(self, line: str) -> List[str]:
        """Extract important patterns from log line"""
        patterns = []
        
        # IP addresses
        ip_pattern = r'\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b'
        if re.search(ip_pattern, line):
            patterns.append('ip_address')
            
        # URLs
        url_pattern = r'https?://[^\s]+'
        if re.search(url_pattern, line):
            patterns.append('url')
            
        # Timestamps
        if re.search(r'\d{4}-\d{2}-\d{2}', line):
            patterns.append('timestamp')
            
        # File paths
        if re.search(r'[/\\][\w\-\.]+[/\\]', line):
            patterns.append('file_path')
            
        # Function calls
        if re.search(r'\w+\(\)', line):
            patterns.append('function_call')
            
        # Port numbers
        if re.search(r':\d{4,5}\b', line):
            patterns.append('port_number')
            
        return patterns
        
    def analyze_errors(self, errors: List[Dict]) -> List[str]:
        """Analyze errors and provide insights"""
        insights = []
        
        if not errors:
            insights.append("✅ No errors found in logs - system running smoothly!")
            return insights
            
        # Count error types
        error_types = Counter(e['type'] for e in errors)
        
        # Most common error
        most_common = error_types.most_common(1)[0]
        insights.append(f"⚠️  Most common error: {most_common[0]} ({most_common[1]} occurrences)")
        
        # API errors
        api_errors = [e for e in errors if e['type'] == 'api_error']
        if api_errors:
            insights.append(f"🔌 Found {len(api_errors)} API errors - check API keys and endpoints")
            
        # Connection errors
        conn_errors = [e for e in errors if e['type'] == 'connection_error']
        if conn_errors:
            insights.append(f"🌐 Found {len(conn_errors)} connection errors - check network and services")
            
        # Recent errors
        if errors:
            insights.append(f"📍 Total errors found: {len(errors)}")
            
        return insights
        
    def generate_recommendations(self, results: Dict) -> List[str]:
        """Generate actionable recommendations"""
        recommendations = []
        
        # Based on errors
        if results['errors_found'] > 100:
            recommendations.append("🚨 High error rate detected - prioritize debugging")
        elif results['errors_found'] > 50:
            recommendations.append("⚠️  Moderate errors - review error patterns")
            
        # Based on patterns
        patterns = results['important_patterns']
        if patterns.get('api_error', 0) > 10:
            recommendations.append("🔧 Fix API configuration - multiple API errors detected")
            
        if patterns.get('connection_error', 0) > 5:
            recommendations.append("🌐 Check service connections - connection issues found")
            
        # General recommendations
        if results['total_lines'] > 100000:
            recommendations.append("📊 Consider log rotation - logs are getting large")
            
        if not recommendations:
            recommendations.append("✅ System appears healthy - continue monitoring")
            
        return recommendations
        
    def save_insights(self, results: Dict):
        """Save insights to file"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        insights_file = f"{self.insights_dir}/log_insights_{timestamp}.json"
        
        with open(insights_file, 'w') as f:
            json.dump(results, f, indent=2)
            
        # Also create human-readable summary
        summary_file = f"{self.insights_dir}/log_summary_{timestamp}.md"
        with open(summary_file, 'w') as f:
            f.write("# Log Analysis Summary\n\n")
            f.write(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
            
            f.write("## Overview\n")
            f.write(f"- Files analyzed: {results['total_files']}\n")
            f.write(f"- Total lines: {results['total_lines']:,}\n")
            f.write(f"- Errors found: {results['errors_found']}\n\n")
            
            f.write("## Key Insights\n")
            for insight in results['insights']:
                f.write(f"- {insight}\n")
                
            f.write("\n## Recommendations\n")
            for rec in results['recommendations']:
                f.write(f"- {rec}\n")
                
            f.write("\n## Top Patterns\n")
            for pattern, count in list(results['important_patterns'].items())[:10]:
                f.write(f"- {pattern}: {count} occurrences\n")
                
        print(f"✅ Insights saved to: {insights_file}")
        print(f"✅ Summary saved to: {summary_file}")

# Quick processor for Matthew's logs
def process_matthews_logs():
    processor = SmartLogProcessor()
    
    print("🔍 Smart Log Processor Starting...")
    print("This will intelligently filter through all your logs")
    print("Finding errors, patterns, and important information\n")
    
    results = processor.process_all_logs()
    
    print("\n📊 ANALYSIS COMPLETE!\n")
    print(f"Files processed: {results['total_files']}")
    print(f"Lines analyzed: {results['total_lines']:,}")
    print(f"Errors found: {results['errors_found']}")
    
    print("\n💡 KEY INSIGHTS:")
    for insight in results['insights'][:5]:
        print(f"  {insight}")
        
    print("\n🎯 RECOMMENDATIONS:")
    for rec in results['recommendations']:
        print(f"  {rec}")
        
    print("\n✅ Full reports saved in log_insights/ directory")
    
    return results

if __name__ == "__main__":
    process_matthews_logs()