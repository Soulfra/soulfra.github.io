#!/usr/bin/env python3
"""Working Backend API"""

from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import os
import subprocess
from pathlib import Path
import cgi

class WorkingAPI(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/status':
            self.send_json({
                'status': 'running',
                'services': self.check_services(),
                'files_processed': len(list(Path('working_system/data/processed').glob('*'))),
                'ready': True
            })
        elif self.path == '/test-qr':
            # Test JavaScript QR validator
            result = self.test_qr_validator()
            self.send_json(result)
        else:
            self.send_error(404)
            
    def do_POST(self):
        if self.path == '/upload':
            # Handle file upload
            form = cgi.FieldStorage(
                fp=self.rfile,
                headers=self.headers,
                environ={'REQUEST_METHOD': 'POST'}
            )
            
            if 'file' in form:
                file_item = form['file']
                if file_item.filename:
                    # Save file
                    filename = Path(file_item.filename).name
                    filepath = Path('working_system/data/drops') / filename
                    
                    with open(filepath, 'wb') as f:
                        f.write(file_item.file.read())
                        
                    # Process it
                    self.process_file(filepath)
                    
                    self.send_json({
                        'success': True,
                        'message': f'Processed {filename}'
                    })
                else:
                    self.send_json({'success': False, 'message': 'No file'})
            else:
                self.send_json({'success': False, 'message': 'No file field'})
        else:
            self.send_error(404)
            
    def send_json(self, data):
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())
        
    def check_services(self):
        services = {}
        # Check if QR validator exists
        qr_path = Path('../qr-validator.js')
        services['qr_validator'] = qr_path.exists()
        
        # Check other services
        services['frontend'] = Path('working_system/frontend/index.html').exists()
        services['data_directory'] = Path('working_system/data').exists()
        
        return services
        
    def test_qr_validator(self):
        try:
            # Call JavaScript QR validator
            result = subprocess.run(
                ['node', '../qr-validator.js', 'qr-founder-0000'],
                capture_output=True,
                text=True,
                cwd=str(Path.cwd())
            )
            
            return {
                'success': result.returncode == 0,
                'message': result.stdout.strip() or result.stderr.strip()
            }
        except Exception as e:
            return {
                'success': False,
                'message': str(e)
            }
            
    def process_file(self, filepath):
        # Simple processing - move to processed
        processed_path = Path('working_system/data/processed') / filepath.name
        filepath.rename(processed_path)
        
    def log_message(self, format, *args):
        pass

if __name__ == "__main__":
    os.makedirs('working_system/data/drops', exist_ok=True)
    os.makedirs('working_system/data/processed', exist_ok=True)
    
    server = HTTPServer(('localhost', 8081), WorkingAPI)
    print("Working API running on http://localhost:8081")
    server.serve_forever()
