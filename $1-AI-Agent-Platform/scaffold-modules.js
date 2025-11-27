// scaffold-modules.js
const fs = require('fs');
const path = require('path');

const MODULES_DIR = path.join(__dirname, 'modules');
const TEMPLATE_DIR = path.join(__dirname, 'module-template');
const MASTER_INDEX = path.join(__dirname, 'MASTER_INDEX.md');

const REQUIRED_DOCS = fs.readdirSync(TEMPLATE_DIR).filter(f => f.endsWith('.md') && f !== 'README.md' && f !== 'checklist.md');

function getModuleDirs() {
  return fs.readdirSync(MODULES_DIR).filter(f => fs.statSync(path.join(MODULES_DIR, f)).isDirectory());
}

function isEmptyOrMissing(filePath) {
  return !fs.existsSync(filePath) || fs.readFileSync(filePath, 'utf8').trim() === '';
}

function fillTemplate(template, moduleName) {
  return template.replace(/\$\{MODULE_NAME\}/g, moduleName);
}

function updateMasterIndex(statusMap) {
  let index = fs.readFileSync(MASTER_INDEX, 'utf8');
  const marker = '## 📦 Modules';
  const start = index.indexOf(marker);
  if (start === -1) return;
  const before = index.slice(0, start + marker.length);
  const after = index.slice(start + marker.length).replace(/<!-- DOC STATUS START -->(.|\n)*<!-- DOC STATUS END -->/m, '');
  let statusBlock = '\n<!-- DOC STATUS START -->\n';
  statusBlock += '| Module | Docs Complete | Missing Docs |\n|---|---|---|\n';
  for (const [mod, status] of Object.entries(statusMap)) {
    statusBlock += `| ${mod} | ${status.complete ? '✅' : '❌'} | ${status.missing.join(', ') || 'None'} |\n`;
  }
  statusBlock += '<!-- DOC STATUS END -->\n';
  fs.writeFileSync(MASTER_INDEX, before + statusBlock + after, 'utf8');
}

function main() {
  const modules = getModuleDirs();
  const statusMap = {};
  let summary = [];
  modules.forEach(mod => {
    const modDir = path.join(MODULES_DIR, mod);
    let missing = [];
    REQUIRED_DOCS.forEach(doc => {
      const target = path.join(modDir, doc);
      if (isEmptyOrMissing(target)) {
        const template = fs.readFileSync(path.join(TEMPLATE_DIR, doc), 'utf8');
        fs.writeFileSync(target, fillTemplate(template, mod));
        summary.push(`Created: ${mod}/${doc}`);
        missing.push(doc);
      }
    });
    // Check again for missing after creation
    missing = REQUIRED_DOCS.filter(doc => isEmptyOrMissing(path.join(modDir, doc)));
    statusMap[mod] = { complete: missing.length === 0, missing };
  });
  updateMasterIndex(statusMap);
  // Print summary
  console.log('--- Scaffold Summary ---');
  summary.forEach(line => console.log(line));
  console.log('------------------------');
  for (const [mod, status] of Object.entries(statusMap)) {
    if (!status.complete) {
      console.log(`Module ${mod} is missing: ${status.missing.join(', ')}`);
    }
  }
  console.log('Done.');
}

main(); 