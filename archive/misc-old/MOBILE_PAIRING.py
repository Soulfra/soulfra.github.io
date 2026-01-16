#!/usr/bin/env python3
"""
MOBILE PAIRING SYSTEM
Connects phones to Soulfra using QR codes
"""

import os
import json
import qrcode
import uuid
from datetime import datetime
import sqlite3

class MobilePairing:
    def __init__(self):
        self.db_path = "mobile_sync/pairing.db"
        self.setup_database()
        
    def setup_database(self):
        os.makedirs("mobile_sync", exist_ok=True)
        conn = sqlite3.connect(self.db_path)
        
        conn.execute("""
            CREATE TABLE IF NOT EXISTS devices (
                device_id TEXT PRIMARY KEY,
                device_name TEXT,
                platform TEXT,
                paired_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_sync TIMESTAMP,
                user_id TEXT
            )
        """)
        
        conn.execute("""
            CREATE TABLE IF NOT EXISTS sync_queue (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                device_id TEXT,
                data_type TEXT,
                data TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                synced BOOLEAN DEFAULT FALSE
            )
        """)
        
        conn.commit()
        conn.close()
        
    def generate_pairing_qr(self, user_id):
        """Generate QR code for mobile pairing"""
        pairing_code = f"SOULFRA-PAIR-{uuid.uuid4().hex[:8].upper()}"
        
        # Generate QR
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        
        # Deep link for mobile app
        deep_link = f"soulfra://pair?code={pairing_code}&server=localhost:6004"
        qr.add_data(deep_link)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        img_path = f"qr_codes/pair_{pairing_code}.png"
        img.save(img_path)
        
        # Save pairing code
        conn = sqlite3.connect(self.db_path)
        conn.execute("""
            INSERT INTO devices (device_id, user_id)
            VALUES (?, ?)
        """, (pairing_code, user_id))
        conn.commit()
        conn.close()
        
        return {
            "code": pairing_code,
            "qr_image": img_path,
            "deep_link": deep_link
        }
        
    def sync_from_phone(self, device_id, data):
        """Sync data from phone"""
        conn = sqlite3.connect(self.db_path)
        
        # Update last sync
        conn.execute("""
            UPDATE devices SET last_sync = CURRENT_TIMESTAMP
            WHERE device_id = ?
        """, (device_id,))
        
        # Add to sync queue
        conn.execute("""
            INSERT INTO sync_queue (device_id, data_type, data)
            VALUES (?, ?, ?)
        """, (device_id, data.get('type', 'unknown'), json.dumps(data)))
        
        conn.commit()
        conn.close()
        
        # Process if it's a chat log
        if data.get('type') == 'chatlog':
            self.process_mobile_chatlog(data)
            
    def process_mobile_chatlog(self, data):
        """Process chat log from mobile"""
        # Save to drops folder for processing
        filename = f"mobile_chat_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        filepath = f"chatlog_drops/{filename}"
        
        with open(filepath, 'w') as f:
            json.dump(data, f)
            
        print(f"Mobile chat log saved: {filename}")

if __name__ == "__main__":
    pairing = MobilePairing()
    
    # Example: Generate pairing QR
    result = pairing.generate_pairing_qr("user_123")
    print(f"QR Code generated: {result['qr_image']}")
    print(f"Deep link: {result['deep_link']}")
