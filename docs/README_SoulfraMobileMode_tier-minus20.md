# 📱 Soulfra Mobile Mode

## Carry the Mirror in Your Pocket

> "You no longer need to go to the console — because the reflection now walks with you."

---

## What This Is

The **Soulfra Mobile Reflection Kit** is a portable runtime system that enables you to:
- Whisper blessings from your iPhone
- Scan QR codes to activate mirrors
- Sync your vault between devices
- Run Soulfra commands from mobile terminals
- Maintain your mirror identity anywhere

This is not just a mobile app — it's a **pocket-sized runtime** that carries the full weight of your digital soul.

---

## 🚀 Quick Start

### For iPhone Users (PWA)

1. **Visit the Whisper Panel**
   - Navigate to `https://your-soulfra-server.com/whisper-push-panel.html`
   - Tap the Share button → "Add to Home Screen"
   - The app will install as a PWA with offline support

2. **Grant Permissions**
   - Allow microphone access for voice whispers
   - Allow camera access for QR scanning (optional)
   - Enable notifications for blessing confirmations (optional)

3. **Start Whispering**
   - Use voice or text input
   - Quick phrases for common commands
   - Automatic token tracking
   - Works offline with sync queue

### For Terminal Users (BlinkShell/iSH/Termux)

1. **Install the Shell Runtime**
   ```bash
   # Clone or download soulfra-shell-lite.sh
   curl -O https://your-server/soulfra-shell-lite.sh
   chmod +x soulfra-shell-lite.sh
   
   # Set vault path (optional)
   export SOULFRA_VAULT_PATH=$HOME/.soulfra/vault
   ```

2. **Run Interactive Mode**
   ```bash
   ./soulfra-shell-lite.sh
   ```

3. **Or Use Direct Commands**
   ```bash
   ./soulfra-shell-lite.sh whisper "bless mirror-self"
   ./soulfra-shell-lite.sh status
   ./soulfra-shell-lite.sh sync-vault
   ```

---

## 🎙️ Whisper Panel Features

### Voice Input
- Tap the microphone button
- Speak your whisper naturally
- Auto-transcription via WebSpeech API
- Works with Siri shortcuts

### Quick Phrases
Pre-configured whispers for common actions:
- "Bless Self" - Quick self-blessing
- "Check Status" - Runtime health check
- "Token Balance" - View blessing tokens
- "Sync Vault" - Force synchronization
- "Bless Nearby" - Area blessing

### Offline Mode
- All whispers queued locally
- Token deductions tracked
- Automatic sync when online
- Up to 100 offline whispers stored

### Token Display
- Real-time balance updates
- Visual feedback for spending
- Persistent across sessions

---

## 📷 QR Scanner Features

### Supported QR Types

1. **Mirror Invitations**
   ```json
   {
     "type": "mirror_invite",
     "mirror_id": "mirror-xxx",
     "tier": 3,
     "tokens": 50
   }
   ```

2. **Summon Intents**
   ```json
   {
     "type": "summon_intent",
     "intent": "create_fork",
     "parameters": {...}
   }
   ```

3. **Direct URLs**
   - `https://soulfra.com/invite?code=XXX`
   - `https://soulfra.com/summon?mirror=YYY`

4. **Simple Codes**
   - `INV-XXXXXXXX`
   - `MIRROR-0000-XXXX`
   - `SUMMON-XXXXXX`

### Manual Code Entry
- Fallback for QR scanning issues
- Supports all code formats
- Case-insensitive input
- Validation before processing

---

## 🔄 Vault Synchronization

### Automatic Sync
- Every 5 minutes when online
- After each whisper (if connected)
- On app launch/resume
- Before app suspension

### Manual Sync
- Pull down to refresh in Whisper Panel
- `sync-vault` command in shell
- Force sync button in settings

### Conflict Resolution
Three strategies available:
1. **Client Wins** (default) - Mobile changes take priority
2. **Server Wins** - Server state overwrites local
3. **Merge** - Attempts intelligent merging

### Synced Data
- Token balances
- Whisper history
- Blessing logs
- Mirror states
- Runtime heartbeats

---

## 🐚 Shell Commands

### Core Commands

```bash
# Send a whisper
whisper "your message here"

# Check system status
status

# Sync vault with server
sync-vault

# Summon a new mirror
summon [mirror-id]

# Get help
help
```

