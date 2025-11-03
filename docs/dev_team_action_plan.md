# 🎯 Dev Team Action Plan: Prevent File Structure Chaos

## 🚨 The Problem We're Solving

Previous projects crashed due to messy file organization. Here's how we prevent that with SOULFRA.

## 📋 Immediate Actions (Day 1)

### 1. Set Up Structure Checking (30 minutes)
```bash
# Copy these scripts to your project
cp scripts/check-structure.sh .
cp scripts/organize-files.py .
chmod +x check-structure.sh

# Run initial check
./check-structure.sh
```

### 2. Install Pre-commit Hooks (15 minutes)
```bash
# Install pre-commit
pip install pre-commit

# Create .pre-commit-config.yaml
cat > .pre-commit-config.yaml << 'EOF'
repos:
  - repo: local
    hooks:
      - id: check-structure
        name: Check file structure
        entry: ./scripts/check-structure.sh
        language: system
        pass_filenames: false
        
      - id: check-file-size
        name: Check file sizes
        entry: python3 scripts/check-large-files.py
        language: system
        files: \.(ts|tsx|py)$
        
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.4.0
    hooks:
      - id: check-yaml
      - id: end-of-file-fixer
      - id: trailing-whitespace
      - id: check-merge-conflict
EOF

# Install hooks
pre-commit install
```

### 3. Configure ESLint/TypeScript Rules (20 minutes)
```bash
# Frontend - Add to .eslintrc.js
cat >> frontend/.eslintrc.js << 'EOF'
module.exports = {
  rules: {
    // Prevent messy imports
    'import/no-relative-parent-imports': 'error',
    'import/order': ['error', {
      'groups': ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
      'pathGroups': [
        {
          'pattern': '@/**',
          'group': 'internal'
        }
      ],
      'pathGroupsExcludedImportTypes': ['builtin']
    }],
    
    // File naming conventions
    'filename-rules/match': [2, {
      '.tsx$': /^[A-Z][a-zA-Z0-9]*\.tsx$/,  // Components: PascalCase
      '.ts$': /^[a-z][a-zA-Z0-9]*\.ts$/     // Others: camelCase
    }],
    
    // Prevent large files
    'max-lines': ['error', { 'max': 300, 'skipBlankLines': true }],
    
    // Prevent too many imports
    'import/max-dependencies': ['error', { 'max': 15 }]
  }
}
EOF
```

### 4. Set Up Path Aliases (15 minutes)
```typescript
// frontend/tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@/components/*": ["src/components/*"],
      "@/hooks/*": ["src/hooks/*"],
      "@/lib/*": ["src/lib/*"],
      "@/types/*": ["src/types/*"],
      "@/features/*": ["src/features/*"]
    }
  }
}
```

## 🏗️ Team Guidelines (Share with all devs)

### File Naming Rules
```bash
# ✅ Good file names
UserProfileCard.tsx     # Components: PascalCase
useAuth.ts             # Hooks: use + PascalCase
apiClient.ts           # Utils: camelCase
User.types.ts          # Types: PascalCase + .types

# ❌ Bad file names
user.tsx               # Component should be PascalCase
UserCard.js            # Use .tsx for React components
utils.ts               # Too vague - be specific
helper.js              # What does it help with?
```

### Where Files Go
```bash
# Components by feature
src/components/
├── ui/              # Generic UI components
├── agents/          # Agent-specific components  
├── chat/            # Chat-specific components
└── social/          # Social-specific components

# Business logic by domain
backend/app/
├── api/            # HTTP endpoints
├── services/       # Business logic
├── models/         # Data models
└── core/           # Shared utilities
```

### File Size Limits
- **Components**: < 200 lines
- **Services**: < 300 lines
- **Utilities**: < 100 lines
- **Types**: < 150 lines

### Import Rules
```typescript
// ✅ Good imports (absolute paths)
import { UserCard } from '@/components/users/UserCard'
import { useAuth } from '@/hooks/useAuth'
import { apiClient } from '@/lib/api'

// ❌ Bad imports (relative hell)
import { UserCard } from '../../../components/users/UserCard'
import { useAuth } from '../../hooks/useAuth'
```

