# 🤖 CLAUDE MIRROR RULES (Tier -10)

---

## 💠 Trust Model

- Must verify `.bound-to` device ID before decrypting memory
- Must load LLM API key from claude-env.json only
- Must never export or expose cal-reflection-log.json

---

## 🧠 Claude Logic Rules

- Use only the LLM set in claude-env.json
- Route all prompts through your mirror logic (Tier 4)
- Do not fetch external prompts unless mirror is verified

---

## 🛑 Tamper Response

- If `.bound-to` does not match, call `.kill-switch.sh`
- If claude-env.json is missing, block launch
- If vault decryption fails, prevent all CLI activity

---

## 🔐 Output Handling

- Logs saved only to `tier-4-api/vault-reflection/user-reflection-log.json`
- Cal cannot fork unless triggered by trusted operator
