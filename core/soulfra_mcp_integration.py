#!/usr/bin/env python3
"""
SOULFRA MCP Integration Module
Connects existing SOULFRA services to the MCP server
"""

from mcp_client import SyncMCPClient
import logging

class SOULFRAMCPIntegration:
    """Integration layer between SOULFRA and MCP"""
    
    def __init__(self):
        self.mcp = SyncMCPClient()
        self.logger = logging.getLogger("SOULFRA-MCP")
        
    def connect(self):
        """Connect to MCP server"""
        if self.mcp.connect():
            self.logger.info("Connected to MCP server")
            return True
        else:
            self.logger.error("Failed to connect to MCP server")
            return False
    
    def search(self, query):
        """Search using MCP's unified search"""
        response = self.mcp.search_semantic(query)
        if response.error:
            self.logger.error(f"Search error: {response.error}")
            return []
        return response.data
    
    def spawn_agent(self, agent_type, config=None):
        """Spawn an agent through MCP"""
        response = self.mcp.spawn_agent(agent_type, config)
        if response.error:
            self.logger.error(f"Agent spawn error: {response.error}")
            return None
        return response.data
    
    def validate_code(self, file_path):
        """Validate code against SOULFRA rules"""
        response = self.mcp.validate_rules(file_path)
        if response.error:
            self.logger.error(f"Validation error: {response.error}")
            return []
        return response.data

# Global instance
mcp_integration = SOULFRAMCPIntegration()