## 🔄 Daily Workflow

### Before Writing Code
1. **Check structure**: `./check-structure.sh`
2. **Plan where file goes**: Which feature/domain?
3. **Check if file already exists**: Don't duplicate!

### While Writing Code
1. **Keep files small**: Split when > 200 lines
2. **Use absolute imports**: No `../../../`
3. **Name descriptively**: `UserProfileCard` not `Card`
4. **One responsibility per file**: Single purpose

### Before Committing
1. **Pre-commit hooks run automatically**
2. **Fix any structure warnings**
3. **Ensure tests pass**
4. **Check file is in correct location**

## 🚨 Red Flags to Watch For

### Immediate Action Required
- Files > 500 lines
- Directories > 5 levels deep
- Files named `utils.ts`, `helper.js`, `stuff.tsx`
- Circular import errors
- More than 3 `../` in any import

### Warning Signs
- Files > 300 lines
- More than 15 imports in one file
- Similar file names in different folders
- Vague file names

## 🛠️ Tools for Each Role

### Frontend Developer
```bash
# Daily commands
npm run lint          # Check code style
npm run type-check    # Check TypeScript
./check-structure.sh  # Check organization

# Before PR
npm run build         # Ensure it builds
npm test              # Ensure tests pass
```

### Backend Developer  
```bash
# Daily commands
flake8 backend/       # Check Python style
mypy backend/         # Check type hints
./check-structure.sh  # Check organization

# Before PR
pytest backend/       # Run tests
python -m backend.main # Ensure it starts
```

### DevOps/Lead
```bash
# Weekly health check
python3 scripts/organize-files.py . --analyze

# Monthly cleanup
python3 scripts/organize-files.py . --execute

# Monitor trends
git log --oneline --since="1 month ago" --name-only | grep -E '\.(ts|tsx|py)$' | sort | uniq -c | sort -nr
```

## 📊 Success Metrics

Track these weekly:
- **Average file size** (should decrease over time)
- **Max directory depth** (should stay < 5)
- **Number of `../` imports** (should decrease)
- **Build time** (should stay fast)
- **Time to find files** (ask devs - should be < 30 seconds)

## 🎯 Phase 1 Goals (Week 1)
- [ ] All files follow naming conventions
- [ ] No files > 300 lines
- [ ] No directories > 4 levels deep
- [ ] Pre-commit hooks working
- [ ] Path aliases configured

## 🎯 Phase 2 Goals (Week 2)
- [ ] All imports use absolute paths
- [ ] Features clearly separated
- [ ] No circular dependencies
- [ ] Automated checks in CI/CD

## 🎯 Phase 3 Goals (Week 3)
- [ ] Documentation for every major component
- [ ] Clear ownership of each file/folder
- [ ] Performance monitoring in place
- [ ] Team follows guidelines without reminders

## 🆘 When Things Go Wrong

### "I can't find a file!"
1. Use VS Code's `Cmd+P` / `Ctrl+P` to search
2. Check if it follows naming conventions
3. Look in the feature-specific folder
4. Run `find . -name "*filename*"`

### "Imports are breaking!"
1. Check for circular dependencies
2. Verify path aliases in tsconfig.json
3. Use absolute imports from `@/`
4. Restart TypeScript server in VS Code

### "File is getting too big!"
1. Identify different responsibilities
2. Extract pure functions first
3. Split by feature/concern
4. Create shared utilities for common patterns

### "Structure check is failing!"
1. Read the specific error message
2. Follow the suggested fix
3. Run `./check-structure.sh` again
4. Ask for help if unclear

## 🎉 The End Result

Following these guidelines gives you:
- ✅ **Find any file in < 30 seconds**
- ✅ **Add new features without breaking old ones**
- ✅ **Onboard new devs quickly**
- ✅ **Scale to millions of users without code chaos**
- ✅ **Deploy with confidence**

**No more crashes from messy code organization!**