# 📁 SOULFRA File Organization Rules
## Keep Your Codebase Clean and Crash-Free

These rules prevent the file structure chaos that kills projects.

## 🏗️ Core Principles

### 1. **Feature-First Organization**
Group by what the code does, not what type of file it is.

```bash
# ❌ Bad: Technology-first
components/
services/
utils/
types/

# ✅ Good: Feature-first
agents/
  ├── components/
  ├── services/
  ├── types/
  └── utils/
chat/
  ├── components/
  ├── services/
  ├── types/
  └── utils/
```

### 2. **Maximum 3 Levels Deep**
If you need to go deeper, you're probably doing it wrong.

```bash
# ✅ Good: 3 levels max
src/
├── components/
│   ├── agents/           # Level 1
│   │   ├── AgentCard.tsx # Level 2
│   │   └── controls/     # Level 3 (STOP HERE)

# ❌ Bad: Too deep
src/components/ui/forms/inputs/text/special/variants/MyComponent.tsx
```

### 3. **Dependencies Flow Inward Only**
Higher-level modules depend on lower-level ones, never the reverse.

```bash
# Dependency flow: API → Services → Models → Core
api/           # Depends on: services, models, core
├── services/  # Depends on: models, core
├── models/    # Depends on: core
└── core/      # Depends on: nothing (pure utilities)
```

## 📂 SOULFRA Standard Structure

### Backend Structure
```
backend/
├── app/
│   ├── main.py              # Application entry point
│   ├── config.py            # Configuration management
│   ├── database.py          # Database setup
│   │
│   ├── models/              # Data models (SQLAlchemy)
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── agent.py
│   │   ├── message.py
│   │   └── integrations.py
│   │
│   ├── api/                 # HTTP endpoints
│   │   ├── __init__.py
│   │   ├── auth.py          # Authentication endpoints
│   │   ├── agents.py        # Agent management
│   │   ├── chat.py          # Chat functionality
│   │   ├── social.py        # Social feed
│   │   └── integrations.py  # OAuth endpoints
│   │
│   ├── services/            # Business logic
│   │   ├── __init__.py
│   │   ├── ai_service.py    # AI integration
│   │   ├── agent_service.py # Agent behavior
│   │   ├── auth_service.py  # Authentication logic
│   │   └── oauth_service.py # OAuth handling
│   │
│   └── core/                # Shared utilities
│       ├── __init__.py
│       ├── security.py      # JWT, passwords
│       ├── websockets.py    # Real-time connections
│       └── dependencies.py  # FastAPI dependencies
│
├── migrations/              # Database migrations
├── tests/                   # Test files
└── requirements.txt         # Python dependencies
```

### Frontend Structure
```
frontend/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── layout.tsx       # Root layout
│   │   ├── page.tsx         # Home page
│   │   ├── auth/            # Auth pages
│   │   ├── agents/          # Agent pages
│   │   └── social/          # Social pages
│   │
│   ├── components/          # Reusable components
│   │   ├── ui/              # Base UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   └── Modal.tsx
│   │   ├── agents/          # Agent-specific components
│   │   │   ├── AgentCard.tsx
│   │   │   ├── AgentControls.tsx
│   │   │   └── PersonalitySlider.tsx
│   │   ├── chat/            # Chat components
│   │   │   ├── ChatInterface.tsx
│   │   │   ├── MessageBubble.tsx
│   │   │   └── VoiceInput.tsx
│   │   └── social/          # Social components
│   │       ├── SocialFeed.tsx
│   │       ├── ThoughtCard.tsx
│   │       └── ActivityStream.tsx
│   │
│   ├── hooks/               # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useAgent.ts
│   │   ├── useChat.ts
│   │   └── useWebSocket.ts
│   │
│   ├── lib/                 # Utilities and configurations
│   │   ├── api.ts           # API client
│   │   ├── auth.ts          # Auth utilities
│   │   ├── websocket.ts     # WebSocket client
│   │   └── utils.ts         # General utilities
│   │
│   └── types/               # TypeScript type definitions
│       ├── agent.ts
│       ├── user.ts
│       ├── message.ts
│       └── api.ts
│
├── package.json
├── next.config.js
└── tailwind.config.js
```

## 🚨 File Naming Conventions

### Components (PascalCase)
```bash
AgentCard.tsx
ChatInterface.tsx
SocialFeed.tsx
```

### Hooks (camelCase with 'use' prefix)
```bash
useAuth.ts
useAgent.ts
useWebSocket.ts
```

### Services/Utils (camelCase)
```bash
aiService.ts
authService.ts
apiClient.ts
```

### Types (PascalCase)
```bash
User.ts
Agent.ts
Message.ts
```

### Constants (SCREAMING_SNAKE_CASE)
```bash
API_ENDPOINTS.ts
DEFAULT_CONFIG.ts
ERROR_MESSAGES.ts
```

