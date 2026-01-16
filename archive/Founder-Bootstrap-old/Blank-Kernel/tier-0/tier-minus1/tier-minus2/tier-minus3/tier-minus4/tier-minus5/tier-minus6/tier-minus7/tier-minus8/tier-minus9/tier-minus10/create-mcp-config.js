// -*- coding: utf-8 -*-
const fs = require('fs');
const path = require('path');

// Create .mcp directory
const mcpDir = path.join(__dirname, '.mcp');
if (!fs.existsSync(mcpDir)) {
  fs.mkdirSync(mcpDir, { recursive: true });
  console.log('✓ Created .mcp directory');
} else {
  console.log('✓ .mcp directory already exists');
}

// MCP configuration
const config = {
  "name": "SOULFRA MCP Integration",
  "version": "1.0.0",
  "description": "Model Context Protocol server for unifying all SOULFRA services",
  "port": 8888,
  
  "capabilities": ["tools", "context", "memory"],
  
  "servers": {
    "soulfra-main": {
      "name": "SOULFRA Ultimate Unified",
      "url": "http://localhost:9999",
      "type": "http"
    },
    "cal-riven": {
      "name": "Cal Riven Trust Engine",
      "url": "http://localhost:4040",
      "type": "http"
    },
    "semantic-api": {
      "name": "Semantic Search API",
      "url": "http://localhost:3666",
      "type": "http"
    },
    "vector-db": {
      "name": "Vector Database",
      "url": "http://localhost:7891",
      "type": "websocket"
    },
    "rules-engine": {
      "name": "Rules Orchestrator",
      "url": "http://localhost:7788",
      "type": "http"
    },
    "mirror-bridge": {
      "name": "Mirror Bridge",
      "url": "http://localhost:8889",
      "type": "websocket"
    }
  },
  
  "tools": {
    "file": {
      "enabled": true,
      "operations": ["read", "write", "list", "search"]
    },
    "search": {
      "enabled": true,
      "types": ["semantic", "vector", "regex", "ast"]
    },
    "agent": {
      "enabled": true,
      "operations": ["spawn", "control", "query", "terminate"]
    },
    "rules": {
      "enabled": true,
      "operations": ["validate", "enforce", "report"]
    }
  },
  
  "context": {
    "codebase": {
      "enabled": true,
      "scan_on_start": true,
      "update_interval": 300
    },
    "services": {
      "enabled": true,
      "health_check_interval": 60
    },
    "rules": {
      "enabled": true,
      "path": ".rules/"
    }
  },
  
  "memory": {
    "enabled": true,
    "persist": true,
    "path": ".mcp/memory.json",
    "categories": ["conversations", "agent_states", "reflections"]
  }
};

// Write config file
const configPath = path.join(mcpDir, 'config.json');
fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
console.log('✓ Created .mcp/config.json');

// Create initial memory file
const memoryPath = path.join(mcpDir, 'memory.json');
if (!fs.existsSync(memoryPath)) {
  fs.writeFileSync(memoryPath, JSON.stringify({
    conversations: [],
    agent_states: {},
    reflections: [],
    created_at: new Date().toISOString()
  }, null, 2));
  console.log('✓ Created initial memory.json');
}

console.log('\nMCP configuration setup complete!');
console.log('Configuration written to:', configPath);