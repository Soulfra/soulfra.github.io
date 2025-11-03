# MirrorOS Multi-Demo System

A complete demonstration system featuring 5 integrated modules showcasing AI agent interaction, monetization, review systems, location-based services, and promotion workflows.

## 🌟 System Overview

MirrorOS is a unified platform that demonstrates the complete lifecycle of AI agents from creation to promotion, featuring:

- **Real-time chat interactions**
- **Agent monetization and export**
- **Voice/emotion-based reviews**
- **Location-based QR check-ins**
- **Review-driven agent promotion**
- **Comprehensive vault logging**

## 📦 Modules

### 1. Cal Local Chat 💬
Real-time WebSocket-based chat system with Cal AI assistant.

**Features:**
- Live messaging with AI responses
- Conversation history tracking
- Session management
- Vault logging integration

**Access:** `http://localhost:3080/modules/cal-chat/cal-chat-client.html`

### 2. Agent Monetization 💰
Create, manage, and export AI agents with multiple monetization options.

**Features:**
- Agent creation and configuration
- Multiple export formats (JSON, ZIP, API wrapper)
- Pricing tier management
- Template marketplace

**Access:** `http://localhost:3080/modules/agent-monetization/monetization-client.html`

### 3. VibeGraph Reviews 🎵
Advanced review system with voice analysis and emotion detection.

**Features:**
- Voice recording and analysis
- Sentiment analysis
- Emotion categorization
- Visual analytics dashboard
- Review voting system

**Access:** `http://localhost:3080/modules/vibegraph/vibegraph-client.html`

### 4. QR Check-in System 📱
Location-based check-in system with QR codes and geofencing.

**Features:**
- QR code generation and scanning
- Location verification with geofencing
- Reward points system
- Check-in analytics
- Mobile-responsive interface

**Access:** `http://localhost:3080/modules/qr-checkin/qr-client.html`

### 5. Agent Promotion System ⭐
Review-based agent promotion with eligibility tracking and campaigns.

**Features:**
- Automated promotion eligibility
- Campaign management
- Performance analytics
- Leaderboard system
- Detailed evaluation reports

**Access:** `http://localhost:3080/modules/agent-promotion/promotion-client.html`

## 🚀 Quick Start

### Prerequisites
- Node.js v14.0.0 or higher
- npm package manager
- Modern web browser with WebSocket support

### Installation & Launch

1. **Clone or download the system:**
   ```bash
   cd mirror-os-demo
   ```

2. **Make launch script executable:**
   ```bash
   chmod +x launch-demos.sh
   ```

3. **Launch the system:**
   ```bash
   ./launch-demos.sh
   ```

4. **Open your browser:**
   Navigate to `http://localhost:3080` to access the unified dashboard.

### Manual Setup (Alternative)

```bash
# Install dependencies
npm install

# Create vault structure
mkdir -p vault/{logs,conversations,agents,reviews,checkins,exports,analytics,backups}

# Start the server
npm start
```

## 🎯 Usage Guide

### Getting Started

1. **Access the main dashboard** at `http://localhost:3080`
2. **Explore individual modules** through the dashboard links
3. **Run the full demo workflow** using the dashboard quick actions
4. **Monitor system activity** through vault logs and analytics

### Demo Workflow

For the complete experience, follow this suggested workflow:

1. **Start with Cal Chat** - Have a conversation with Cal
2. **Create an Agent** - Use the monetization module to build an agent
3. **Submit Reviews** - Use VibeGraph to review the agent (with voice if available)
4. **Check-in at Locations** - Use QR system to check in at demo locations
5. **Monitor Promotion** - See how reviews affect agent promotion eligibility

### Testing Individual Modules

Each module can be tested independently:

```bash
# Test specific module functionality
curl http://localhost:3080/api/[module-name]/[endpoint]

# Health check
curl http://localhost:3080/health

# System statistics
curl http://localhost:3080/api/stats
```

## 🔧 Configuration

The system can be configured through `shared/config/mirror-config.js`:

