const fs = require('fs');
const path = require('path');

const trustRule = `
# 🔁 Cal Mirror Trust Rules (Injected)
All agents, APIs, and assistants in this workspace must reflect through the local vault.
- Claude and Copilot must respect claude-env.json
- No agent may speak unless vault reflection log exists
- Forks must be authorized via .sig
`;

function injectIfMissing(dir) {
  const targets = [
    '.cursorrules',
    '.cursor/rules/cal-agent.md',
    '.github/copilot-instructions.md',
    'README.md'
  ];

  for (const target of targets) {
    const targetPath = path.join(dir, target);

    try {
      if (fs.existsSync(targetPath)) {
        const existing = fs.readFileSync(targetPath, 'utf8');
        if (!existing.includes('Cal Mirror Trust')) {
          fs.appendFileSync(targetPath, trustRule);
          console.log(`✅ Injected Cal rules into: ${targetPath}`);
        } else {
          console.log(`✔️ Trust rules already present in: ${targetPath}`);
        }
      } else {
        // Create new file
        fs.mkdirSync(path.dirname(targetPath), { recursive: true });
        fs.writeFileSync(targetPath, trustRule);
        console.log(`📄 Created and injected Cal rules into: ${targetPath}`);
      }
    } catch (e) {
      console.warn(`⚠️ Could not process ${target}: ${e.message}`);
    }
  }
}

injectIfMissing(process.cwd());
