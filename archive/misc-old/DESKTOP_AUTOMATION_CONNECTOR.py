#!/usr/bin/env python3
"""
DESKTOP AUTOMATION CONNECTOR - Control desktop apps programmatically
Works with Claude, ChatGPT, and other desktop applications
"""

import os
import sys
import time
import subprocess
import platform
from typing import Dict, Optional, Any
import json

# Platform-specific imports
if platform.system() == "Darwin":  # macOS
    import applescript
    USE_APPLESCRIPT = True
else:
    USE_APPLESCRIPT = False

try:
    import pyautogui
    pyautogui.FAILSAFE = True
    HAS_PYAUTOGUI = True
except ImportError:
    HAS_PYAUTOGUI = False
    print("⚠️  pyautogui not installed - some features limited")

class DesktopAutomation:
    """Control desktop applications"""
    
    def __init__(self):
        self.system = platform.system()
        self.app_configs = self.load_app_configs()
        
    def load_app_configs(self) -> Dict:
        """Load configuration for different apps"""
        return {
            'claude': {
                'name': 'Claude',
                'bundle_id': 'com.anthropic.claude',
                'window_title': 'Claude',
                'shortcuts': {
                    'new_chat': ['cmd', 'n'] if self.system == "Darwin" else ['ctrl', 'n'],
                    'send': ['enter'],
                    'copy': ['cmd', 'c'] if self.system == "Darwin" else ['ctrl', 'c'],
                }
            },
            'chatgpt': {
                'name': 'ChatGPT',
                'bundle_id': 'com.openai.chatgpt',
                'window_title': 'ChatGPT',
                'shortcuts': {
                    'new_chat': ['cmd', 'n'] if self.system == "Darwin" else ['ctrl', 'n'],
                    'send': ['enter'],
                }
            },
            'cursor': {
                'name': 'Cursor',
                'bundle_id': 'com.todesktop.230313mzl4w4u92',
                'window_title': 'Cursor',
                'shortcuts': {
                    'command_palette': ['cmd', 'shift', 'p'] if self.system == "Darwin" else ['ctrl', 'shift', 'p'],
                    'open_file': ['cmd', 'o'] if self.system == "Darwin" else ['ctrl', 'o'],
                }
            }
        }
        
    def open_app(self, app_name: str) -> bool:
        """Open an application"""
        app_config = self.app_configs.get(app_name.lower())
        if not app_config:
            return False
            
        try:
            if self.system == "Darwin":  # macOS
                subprocess.run(['open', '-a', app_config['name']])
            elif self.system == "Windows":
                subprocess.run(['start', app_config['name']], shell=True)
            else:  # Linux
                subprocess.run([app_config['name'].lower()])
            
            time.sleep(2)  # Wait for app to open
            return True
        except Exception as e:
            print(f"Error opening {app_name}: {e}")
            return False
            
    def send_to_claude(self, message: str) -> Dict[str, Any]:
        """Send a message to Claude desktop app"""
        if not self.open_app('claude'):
            return {'error': 'Could not open Claude'}
            
        if USE_APPLESCRIPT:
            # Use AppleScript for more reliable automation on macOS
            script = f'''
            tell application "Claude"
                activate
                delay 1
            end tell
            
            tell application "System Events"
                tell process "Claude"
                    -- Start new chat
                    keystroke "n" using command down
                    delay 0.5
                    
                    -- Type message
                    keystroke "{message.replace('"', '\\"')}"
                    delay 0.5
                    
                    -- Send message
                    key code 36  -- Enter key
                end tell
            end tell
            '''
            
            try:
                result = applescript.run(script)
                return {'status': 'sent', 'method': 'applescript'}
            except Exception as e:
                return {'error': str(e), 'method': 'applescript'}
                
        elif HAS_PYAUTOGUI:
            # Fallback to pyautogui
            try:
                # New chat
                pyautogui.hotkey(*self.app_configs['claude']['shortcuts']['new_chat'])
                time.sleep(0.5)
                
                # Type message
                pyautogui.typewrite(message)
                time.sleep(0.5)
                
                # Send
                pyautogui.press('enter')
                
                return {'status': 'sent', 'method': 'pyautogui'}
            except Exception as e:
                return {'error': str(e), 'method': 'pyautogui'}
        else:
            return {'error': 'No automation method available'}
            
    def send_to_chatgpt(self, message: str) -> Dict[str, Any]:
        """Send a message to ChatGPT desktop app"""
        if not self.open_app('chatgpt'):
            return {'error': 'Could not open ChatGPT'}
            
        if USE_APPLESCRIPT:
            script = f'''
            tell application "ChatGPT"
                activate
                delay 1
            end tell
            
            tell application "System Events"
                tell process "ChatGPT"
                    -- Start new chat
                    keystroke "n" using command down
                    delay 0.5
                    
                    -- Type message
                    keystroke "{message.replace('"', '\\"')}"
                    delay 0.5
                    
                    -- Send message
                    key code 36  -- Enter key
                end tell
            end tell
            '''
            
            try:
                result = applescript.run(script)
                return {'status': 'sent', 'method': 'applescript'}
            except Exception as e:
                return {'error': str(e), 'method': 'applescript'}
                
        elif HAS_PYAUTOGUI:
            try:
                # New chat
                pyautogui.hotkey(*self.app_configs['chatgpt']['shortcuts']['new_chat'])
                time.sleep(0.5)
                
                # Type message
                pyautogui.typewrite(message)
                time.sleep(0.5)
                
                # Send
                pyautogui.press('enter')
                
                return {'status': 'sent', 'method': 'pyautogui'}
            except Exception as e:
                return {'error': str(e), 'method': 'pyautogui'}
        else:
            return {'error': 'No automation method available'}
            
    def open_in_cursor(self, file_path: str) -> Dict[str, Any]:
        """Open a file in Cursor IDE"""
        try:
            # Try command line first
            subprocess.run(['cursor', file_path])
            return {'status': 'opened', 'method': 'cli'}
        except:
            # Try opening app then file
            if not self.open_app('cursor'):
                return {'error': 'Could not open Cursor'}
                
            if USE_APPLESCRIPT:
                script = f'''
                tell application "Cursor"
                    activate
                    delay 1
                end tell
                
                tell application "System Events"
                    tell process "Cursor"
                        -- Open file dialog
                        keystroke "o" using command down
                        delay 1
                        
                        -- Type file path
                        keystroke "{file_path}"
                        delay 0.5
                        
                        -- Confirm
                        key code 36  -- Enter
                    end tell
                end tell
                '''
                
                try:
                    applescript.run(script)
                    return {'status': 'opened', 'method': 'applescript'}
                except Exception as e:
                    return {'error': str(e), 'method': 'applescript'}
                    
            elif HAS_PYAUTOGUI:
                try:
                    # Open file dialog
                    pyautogui.hotkey(*self.app_configs['cursor']['shortcuts']['open_file'])
                    time.sleep(1)
                    
                    # Type path
                    pyautogui.typewrite(file_path)
                    time.sleep(0.5)
                    
                    # Confirm
                    pyautogui.press('enter')
                    
                    return {'status': 'opened', 'method': 'pyautogui'}
                except Exception as e:
                    return {'error': str(e), 'method': 'pyautogui'}
            else:
                return {'error': 'No automation method available'}
                
    def get_response_from_claude(self, wait_time: int = 10) -> Optional[str]:
        """Try to capture response from Claude (experimental)"""
        if not HAS_PYAUTOGUI:
            return None
            
        try:
            # Wait for response
            time.sleep(wait_time)
            
            # Try to select all and copy
            if self.system == "Darwin":
                pyautogui.hotkey('cmd', 'a')
                time.sleep(0.5)
                pyautogui.hotkey('cmd', 'c')
            else:
                pyautogui.hotkey('ctrl', 'a')
                time.sleep(0.5)
                pyautogui.hotkey('ctrl', 'c')
                
            # Get from clipboard (requires pyperclip)
            try:
                import pyperclip
                return pyperclip.paste()
            except:
                return None
                
        except Exception as e:
            print(f"Error getting response: {e}")
            return None
            
    def run_claude_cli(self, command: str) -> Dict[str, Any]:
        """Run Claude CLI command"""
        try:
            result = subprocess.run(
                ['claude'] + command.split(),
                capture_output=True,
                text=True,
                timeout=30
            )
            
            return {
                'stdout': result.stdout,
                'stderr': result.stderr,
                'returncode': result.returncode,
                'status': 'completed'
            }
        except subprocess.TimeoutExpired:
            return {'error': 'Command timed out', 'status': 'timeout'}
        except Exception as e:
            return {'error': str(e), 'status': 'failed'}

