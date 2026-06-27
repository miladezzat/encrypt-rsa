const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const docs = path.join(root, 'docs');

for (const dir of ['template-playground', 'template-playground-app']) {
  fs.rmSync(path.join(docs, dir), { recursive: true, force: true });
}

const trackingBlockPattern = /\n\s*<script>\s*\/\/ --- Iframe navigation tracking for Template Playground ---[\s\S]*?window\.addEventListener\('DOMContentLoaded', sendCurrentUrlToParent, false\);\s*<\/script>/g;

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
      continue;
    }

    if (!entry.name.endsWith('.html')) {
      continue;
    }

    const original = fs.readFileSync(fullPath, 'utf8');
    const cleaned = original.replace(trackingBlockPattern, '');
    if (cleaned !== original) {
      fs.writeFileSync(fullPath, cleaned);
    }
  }
}

if (fs.existsSync(docs)) {
  walk(docs);
}
