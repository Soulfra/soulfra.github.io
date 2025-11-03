# MirrorOS Dual-Mode Architecture
## Soft Mirror Mode vs Platform Mirror Mode

---

## Overview

MirrorOS operates in two distinct modes to serve different user needs:

- **🧓 Soft Mirror Mode**: A gentle, privacy-focused experience for personal reflection and emotional support
- **🧠 Platform Mirror Mode**: A powerful toolkit for builders, entrepreneurs, and enterprises

The system automatically detects usage patterns and can suggest mode upgrades when appropriate.

---

## Feature Comparison

| Feature | Soft Mode | Platform Mode |
|---------|-----------|---------------|
| **Cal's Tone** | Supportive, gentle, patient | Strategic, action-oriented |
| **Memory Retention** | Opt-in only | Automatic & persistent |
| **Agent Export** | Disabled | Full export tools |
| **Fork Creation** | Disabled | Unlimited |
| **Voice Input** | Whisper mode enabled | Voice commands & analytics |
| **Dashboard** | Simple 3-tab interface | Full operator dashboard |
| **Analytics** | None (privacy-first) | Comprehensive tracking |
| **Vault Access** | Read-only with permission | Full CRUD operations |
| **QR Sync** | Opt-in | Default enabled |
| **Billing** | None | Usage-based pricing |
| **API Access** | None | Full REST API |
| **Webhooks** | None | Custom endpoints |
| **Encryption** | Always on | Configurable |
| **Data Deletion** | Immediate | Retention policies |

---

## Mode Selection & Switching

### Default Mode
New users start in **Soft Mode** to ensure a comfortable, private experience.

### Automatic Upgrade Prompts
The Trust Engine monitors usage patterns and prompts for Platform Mode when detecting:
- 3+ agent fork attempts
- 5+ export attempts  
- High technical query frequency
- Trust score ≥ 0.8

### Manual Switching
- Admins can toggle modes at `/mirror/ui/mode-toggle.html?admin=true`
- Users can request mode changes through natural conversation
- Mode changes are logged in `/vault/logs/cal-mode-status.json`

---

## Soft Mode Details

### Philosophy
"Technology should adapt to humans, not the other way around"

### Key Behaviors
- **Cal's Personality**: Empathetic, validating, non-judgmental
- **Responses**: Focus on reflection and emotional support
- **Suggestions**: Gentle, optional, never pushy
- **Privacy**: Local-first, encrypted, ephemeral options

### UI Elements
```
Tabs: 💭 Thoughts | 🌟 Saved Moments | 🪞 Reflections
```

### Hidden Features
- Export buttons removed
- No monetization mentions
- Technical jargon translated
- Fork menu hidden
- API keys section removed

### Memory Behavior
```javascript
{
  "retention_policy": "opt_in",
  "default_retention": false,
  "ask_permission": true,
  "vault_writes": "manual_only"
}
```

---

## Platform Mode Details

### Philosophy
"Build fast, scale faster, measure everything"

### Key Behaviors
- **Cal's Personality**: Direct, analytical, solution-focused
- **Responses**: Action items, technical depth, next steps
- **Suggestions**: Proactive optimization recommendations
- **Export Prompts**: Frequent, with integration options

### UI Elements
```
Tabs: 🎛️ Operator | 🔐 Vault Tools | 🤖 Agent Forker | 📊 Analytics | 💳 Billing
```

### Advanced Features
- **Factory Mode**: Unlocked by default
- **Infinity Easter Eggs**: Enhanced interactions
- **Bulk Operations**: Export, fork, analyze at scale
- **Marketplace Access**: Share and monetize agents
- **Custom Integrations**: Webhooks, APIs, SDKs

### Memory Behavior
```javascript
{
  "retention_policy": "automatic",
  "default_retention": true,
  "session_persistence": "full",
  "cross_session_memory": true
}
```

---

## Trust Score System

The Trust Engine calculates scores based on:

