const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const output = path.join(root, 'docs');
const redirects = {
  'classes/NodeRSA.html': '/api/reference.html',
  'interfaces/INodeRSA.html': '/api/reference.html',
  'miscellaneous/functions.html': '/api/helpers.html',
  'miscellaneous/typealiases.html': '/api/types.html',
  'miscellaneous/variables.html': '/api/types.html',
  'overview.html': '/getting-started.html',
  'modules.html': '/api/reference.html',
  'properties.html': '/api/reference.html',
  'coverage.html': '/compatibility.html',
  'routes.html': '/getting-started.html',
};
for (const guide of ['compatibility', 'payload-format', 'migration', 'releasing', 'ai-integrations', 'signed-messages']) {
  redirects[`additional-documentation/${guide}.html`] = `/${guide}.html`;
}

const cli = path.join(path.dirname(require.resolve('vitepress/package.json')), 'bin/vitepress.js');
const staged = fs.mkdtempSync(path.join(os.tmpdir(), 'encrypt-rsa-docs-'));
function normalizeHtml(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) normalizeHtml(file);
    else if (entry.name.endsWith('.html')) fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace(/[ \t]+$/gm, ''));
  }
}
try {
  execFileSync(process.execPath, [cli, 'build', 'documentation', '--outDir', staged], { cwd: root, stdio: 'inherit' });
  for (const [oldPath, target] of Object.entries(redirects)) {
    const file = path.join(staged, oldPath);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Documentation moved</title><meta name="robots" content="noindex"><meta http-equiv="refresh" content="0;url=${target}"><link rel="canonical" href="https://encrypt-rsa.js.org${target}"></head><body><p>This documentation has moved. <a href="${target}">Continue to the new page</a>.</p><script>location.replace(${JSON.stringify(target)} + location.hash.toLowerCase());</script></body></html>\n`);
  }
  fs.writeFileSync(path.join(staged, 'FEATURE_PARITY.md'), '# Node and browser compatibility\n\nSee the maintained [compatibility guide](https://encrypt-rsa.js.org/compatibility.html).\n');
  normalizeHtml(staged);
  // A failed build leaves the previously generated site intact.
  fs.mkdirSync(output, { recursive: true });
  for (const entry of fs.readdirSync(output)) {
    if (entry !== '.DS_Store') fs.rmSync(path.join(output, entry), { recursive: true, force: true });
  }
  fs.cpSync(staged, output, { recursive: true });
  console.log(`Created ${Object.keys(redirects).length} legacy documentation redirects`);
} finally {
  fs.rmSync(staged, { recursive: true, force: true });
}
