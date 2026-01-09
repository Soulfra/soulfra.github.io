# SOULFRA Network

Welcome to the SOULFRA Network - a multi-domain platform offering free subdomains and AI-powered development tools.

## Get Your Free Subdomain

Request a free subdomain under any of our network domains:
- **soulfra.com** - AI-powered development platform
- **calriven.com** - Technical excellence
- **deathtodata.com** - Privacy-first
- **cringeproof.com** - Authentic community

### How to Request

1. **Check Availability**: Visit the [letter availability chart](https://soulfra.github.io/waitlist/)
2. **Fork This Repo**: Create your own fork
3. **Create JSON File**: Add `domains/your-username.json` with your details
4. **Submit PR**: We'll auto-validate and merge within minutes

See the [Domain Registration Guide](domains/README.md) for detailed instructions.

### Example

```json
{
  "owner": "alice",
  "email": "alice@example.com",
  "subdomain": "alice",
  "domain": "soulfra",
  "letter": "A",
  "target": "alice.github.io",
  "record_type": "CNAME"
}
```

**Result**: `alice.soulfra.com` → `alice.github.io` with free SSL

---

## Platform Overview

This is the consolidated and flattened version of the SOULFRA platform, reduced from 11 tier levels to a simple 2-level structure.

## Directory Structure

- `domains/` - Community subdomain registrations (submit PR to add yours!)
- `waitlist/` - Letter availability chart and signup stats
- `core/` - Main platform implementations
- `infrastructure/` - Trust chain, QR validation, authentication
- `agents/` - Agent systems and AI components
- `daemons/` - Background daemon processes
- `interfaces/` - User interfaces and dashboards
- `bridges/` - Integration bridges and connectors
- `games/` - Game implementations
- `docs/` - Documentation and guides
- `scripts/` - Shell scripts and launchers
- `config/` - Configuration files
- `tier-reference/` - Original tier structure for critical files
- `logs/` - Runtime logs
- `data/` - Runtime data

## Quick Start

1. Initialize trust chain (if needed):
   ```bash
   cd infrastructure
   ./pair-code.sh  # Interactive QR pairing
   ```

2. Launch the platform:
   ```bash
   ./scripts/launch-soulfra.sh
   ```

3. Stop all services:
   ```bash
   ./scripts/stop-soulfra.sh
   ```

## Consolidation Statistics

- Original tier depth: 11
- Total files consolidated: 12508
- Duplicate files removed: 2579
- Files by category:
  - games: 34
  - misc: 8519
  - docs: 1943
  - scripts: 305
  - config: 1394
  - agents: 78
  - core: 65
  - infrastructure: 60
  - interfaces: 68
  - bridges: 13
  - daemons: 29


## Service Ports

- AI Economy: 9999
- Chat Processor: 8888  
- Soulfra Monitor: 7777
- Cal Riven CLI: 4040
- Simple Game: 5555
- Max Autonomous: 6004

## Trust Chain

The trust chain is preserved in the `infrastructure/` directory. Key files:
- `blessing.json` - Agent blessing status
- `soul-chain.sig` - Cryptographic trust anchor
- `mirror-trace-token.json` - Session tokens

For detailed migration information, see `consolidation-report.json`.
