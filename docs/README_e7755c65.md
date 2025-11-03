# 🎭 SOULFRA Rules Orchestrator

Automated enforcement system for SOULFRA development rules. Monitors file system changes and ensures all code follows established patterns.

## Components

### 1. **RulesOrchestrator** (Main Controller)
- Coordinates all enforcement activities
- Manages file system monitoring and validation
- Generates required files for new directories
- Reports violations and statistics

### 2. **FileSystemWatcher**
- Monitors file system for changes
- Detects new files and directories
- Emits events for orchestrator to handle
- Ignores system/build directories

### 3. **RulesEnforcer**
- Checks naming conventions
- Validates file structure
- Enforces code style rules
- Can auto-fix certain violations

### 4. **TemplateGenerator**
- Creates required files for directories
- Generates consistent boilerplate
- Maintains project structure
- Creates local rules files

### 5. **ValidationDaemon**
- Runs periodic validation checks
- Generates violation reports
- Tracks trends and improvements
- Logs all issues found

## Quick Start

```bash
# Start the orchestrator
./launch-orchestrator.sh

# Dry run mode (no changes)
./launch-orchestrator.sh --dry-run

# Fast validation (10s intervals)
./launch-orchestrator.sh --fast

# Watch only mode
./launch-orchestrator.sh --watch-only

# Validation only mode
./launch-orchestrator.sh --validate-only
```

## How It Works

1. **Directory Creation**: When you create a new directory, the orchestrator:
   - Validates the directory name
   - Generates required files (README, index, etc.)
   - Creates local rules if needed
   - Updates parent documentation

2. **File Creation**: When you create a new file, the orchestrator:
   - Checks naming conventions
   - Validates file size limits
   - Applies file-specific rules
   - Updates indexes if needed

3. **Continuous Validation**: Every minute (or 10s in fast mode):
   - Scans entire project structure
   - Checks all rules compliance
   - Generates violation report
   - Logs issues to `.rules/violations.log`

## Rules Enforced

### File Naming
- React components: `PascalCase.tsx`
- Hooks: `useCamelCase.ts`
- Services: `camelCaseService.ts`
- Constants: `SCREAMING_SNAKE_CASE.ts`

### Directory Structure
- Maximum 3 levels deep
- Feature-first organization
- Lowercase with hyphens
- Required files per directory type

### Code Quality
- File size limits (200-500 lines)
- No hardcoded secrets
- No console.log statements
- Sorted imports

## Configuration

The orchestrator reads rules from:
- `.rules/architecture/file_organization.rules`
- `.rules/development/local.rules`
- `.rules/security/code_security.rules`
- Local `.rules` files in directories

## Violation Handling

### Auto-fixable Issues
- Spaces in file names → hyphens
- Underscores in directories → hyphens
- Console.log removal
- Import sorting

### Manual Fixes Required
- File/directory naming violations
- Oversized files
- Mixed responsibilities
- Security issues

## Reports

### Violations Log
Location: `.rules/violations.log`
- All violations found
- Suggestions for fixes
- Auto-fixable indicators

### Validation Report
Location: `.rules/validation-report.json`
- Summary statistics
- Top violations
- Critical files
- Trends

## Integration

### Use as Module
```javascript
const { RulesOrchestrator } = require('./.rules/orchestrator');

const orchestrator = new RulesOrchestrator({
    dryRun: false,
    enabled: true
});

orchestrator.on('violation-found', (violation) => {
    console.log('Violation:', violation);
});
```

### Environment Variables
```bash
# Auto-start orchestrator
export SOULFRA_RULES_AUTOSTART=true

# Custom check interval (ms)
export SOULFRA_VALIDATION_INTERVAL=30000
```

## Development Workflow

1. **Start orchestrator** when beginning work
2. **Create directories/files** normally
3. **Watch for violations** in console output
4. **Fix issues** as they're reported
5. **Check reports** for overall health

## Troubleshooting

### Orchestrator not detecting changes
- Check if directory is in ignore list
- Verify file system permissions
- Restart orchestrator

### Too many violations
- Run with `--dry-run` first
- Fix critical issues first
- Use auto-fix where available

### Performance issues
- Increase validation interval
- Add directories to ignore list
- Use `--watch-only` mode

## Best Practices

1. **Run continuously** during development
2. **Fix violations immediately** to prevent accumulation
3. **Review reports weekly** for patterns
4. **Update rules** as project evolves
5. **Use templates** for consistency

## Future Enhancements

- [ ] Git pre-commit integration
- [ ] VS Code extension
- [ ] Web dashboard
- [ ] Historical trending
- [ ] Team statistics
- [ ] Custom rule plugins

---

*"Clean code enforced automatically"*