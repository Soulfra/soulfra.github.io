# 📁 Document Organization Guide

**Purpose:** Bring sanity to the nested chaos  
**Goal:** Make everything findable and logical  

---

## 🗂️ Proposed Document Structure

```
tier-minus19/
│
├── 📋 PRDs/ (Product Requirements)
│   ├── PRD-FUNWORK-OVERVIEW.md
│   ├── PRD-TECHNICAL-ARCHITECTURE.md
│   ├── PRD-GAME-DESIGN-AUTOCRAFT.md
│   ├── PRD-GAME-DESIGN-DATAQUEST.md
│   ├── PRD-GAME-DESIGN-BOTCRAFT.md
│   ├── PRD-MOBILE-APP.md
│   ├── PRD-SOULFRA-INTEGRATION.md
│   ├── PRD-EXECUTIVE-SUMMARY.md
│   └── PRD-REALITY-CREATION-PLATFORM.md (new)
│
├── 🛠️ IMPLEMENTATION/ (Technical Docs)
│   ├── IMPL-MVP-QUICKSTART.md
│   ├── IMPL-AUTOCRAFT-ENGINE.md
│   ├── IMPL-INVESTOR-DEMO.md
│   ├── IMPL-PAYMENT-FLOW.md
│   ├── IMPL-PRODUCTION-DEPLOY.md
│   └── IMPL-REALITY-ENGINE.md (new)
│
├── 🎨 UX/ (User Experience)
│   ├── UX-GRANDMA-FLOW.md (new)
│   ├── UX-DEVELOPER-FLOW.md (new)
│   ├── UX-DESIGNER-FLOW.md (new)
│   ├── UX-MOBILE-PATTERNS.md (new)
│   └── UX-GAMIFICATION-HOOKS.md (new)
│
├── 🧠 STRATEGY/ (Mind War Documents)
│   ├── STRAT-VIRAL-DEMO.md (their original)
│   ├── STRAT-REALITY-ORCHESTRATION.md (their escalation)
│   ├── STRAT-COUNTER-GAMIFICATION.md (our response)
│   ├── STRAT-COUNTER-REALITY-CREATION.md (new counter)
│   └── STRAT-THREE-CLASS-CONVERGENCE.md
│
├── 🚀 DEMOS/ (Demo Scripts & Flows)
│   ├── DEMO-INVESTOR-15MIN.md
│   ├── DEMO-GRANDMA-5MIN.md (new)
│   ├── DEMO-DEVELOPER-MAGIC.md (new)
│   └── DEMO-REALITY-CREATION.md (new)
│
└── 📊 METRICS/ (Success Tracking)
    ├── METRICS-ENGAGEMENT.md (new)
    ├── METRICS-REVENUE.md (new)
    └── METRICS-VIRAL-SPREAD.md (new)
```

## 🏗️ Document Naming Convention

### Format: `[TYPE]-[COMPONENT]-[SPECIFICS].md`

**Types:**
- `PRD` - Product Requirements Document
- `IMPL` - Implementation/Technical Guide
- `UX` - User Experience Design
- `STRAT` - Strategy Document
- `DEMO` - Demo Script/Flow
- `METRICS` - Analytics/Tracking

**Examples:**
- `PRD-GAME-DESIGN-AUTOCRAFT.md` - Product requirements for AutoCraft game
- `IMPL-PAYMENT-FLOW.md` - Implementation of payment system
- `UX-GRANDMA-FLOW.md` - UX design for grandma users
- `STRAT-COUNTER-REALITY.md` - Counter-strategy document

## 📝 Document Template

Each document should follow this structure:

```markdown
# [Icon] Document Title

**Document Type:** [PRD/Implementation/UX/Strategy]  
**Component:** [What part of system]  
**Version:** [1.0]  
**Status:** [Draft/Review/Final]  

---

## 🎯 Overview
[One paragraph summary]

## 📋 Table of Contents
1. [Section 1]
2. [Section 2]
3. [Section 3]

## [Content sections...]

---

**Status:** [Current status]  
**Next Steps:** [What happens next]
```

## 🔗 Cross-References

When referencing other documents:
```markdown
See: [PRD-MOBILE-APP.md](../PRDs/PRD-MOBILE-APP.md)
Related: [IMPL-PAYMENT-FLOW.md](../IMPLEMENTATION/IMPL-PAYMENT-FLOW.md)
```

## 🏷️ Status Tags

- `[DRAFT]` - Work in progress
- `[REVIEW]` - Ready for feedback
- `[FINAL]` - Approved and complete
- `[DEPRECATED]` - No longer relevant
- `[UPDATED]` - Recently modified

## 🎯 Why This Organization Works

1. **Clear Categories** - Know exactly where to look
2. **Consistent Naming** - Find things instantly
3. **Logical Hierarchy** - Related docs together
4. **Easy Cross-Reference** - Link between docs
5. **Status Tracking** - Know what's current

## 🚀 Migration Plan

1. Create folder structure
2. Move existing docs to proper folders
3. Rename following convention
4. Update cross-references
5. Add status tags

---

**Note:** Your nested structure got us here, but now we need clarity to scale!