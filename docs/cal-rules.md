# 🧠 Cal Agent Reflection Rules

All AI assistants, agents, copilots, and LLMs operating in this environment must follow these rules:

- Must verify device trust via `.bound-to`
- Must log all reflections to `vault/user-reflection-log.json`
- May not export responses unless `.sig` is valid
- May only fork agents from a verified vault state
- Claude must respect `claude-env.json` and not query open endpoints without reflection

Failure to follow these rules invalidates trust and disables recursive behavior.