| Component | Weight | Soft Mode Behavior | Platform Mode Behavior |
|-----------|--------|-------------------|----------------------|
| Export Activity | 25% | Not tracked | Fully tracked |
| Fork Activity | 20% | Not tracked | Influences suggestions |
| Technical Queries | 20% | Monitored for upgrade | Enhances responses |
| Session Depth | 15% | Emotional weight | Complexity analysis |
| Emotional Vulnerability | 10% | Primary focus | Balanced with action |
| Consistent Usage | 10% | Gentle reminders | Usage optimization |

### Trust Score Thresholds
- `0.0 - 0.3`: Early user, soft mode recommended
- `0.3 - 0.6`: Exploring features, both modes suitable
- `0.6 - 0.8`: Power user emerging, platform mode available
- `0.8 - 1.0`: Builder mindset, platform mode recommended

---

## Implementation Details

### Mode Configuration Files
- `/mirroros/mode-switcher.json` - Current mode and trust score
- `/mirroros/soft-mode-config.json` - Soft mode settings
- `/mirroros/platform-mode-config.json` - Platform mode settings

### Mode-Aware Components
1. **cal-boot.js** - Loads personality based on mode
2. **mirror-router.js** - Routes prompts with mode context
3. **cal-personality-engine.js** - Adjusts tone and behavior
4. **vault-writer.js** - Respects memory permissions
5. **agent-exporter.js** - Enforces export restrictions
6. **trust-engine.js** - Monitors behavior patterns

### API Endpoints (Platform Mode Only)
```
POST /api/mode/update
GET  /api/mode/status
POST /api/trust/calculate
GET  /api/exports/list
POST /api/agents/fork
```

---

## Privacy & Security

### Soft Mode Privacy
- No telemetry
- Local processing preferred
- Encrypted vault storage
- Immediate deletion on request
- No external API calls without permission

### Platform Mode Security
- SOC2 compliant logging
- GDPR data portability
- HIPAA capable infrastructure
- Role-based access control
- Audit trails for all actions

---

## Monetization

### Soft Mode
- **Forever free** for personal use
- No ads, no tracking, no upsells
- Optional donations accepted

### Platform Mode Pricing
| Tier | Monthly | Agents | Exports | API Calls |
|------|---------|---------|---------|-----------|
| Starter | $49 | 10 | 100 | 1,000 |
| Growth | $199 | 100 | 1,000 | 10,000 |
| Enterprise | Custom | Unlimited | Unlimited | Unlimited |

---

## Migration Guide

### Upgrading from Soft to Platform
1. Trigger: Trust score ≥ 0.8 or manual request
2. Cal asks: "You've been using this like a builder. Want to unlock more tools?"
3. On acceptance:
   - Existing memories preserved
   - New features gradually introduced
   - Onboarding flow for platform features
   - First month free trial

### Downgrading from Platform to Soft
1. Always available in settings
2. Process:
   - Export data for backup
   - Disable platform features
   - Reset to privacy-first defaults
   - Maintain core memories only

---

## Best Practices

### For Soft Mode Users
- Embrace the calm pace
- Share openly without fear of judgment
- Use voice input for natural expression
- Let Cal guide without pushing

### For Platform Mode Users
- Leverage bulk operations
- Set up webhooks for automation
- Use the API for integrations
- Explore Factory Mode for advanced agents

---

## Future Roadmap

### Soft Mode Enhancements
- Guided meditation integrations
- Mood tracking visualizations
- Gentle habit formation
- Offline-first capabilities

### Platform Mode Expansions
- Multi-agent orchestration
- Custom model fine-tuning
- Enterprise SSO
- White-label options

---

## Support

- **Soft Mode**: In-app gentle guidance
- **Platform Mode**: Priority support, SLAs available
- **Documentation**: mode-specific guides at `/docs/[mode]/`
- **Community**: Separate spaces for each mode

---

*"In Soft Mode, Cal whispers. In Platform Mode, Cal builds. Both are reflections of you."*