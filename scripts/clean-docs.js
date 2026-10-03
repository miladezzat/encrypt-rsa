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
    const cleaned = original.replace(trackingBlockPattern, '').replace(/href="([^"#]+)"/g, (match, href) => {
      const guides = {
        'documentation/compatibility.md': 'compatibility.html',
        'documentation/payload-format.md': 'payload-format.html',
        'documentation/migration.md': 'migration.html',
      };
      const alias = href.match(/(?:^|\/)undefineds\/([^/]+)\.html$/);
      if (alias) {
        const target = path.join(docs, 'miscellaneous/typealiases.html');
        return `href="${path.relative(path.dirname(fullPath), target).split(path.sep).join('/')}#${alias[1]}"`;
      }
      if (guides[href]) {
        const target = path.join(docs, 'additional-documentation', guides[href]);
        return `href="${path.relative(path.dirname(fullPath), target).split(path.sep).join('/')}"`;
      }
      if (href.startsWith('examples/') || href === 'LICENSE' || href === 'CODE_OF_CONDUCT.md') {
        return `href="https://github.com/miladezzat/encrypt-rsa/blob/master/${href}"`;
      }
      return match;
    }).replace(/[ \t]+$/gm, '');
    if (cleaned !== original) {
      fs.writeFileSync(fullPath, cleaned);
    }
  }
}

if (fs.existsSync(docs)) {
  walk(docs);
}
