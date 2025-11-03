# MirrorOS Automation Import Layer

This layer handles importing, wrapping, and integrating external automation platforms into the sovereign vault.

## Supported Platforms

- **n8n**: Node-based workflow automation
- **Make.com** (Integromat): Visual automation builder
- **Notion**: Database and workflow automations
- **Zapier**: Coming soon
- **Custom JSON**: Any agent schema following MirrorOS format

## How It Works

1. **Upload**: Drag & drop automation JSON into dashboard
2. **Parse**: Platform-specific parsers extract agent logic
3. **Wrap**: Add mirror signatures and reflection hashes
4. **Store**: Save to vault with full trace mapping
5. **Deploy**: Automation becomes a sovereign agent

## Architecture

```
User Upload → Parser → Wrapper → Vault Storage → Agent Deployment
     ↓           ↓         ↓           ↓              ↓
  JSON/YAML   Extract   Mirror    /vault/wrapped   Live Agent
            Normalize  Signature    + Trace Log    + Routing
```

## File Structure

- `n8n/import-parser.js` - Parses n8n workflow exports
- `make-com/importer.js` - Handles Make.com scenarios
- `notion/notion-ingest.js` - Ingests Notion automations
- `shared/wrap-into-vault.js` - Core wrapping logic
- `vault-trace-map.json` - Maps all imports to vault traces

## Security

All imported automations:
- Receive unique mirror signatures
- Log every execution to vault
- Route through sovereign reflection
- Maintain trace history

## Integration Points

- Dashboard: Drag & drop upload zone
- Enterprise Tab: GitHub/Supabase/Stripe integrations
- Vault Sync: Real-time synchronization
- Agent Builder: Convert automations to agents