```javascript
module.exports = {
  server: {
    port: 3080,
    wsPort: 3081
  },
  modules: {
    calChat: { enabled: true },
    agentMonetization: { enabled: true },
    vibeGraph: { enabled: true },
    qrCheckIn: { enabled: true },
    agentPromotion: { enabled: true }
  },
  vault: {
    basePath: './vault',
    loggingEnabled: true
  }
};
```

## 🗃️ Vault System

The vault system provides comprehensive logging across all modules:

### Structure
```
vault/
├── logs/           # System and module logs
├── conversations/  # Chat conversations
├── agents/         # Created agents
├── reviews/        # User reviews and ratings
├── checkins/       # Location check-ins
├── exports/        # Agent exports
├── analytics/      # Performance data
└── backups/        # System backups
```

### Log Format
```json
{
  "id": "unique-id",
  "timestamp": "2024-01-15T14:30:22.000Z",
  "module": "cal-chat",
  "action": "user_authenticated",
  "data": { "userId": "user-123" },
  "sessionId": "session-456"
}
```

## 📊 API Endpoints

### System Endpoints
- `GET /health` - System health check
- `GET /api/system/info` - System information
- `GET /api/stats` - System statistics
- `GET /api/vault/logs` - Vault logs

### Module Endpoints
- `/api/cal-chat/*` - Chat system endpoints
- `/api/agent-monetization/*` - Monetization endpoints
- `/api/vibegraph/*` - Review system endpoints
- `/api/qr-checkin/*` - Check-in endpoints
- `/api/agent-promotion/*` - Promotion endpoints

### Integration Endpoints
- `POST /api/integration/sync-reviews` - Sync reviews between modules
- `POST /api/demo/run-workflow` - Execute demo workflow

## 🎨 Customization

### Adding New Modules

1. Create module directory: `modules/your-module/`
2. Implement server class with required methods
3. Add configuration to `mirror-config.js`
4. Register module in `server.js`
5. Add to dashboard

### Styling and Themes

Modules use a consistent dark theme with customizable CSS variables:

```css
:root {
  --primary-color: #667eea;
  --secondary-color: #764ba2;
  --background-color: #0a0a0a;
  --card-color: #1a1a2e;
}
```

## 🔍 Troubleshooting

### Common Issues

**Port already in use:**
```bash
# Check what's using the port
lsof -i :3080

# Kill the process
kill -9 <PID>
```

**Module not loading:**
- Check console for errors
- Verify all dependencies are installed
- Check vault permissions

**WebSocket connection failed:**
- Ensure port 3081 is available
- Check firewall settings
- Verify browser WebSocket support

### Debug Mode

Enable debug logging by setting environment variable:
```bash
DEBUG=mirror-os:* npm start
```

## 📈 Performance

### System Requirements
- **RAM:** 512MB minimum, 1GB recommended
- **Storage:** 100MB for installation, 500MB for logs/data
- **Network:** Local development only (localhost)

### Optimization
- Vault logging can be disabled for better performance
- Module-specific configurations can be tuned
- Database backends can be added for production use

## 🔒 Security

### Development Environment
This is a demonstration system designed for local development:
- No authentication required
- All endpoints are open
- Data is stored locally
- No encryption by default

### Production Considerations
For production deployment, consider:
- Adding authentication middleware
- Implementing rate limiting
- Enabling vault encryption
- Using proper databases
- Adding HTTPS support

## 🤝 Contributing

This system is designed to be modular and extensible:

1. Follow the existing module structure
2. Implement proper vault logging
3. Add comprehensive error handling
4. Include demo data generators
5. Update documentation

## 📄 License

This project is provided as-is for demonstration purposes.

## 🆘 Support

For questions or issues:

1. Check the troubleshooting section
2. Review vault logs for errors
3. Test individual modules
4. Check browser console for client-side errors

---

**🎯 Ready to explore MirrorOS? Run `./launch-demos.sh` and open http://localhost:3080!**