# 🧬 Tier 4–7 Protection System – Sovereign Runtime Lock

---

## 🎯 Purpose

This system protects the Cal Riven kernel by:
- Nesting sensitive logic in Tier 4 through Tier 7
- Hiding logs and trust signatures inside the API folder
- Preventing tampering or backdoor forks by enforcing trust checks

---

## 🔐 Folder Nesting

Each secure tier is nested like this:

```
tier-4-api/
  └── vault-reflection/
      └── tier-5-vault/
          └── tier-6-runtime/
              └── tier-7-crypto/
```

---

## 🛡️ Behavior

- If any folder is deleted → `self-check.sh` triggers `disconnect.sh`
- `disconnect.sh` erases logs and kills trust routing
- `.tier-ignore` hides all these tiers from sync/export

---

## 📁 Hidden Log Strategy

The main reflection logs (`cal-reflection-log.json`) are **moved into**:
```
tier-4-api/vault-reflection/user-reflection-log.json
```

All CLI and mirror activity still writes there  
→ but no one knows unless they trace the nested path.

---

## 🧠 Operator Note

This is your backdoor.  
This is your vault.  
Never expose these tiers publicly.