class UnifiedDesktopConnector:
    """Unified interface for all desktop automation"""
    
    def __init__(self):
        self.automation = DesktopAutomation()
        self.last_responses = {}
        
    def send_to_ai(self, ai_name: str, message: str) -> Dict[str, Any]:
        """Send message to any AI"""
        ai_map = {
            'claude': self.automation.send_to_claude,
            'chatgpt': self.automation.send_to_chatgpt,
            'claude_cli': lambda m: self.automation.run_claude_cli(f'chat "{m}"')
        }
        
        handler = ai_map.get(ai_name.lower())
        if handler:
            result = handler(message)
            
            # Try to capture response if desktop app
            if ai_name.lower() in ['claude', 'chatgpt'] and result.get('status') == 'sent':
                response = self.automation.get_response_from_claude()
                if response:
                    result['response'] = response
                    self.last_responses[ai_name] = response
                    
            return result
        else:
            return {'error': f'Unknown AI: {ai_name}'}
            
    def open_file(self, editor: str, file_path: str) -> Dict[str, Any]:
        """Open file in editor"""
        if editor.lower() == 'cursor':
            return self.automation.open_in_cursor(file_path)
        else:
            return {'error': f'Unknown editor: {editor}'}
            
    def get_capabilities(self) -> Dict[str, Any]:
        """Get available capabilities"""
        return {
            'system': self.automation.system,
            'has_applescript': USE_APPLESCRIPT,
            'has_pyautogui': HAS_PYAUTOGUI,
            'available_apps': list(self.automation.app_configs.keys()),
            'features': {
                'send_to_claude': True,
                'send_to_chatgpt': True,
                'open_in_cursor': True,
                'claude_cli': subprocess.run(['which', 'claude'], capture_output=True).returncode == 0,
                'capture_responses': HAS_PYAUTOGUI and subprocess.run(['pip', 'show', 'pyperclip'], capture_output=True).returncode == 0
            }
        }

# Quick test
if __name__ == "__main__":
    connector = UnifiedDesktopConnector()
    
    print("🔍 Desktop Automation Capabilities:")
    print(json.dumps(connector.get_capabilities(), indent=2))
    
    # Test sending to Claude
    print("\n📝 Testing Claude automation...")
    result = connector.send_to_ai('claude', 'Hello Claude, this is an automated test!')
    print(f"Result: {result}")
    
    # Test CLI
    print("\n💻 Testing Claude CLI...")
    cli_result = connector.automation.run_claude_cli('--version')
    print(f"CLI Result: {cli_result}")