from FILE_READ_RULE import safe_read_text, safe_write_text, quick_read_check

#!/usr/bin/env python3
"""
PLATFORM LOGGER - Enterprise logging system
Structured logging with rotation, analytics, and monitoring
"""

import json
import os
import time
from datetime import datetime
from pathlib import Path
import threading
import queue

class PlatformLogger:
    def __init__(self, log_dir="./logs"):
        self.log_dir = Path(log_dir)
        self.log_dir.mkdir(exist_ok=True)
        
        # Log files
        self.access_log = self.log_dir / f"access_{datetime.now().strftime('%Y%m%d')}.log"
        self.error_log = self.log_dir / f"error_{datetime.now().strftime('%Y%m%d')}.log"
        self.event_log = self.log_dir / f"events_{datetime.now().strftime('%Y%m%d')}.log"
        self.metrics_log = self.log_dir / f"metrics_{datetime.now().strftime('%Y%m%d')}.log"
        
        # Analytics
        self.analytics = {
            'total_requests': 0,
            'total_errors': 0,
            'api_calls': {},
            'game_events': {},
            'reflections': [],
            'performance': []
        }
        
        # Async logging queue
        self.log_queue = queue.Queue()
        self.worker_thread = threading.Thread(target=self._log_worker, daemon=True)
        self.worker_thread.start()
    
    def _log_worker(self):
        """Background worker for async logging"""
        while True:
            try:
                log_entry = self.log_queue.get(timeout=1)
                if log_entry is None:
                    break
                    
                log_type, data = log_entry
                
                if log_type == 'access':
                    with open(self.access_log, 'a') as f:
                        f.write(json.dumps(data) + '\n')
                elif log_type == 'error':
                    with open(self.error_log, 'a') as f:
                        f.write(json.dumps(data) + '\n')
                elif log_type == 'event':
                    with open(self.event_log, 'a') as f:
                        f.write(json.dumps(data) + '\n')
                elif log_type == 'metric':
                    with open(self.metrics_log, 'a') as f:
                        f.write(json.dumps(data) + '\n')
                        
            except queue.Empty:
                continue
            except Exception as e:
                print(f"Logging error: {e}")
    
    def log_access(self, request_data):
        """Log API access"""
        entry = {
            'timestamp': datetime.now().isoformat(),
            'method': request_data.get('method', 'GET'),
            'path': request_data.get('path', '/'),
            'status': request_data.get('status', 200),
            'duration_ms': request_data.get('duration', 0),
            'ip': request_data.get('ip', 'unknown'),
            'user_agent': request_data.get('user_agent', '')
        }
        
        self.log_queue.put(('access', entry))
        self.analytics['total_requests'] += 1
        
        # Track API usage
        api_path = entry['path']
        if api_path not in self.analytics['api_calls']:
            self.analytics['api_calls'][api_path] = 0
        self.analytics['api_calls'][api_path] += 1
    
    def log_error(self, error_data):
        """Log errors"""
        entry = {
            'timestamp': datetime.now().isoformat(),
            'level': error_data.get('level', 'ERROR'),
            'message': error_data.get('message', ''),
            'stack_trace': error_data.get('stack_trace', ''),
            'context': error_data.get('context', {})
        }
        
        self.log_queue.put(('error', entry))
        self.analytics['total_errors'] += 1
    
    def log_event(self, event_data):
        """Log game/platform events"""
        entry = {
            'timestamp': datetime.now().isoformat(),
            'event_type': event_data.get('type', 'unknown'),
            'user_id': event_data.get('user_id', 'anonymous'),
            'data': event_data.get('data', {}),
            'session_id': event_data.get('session_id', '')
        }
        
        self.log_queue.put(('event', entry))
        
        # Track game events
        event_type = entry['event_type']
        if event_type not in self.analytics['game_events']:
            self.analytics['game_events'][event_type] = 0
        self.analytics['game_events'][event_type] += 1
    
    def log_metric(self, metric_data):
        """Log performance metrics"""
        entry = {
            'timestamp': datetime.now().isoformat(),
            'metric_name': metric_data.get('name', ''),
            'value': metric_data.get('value', 0),
            'unit': metric_data.get('unit', ''),
            'tags': metric_data.get('tags', {})
        }
        
        self.log_queue.put(('metric', entry))
        self.analytics['performance'].append(entry)
    
    def log_reflection(self, reflection_data):
        """Log AI reflections"""
        entry = {
            'timestamp': datetime.now().isoformat(),
            'text': reflection_data.get('text', ''),
            'user_id': reflection_data.get('user_id', 'anonymous'),
            'score': reflection_data.get('score', 0),
            'ai_response': reflection_data.get('ai_response', None)
        }
        
        self.analytics['reflections'].append(entry)
        self.log_event({
            'type': 'reflection_submitted',
            'data': entry
        })
    
    def get_analytics(self):
        """Get current analytics"""
        return {
            'summary': {
                'total_requests': self.analytics['total_requests'],
                'total_errors': self.analytics['total_errors'],
                'total_reflections': len(self.analytics['reflections']),
                'unique_api_endpoints': len(self.analytics['api_calls']),
                'total_events': sum(self.analytics['game_events'].values())
            },
            'top_apis': sorted(
                self.analytics['api_calls'].items(),
                key=lambda x: x[1],
                reverse=True
            )[:10],
            'event_breakdown': self.analytics['game_events'],
            'recent_reflections': self.analytics['reflections'][-5:],
            'timestamp': datetime.now().isoformat()
        }
    
    def rotate_logs(self):
        """Rotate log files daily"""
        # This would be called by a scheduler
        pass
    
    def generate_report(self):
        """Generate daily report"""
        report = {
            'date': datetime.now().strftime('%Y-%m-%d'),
            'analytics': self.get_analytics(),
            'health_status': self._check_health(),
            'recommendations': self._get_recommendations()
        }
        
        report_file = self.log_dir / f"report_{datetime.now().strftime('%Y%m%d')}.json"
        with open(report_file, 'w') as f:
            json.dump(report, f, indent=2)
        
        return report
    
    def _check_health(self):
        """Check system health"""
        error_rate = self.analytics['total_errors'] / max(self.analytics['total_requests'], 1)
        
        return {
            'status': 'healthy' if error_rate < 0.05 else 'degraded',
            'error_rate': f"{error_rate:.2%}",
            'uptime': 'N/A',  # Would track actual uptime
            'response_time': 'N/A'  # Would track actual response times
        }
    
    def _get_recommendations(self):
        """AI-powered recommendations"""
        recommendations = []
        
        # Error rate check
        if self.analytics['total_errors'] > 10:
            recommendations.append({
                'priority': 'high',
                'message': 'High error rate detected. Review error logs.',
                'action': 'investigate_errors'
            })
        
        # API usage patterns
        if len(self.analytics['api_calls']) > 0:
            most_used = max(self.analytics['api_calls'].items(), key=lambda x: x[1])
            recommendations.append({
                'priority': 'medium',
                'message': f'Most used endpoint: {most_used[0]} ({most_used[1]} calls)',
                'action': 'optimize_performance'
            })
        
        # Reflection engagement
        if len(self.analytics['reflections']) < 5:
            recommendations.append({
                'priority': 'low',
                'message': 'Low reflection engagement. Consider prompting users.',
                'action': 'increase_engagement'
            })
        
        return recommendations

# Global logger instance
logger = PlatformLogger()

# Example usage
if __name__ == "__main__":
    # Test logging
    logger.log_access({
        'method': 'GET',
        'path': '/api/status',
        'status': 200,
        'duration': 15
    })
    
    logger.log_event({
        'type': 'game_started',
        'user_id': 'test_user',
        'data': {'character': 'warrior'}
    })
    
    logger.log_reflection({
        'text': 'This game is helping me think about strategy',
        'score': 100
    })
    
    # Get analytics
    print(json.dumps(logger.get_analytics(), indent=2))
    
    # Generate report
    report = logger.generate_report()
    print(f"\nReport generated: {logger.log_dir}/report_{datetime.now().strftime('%Y%m%d')}.json")