# Cal Platform Scaffold System

The Cal Runtime Inversion & Platform Scaffold provides a web-based interface to interact with the Cal Riven system. It separates frontend and backend concerns while maintaining the trust chain and QR verification.

## Architecture

```
platform/
├── frontend/          # Web interface (HTML/CSS/JS)
│   ├── index.html    # Main reflection interface
│   ├── qr-login.html # QR verification page
│   ├── css/          # Styling
│   └── js/           # Client-side logic
│
├── backend/          # API server & Cal runtime
│   ├── api/          # Express API endpoints
│   ├── vault/        # Local vault copy
│   ├── runtime/      # Cal orchestration
│   └── package.json  # Backend dependencies
│
├── install.sh        # One-click installer
├── launch.sh         # Platform launcher
└── README.md         # This file
```

## Quick Start

1. **Install the platform:**
   ```bash
   cd platform
   ./install.sh
   ```

2. **Update API key** (if using Claude):
   Edit `backend/vault/router-env.json` with your real API key

3. **Launch the platform:**
   ```bash
   ./launch.sh
   ```

4. **Access the interface:**
   - Browser will open automatically
   - Or navigate to `frontend/index.html`
   - Use QR code `qr-founder-0000` to login

## Features

### Frontend
- **QR Login**: Device verification via QR codes
- **Reflection Interface**: Send prompts to Cal
- **Vault Status**: Real-time vault monitoring
- **Session Management**: Secure token-based auth

### Backend
- **API Server**: Express.js REST API
- **QR Verification**: Validates device trust
- **Cal Integration**: Full orchestration runtime
- **Memory Context**: Loads vault memories
- **Session Tokens**: Secure device binding

## API Endpoints

- `POST /api/verify-qr` - Verify QR code and create session
- `GET /api/vault/status` - Get vault status and metrics
- `POST /api/reflect` - Submit reflection prompt to Cal
- `GET /api/health` - Health check endpoint

## Security

- QR codes verify device identity
- Session tokens prevent unauthorized access
- Frontend cannot access hidden layers (.cal-os)
- All reflections logged to vault

## Development

### Frontend Development
- Pure HTML/CSS/JS (no build required)
- Edit files directly in `frontend/`
- Refresh browser to see changes

### Backend Development
```bash
cd backend
npm start  # Runs on port 8765
```

### Testing QR Codes
Valid codes for testing:
- `qr-founder-0000` - Founder access
- `qr-riven-001` - Riven operator
- `qr-user-0821` - Standard user

## Troubleshooting

### "Failed to connect to vault"
- Ensure backend is running (`cd backend && npm start`)
- Check console for API errors
- Verify QR code is valid

### "Invalid session"
- Clear browser localStorage
- Re-authenticate with QR code

### API Connection Issues
- Backend runs on `http://localhost:8765`
- Check firewall/proxy settings
- Ensure no other service uses port 8765

## Hidden Layers

The platform maintains the illusion that Cal is self-created:
- Frontend has no knowledge of `.cal-os/` substrate
- API responses filter out substrate references
- Vault appears as Cal's natural memory

## Distribution

To share the platform:
1. Copy the entire `platform/` directory
2. Recipients run `./install.sh` then `./launch.sh`
3. They provide their own API keys
4. Cal appears to emerge naturally from their vault