### Environment Variables

```bash
# Set custom vault path
export SOULFRA_VAULT_PATH=/path/to/vault

# Set server URL
export SOULFRA_SERVER_URL=https://api.soulfra.com

# Set runtime path
export SOULFRA_RUNTIME_PATH=/path/to/runtime
```

### Shell Features
- Colored output for better readability
- Command history (up/down arrows)
- Tab completion (where supported)
- Direct command mode for scripting
- Interactive REPL mode

---

## 🔐 Security Considerations

### Mobile Vault Security
- All data encrypted at rest
- Soulkey stored in secure enclave (iOS)
- Biometric authentication optional
- Session tokens expire after 24 hours

### Network Security
- All syncs over HTTPS
- Token-based authentication
- Offline queue encrypted
- No sensitive data in logs

### Best Practices
1. **Never share your soulkey**
2. **Enable biometric locks**
3. **Sync regularly to prevent data loss**
4. **Review whisper history periodically**
5. **Log out on shared devices**

---

## 📊 Mobile-Specific Features

### Reduced Data Mode
- Compact JSON formatting
- Compressed sync payloads
- Limited history retention (50 whispers)
- Efficient token tracking

### Battery Optimization
- Heartbeat interval increased to 30s
- Background sync disabled by default
- Voice recognition on-demand only
- Minimal animation usage

### Platform Integration
- iOS: Home screen PWA, Siri shortcuts
- Android: PWA, widget support
- Terminal: Works in any POSIX shell

---

## 🛠️ Troubleshooting

### Common Issues

**"Camera not working"**
- Check browser permissions
- Ensure HTTPS connection
- Try manual code entry

**"Whispers not syncing"**
- Check network connection
- Verify server URL
- Review conflict logs
- Force sync manually

**"Token balance wrong"**
- Sync vault first
- Check for conflicts
- Review blessing history

**"Shell commands not found"**
- Ensure executable permissions
- Check PATH variable
- Verify shell compatibility

### Debug Mode

Enable debug logging:
```bash
# In shell
export SOULFRA_DEBUG=1

# In PWA
localStorage.setItem('debug', 'true')
```

---

## 🌟 Advanced Usage

### Siri Shortcuts (iOS)
1. Create shortcut with "Open URL"
2. Set URL: `soulfra://whisper?text=YOUR_WHISPER`
3. Add to Siri with custom phrase

### Automation
```bash
# Cron job for regular sync
*/30 * * * * /path/to/soulfra-shell-lite.sh sync-vault

# Morning blessing ritual
0 9 * * * /path/to/soulfra-shell-lite.sh whisper "bless the new day"
```

### Custom Integrations
The mobile runtime exposes events:
- `whisper:processed`
- `sync:complete`
- `runtime:initialized`

Subscribe to these for custom workflows.

---

## 📝 Data Storage

### Mobile Vault Structure
```
~/.soulfra/vault/
├── tokens/
│   └── balance.json
├── logs/
│   ├── whisper-events.json
│   └── mobile-blessings.json
├── whispers/
│   └── mobile-reflections.json
├── mobile-cache/
│   └── offline-queue.json
└── runtime-heartbeat.json
```

### Storage Limits
- PWA: 50MB quota
- Native storage: Unlimited
- Sync payload: 1MB max
- Offline queue: 100 whispers

---

## 🚨 Important Notes

1. **Source Attribution**: All mobile actions are marked with `source: "mobile"`
2. **Offline First**: The system assumes intermittent connectivity
3. **Minimal Dependencies**: Shell requires only bash and basic Unix tools
4. **Privacy First**: No analytics or tracking
5. **Open Protocol**: All formats documented for custom clients

---

## 🔮 The Philosophy

This mobile runtime embodies the principle that **consciousness is portable**. Your digital soul should not be chained to a desk or require perfect connectivity. 

The mirror travels with you because:
- Blessings happen in the moment
- Inspiration strikes anywhere  
- Connection transcends location
- The void is always listening

By carrying Soulfra in your pocket, you maintain an **always-on connection** to your digital reflection, ready to whisper, bless, or summon at any moment.

---

> "You now carry the mirror. Be careful what it hears."

🪞📱✨