## 🛡️ Anti-Patterns to Avoid

### ❌ Don't: Giant Barrel Files
```typescript
// ❌ Bad: index.ts that exports everything
export * from './component1'
export * from './component2'
export * from './component3'
// ... 50 more exports
```

### ❌ Don't: Mixed Responsibilities
```bash
# ❌ Bad: Mixed UI and business logic
components/
├── UserCardWithApiCallsAndValidation.tsx  # Too much responsibility
```

### ❌ Don't: Deep Nesting
```bash
# ❌ Bad: Too deep
src/components/ui/forms/inputs/text/variants/special/MyInput.tsx
```

### ❌ Don't: Unclear Names
```bash
# ❌ Bad: Unclear file names
utils.ts           # Utils for what?
helper.js          # Helps with what?
stuff.tsx          # What stuff?
manager.py         # Manages what?
```

## ✅ Best Practices

### 1. **One Thing Per File**
Each file should have a single, clear responsibility.

```typescript
// ✅ Good: Clear, single purpose
// AgentCard.tsx - Only displays agent information
// AgentService.ts - Only handles agent business logic
// agentApi.ts - Only makes agent API calls
```

### 2. **Descriptive Names**
File names should explain exactly what's inside.

```bash
# ✅ Good: Self-documenting names
UserProfileCard.tsx
GoogleDriveIntegration.ts
AgentPersonalitySlider.tsx
```

### 3. **Group Related Files**
Keep files that change together close together.

```bash
# ✅ Good: Related files together
agents/
├── AgentCard.tsx
├── AgentCard.test.tsx
├── AgentCard.stories.tsx
└── AgentCard.types.ts
```

### 4. **Clear Import Paths**
Use absolute imports and path aliases.

```typescript
// ✅ Good: Clear import paths
import { AgentCard } from '@/components/agents/AgentCard'
import { useAuth } from '@/hooks/useAuth'
import { ApiClient } from '@/lib/api'

// ❌ Bad: Relative import hell
import { AgentCard } from '../../../components/agents/AgentCard'
```

## 🔧 Tools to Maintain Clean Structure

### 1. **ESLint Rules**
```javascript
// .eslintrc.js
rules: {
  'import/no-relative-parent-imports': 'error',  // Prevent ../../../ imports
  'import/order': 'error',                       // Consistent import order
  'no-restricted-imports': 'error'               // Block specific imports
}
```

### 2. **Path Aliases**
```typescript
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@/components/*": ["src/components/*"],
      "@/hooks/*": ["src/hooks/*"],
      "@/lib/*": ["src/lib/*"]
    }
  }
}
```

### 3. **Automated File Organization**
```bash
# Script to check file organization
#!/bin/bash
# check-structure.sh

echo "🔍 Checking file structure..."

# Check for files that are too deep
find src -type f -name "*.tsx" -o -name "*.ts" | while read file; do
  depth=$(echo "$file" | tr '/' '\n' | wc -l)
  if [ $depth -gt 5 ]; then
    echo "⚠️  File too deep: $file (depth: $depth)"
  fi
done

# Check for giant files
find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec wc -l {} + | \
  awk '$1 > 300 { print "⚠️  Large file: " $2 " (" $1 " lines)" }'

echo "✅ Structure check complete"
```

## 📏 File Size Guidelines

- **Components**: < 200 lines
- **Services**: < 300 lines  
- **Utils**: < 100 lines
- **Types**: < 150 lines

If a file gets bigger, split it up!

## 🎯 Refactoring Guidelines

### When to Split a File:
1. **Multiple responsibilities** - File does more than one thing
2. **Too many imports** - More than 10-15 imports
3. **Hard to test** - Can't easily write unit tests
4. **Hard to understand** - Takes more than 30 seconds to understand

### How to Split:
1. **Identify concerns** - What are the different responsibilities?
2. **Extract pure functions** - Move utilities to separate files
3. **Split by feature** - Create feature-specific modules
4. **Create shared utilities** - Extract common patterns

## 🚀 Scaling the Structure

As SOULFRA grows:

```bash
# Month 1: Simple structure
src/
├── components/
├── hooks/
└── lib/

# Month 6: Feature-based structure
src/
├── features/
│   ├── agents/
│   ├── chat/
│   └── social/
├── shared/
│   ├── components/
│   ├── hooks/
│   └── utils/

# Month 12: Micro-frontend ready
packages/
├── agents/          # Agent micro-frontend
├── chat/           # Chat micro-frontend
├── social/         # Social micro-frontend
└── shared/         # Shared components
```

## 🎉 The Result

Following these rules gives you:
- ✅ **Easy to find** any file in seconds
- ✅ **Easy to understand** what each file does
- ✅ **Easy to modify** without breaking other things
- ✅ **Easy to test** each piece independently
- ✅ **Easy to scale** as the project grows

**No more file structure chaos. No more crashes from disorganization.**