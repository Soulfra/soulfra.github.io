# 📚 SOULFRA Rules Meta-Category

This directory contains all rules and guidelines for the SOULFRA platform.

## Structure

```
.rules/
├── README.md              # This file
├── MASTER_RULES.md        # Core principles (from SOULFRA_RULES.md)
├── orchestrator/          # 🎭 Automated rules enforcement system
│   ├── RulesOrchestrator.js    # Main orchestration engine
│   ├── FileSystemWatcher.js    # Monitors file changes
│   ├── RulesEnforcer.js        # Enforces rules
│   ├── TemplateGenerator.js    # Generates required files
│   ├── ValidationDaemon.js     # Continuous validation
│   └── launch-orchestrator.sh  # Launch script
├── development/           # Development rules
│   ├── local.rules        # Local development setup
│   ├── claude.rules       # Claude AI assistant rules
│   ├── cursor.rules       # Cursor IDE rules
│   └── team.rules         # Team collaboration rules
├── architecture/          # Architecture & structure rules
│   ├── codebase.rules     # Codebase organization
│   └── file_organization.rules  # File structure rules
├── deployment/            # Production & deployment rules
│   └── production.rules   # Production deployment rules
├── security/              # Security rules
├── monitoring/            # Monitoring & logging rules
└── templates/             # File templates
```

## Quick Reference

### Core Principles
1. **NO DUPLICATES** - Every feature exists in exactly ONE place
2. **WORKS FIRST TIME** - No "try this, then that" - it just works
3. **MOBILE FIRST** - If it doesn't work on mobile, it doesn't ship
4. **$1 TO START** - Keep the barrier to entry minimal
5. **AI FOR EVERYONE** - Not just tech people, everyone

### Most Important Rules
- **One launch script**: `./soulfra.sh`
- **One dependency file**: `requirements.txt`
- **One main file**: `src/main.py` (formerly SOULFRA_ULTIMATE_UNIFIED.py)
- **Standard port**: 9999
- **Maximum 3 levels deep** in file structure

## Reading Order
1. Start with `MASTER_RULES.md` for core principles
2. Read `development/local.rules` for setup
3. Check `architecture/codebase.rules` for structure
4. Review `deployment/production.rules` before deploying

## Automated Enforcement 🎭

### Rules Orchestrator
The SOULFRA Rules Orchestrator automatically enforces these rules:

```bash
# Start the orchestrator
cd .rules/orchestrator
./launch-orchestrator.sh

# Dry run mode (see what would change)
./launch-orchestrator.sh --dry-run

# Fast validation mode
./launch-orchestrator.sh --fast
```

The orchestrator will:
- Monitor all file/directory creation
- Generate required files automatically
- Validate naming conventions
- Check file sizes and structure
- Report violations to `.rules/violations.log`

### Manual Enforcement
These rules are also enforced through:
- Code reviews
- CI/CD pipelines
- Team culture

Remember: Rules exist to make development faster and more reliable, not to slow us down.