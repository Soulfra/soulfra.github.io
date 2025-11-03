# Mirror Kernel User Testing Kit

This testing kit contains everything needed to test the complete Soulfra Mirror system with real users.

## What's Included

### Core Testing Files
- `mirror-ui-shell.html` - Soft Mode interface for general users
- `mirror-ui-admin.html` - Platform Mode interface for enterprise users  
- `local-runner.js` - Local development server
- `test-qr-codes.json` - Valid QR codes for pairing tests
- `sample-voice-prompt.wav` - Example voice input file
- `agent-example.json` - Sample spawned agent data

### Backend Components
- `stripe-api-router.js` - Payment and API routing system
- `device-pairing-secure.js` - QR-based device pairing with geofencing
- `whisper-stub.js` - Voice processing integration stub

### Configuration
- `mode.json` - Soft/Platform mode configuration
- `stripe-config.json` - Payment plans and pricing
- `test-config.json` - Testing parameters and limits

## Quick Start

1. **Install Dependencies** (if needed)
   ```bash
   npm install express ws cors
   ```

2. **Start Local Runner**
   ```bash
   node local-runner.js
   ```
   
   This starts the Mirror system on `http://localhost:3333`

3. **Test User Flows**
   - **Soft Mode**: Open `http://localhost:3333` (default)
   - **Platform Mode**: Add `?mode=platform` to URL
   - **QR Pairing**: Use codes from `test-qr-codes.json`
   - **Voice Input**: Click the microphone button (requires HTTPS in production)

## Test Scenarios

### Scenario 1: New User (Soft Mode)
1. Visit `http://localhost:3333`
2. Try voice input: "I want to reflect on my day"
3. Navigate to different folders
4. Attempt an export (triggers $1.00 Stripe flow)
5. Pair a mobile device using QR code `qr-user-0821`

### Scenario 2: Enterprise User (Platform Mode)
1. Visit `http://localhost:3333?mode=platform`
2. Configure API keys in billing section
3. Test BYOK (Bring Your Own Key) functionality
4. View system logs and analytics
5. Perform bulk export operations

### Scenario 3: Mobile Pairing
1. Generate QR code from share interface
2. Scan with mobile device
3. Verify geofencing (location detection)
4. Test cross-device reflection sync

### Scenario 4: Stripe + Paywall Testing
1. Try to export without payment method
2. Complete Stripe checkout flow
3. Verify receipt generation
4. Test API call metering (Platform mode)

## API Testing

The system includes full API routing:

```bash
# Test API call routing
curl -X POST http://localhost:3333/api/route \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "test-agent-001",
    "apiType": "anthropic", 
    "userMode": "soft",
    "reflectionPrompt": "What does this mean?",
    "sessionId": "test-session"
  }'
```

## Voice Input Testing

1. **Browser Support**: Chrome/Edge recommended for voice recognition
2. **HTTPS Required**: Voice input requires secure context in production
3. **Test Phrases**: Use samples from `sample-voice-prompt.wav`
4. **Whisper Integration**: Stub implementation logs to console

## Stripe Testing

Use Stripe test cards:
- **Success**: `4242424242424242`
- **Decline**: `4000000000000002`
- **3D Secure**: `4000002500003155`

## Expected Behaviors

### Soft Mode Features
- ✅ Simple 3-folder structure
- ✅ One-click actions  
- ✅ $1.00 flat export pricing
- ✅ Voice-first interaction
- ✅ Automatic QR pairing
- ✅ Usage tracking for upgrades

### Platform Mode Features  
- ✅ Full system access (logs, forks, registry)
- ✅ API key configuration (BYOK)
- ✅ $0.01 per API call billing
- ✅ Advanced analytics dashboard
- ✅ Bulk export tools
- ✅ Real-time monitoring

### Device Pairing
- ✅ QR code generation with 15-minute expiry
- ✅ Location capture and geofencing (1km radius)
- ✅ Device fingerprinting for security
- ✅ Cross-device session sync
- ✅ Greeting: "You paired this mirror from {city}"

### Payment Integration
- ✅ Stripe webhook handling
- ✅ Receipt generation per export
- ✅ API usage metering
- ✅ Rate limiting (soft: 10/hr, platform: 1000/hr)
- ✅ BYOK cost savings tracking

## Troubleshooting

### Common Issues

1. **Voice not working**: Ensure HTTPS and microphone permissions
2. **QR pairing fails**: Check test codes in `test-qr-codes.json`
3. **Stripe errors**: Verify test keys in `stripe-config.json`
4. **Mode switching**: Clear localStorage between tests

### Debug Endpoints

- `/debug/sessions` - View active pairing sessions
- `/debug/usage` - Check API usage stats  
- `/debug/receipts` - List generated receipts
- `/debug/logs` - System event logs

### Log Locations

- Pairing events: `/vault/logs/pairing-events.json`
- API calls: `/vault/logs/api-events.json`
- Usage patterns: `/vault/logs/usage-patterns.json`
- Location data: `/vault/logs/location-fingerprint.json`

## Production Deployment

For production use:

1. **Replace Stubs**: Implement real Whisper API, geocoding service
2. **Stripe Live Keys**: Update to production Stripe keys
3. **HTTPS Required**: Voice input and secure pairing need SSL
4. **Environment Variables**: Move sensitive config to env vars
5. **Database**: Replace JSON files with proper database
6. **Monitoring**: Add proper error tracking and metrics

## Support

- Test any edge cases with the included scenarios
- All components are designed to fail gracefully
- Comprehensive logging helps debug issues
- Mobile-first responsive design tested on iOS/Android

Ready to test the complete Mirror Kernel experience! 🪞✨