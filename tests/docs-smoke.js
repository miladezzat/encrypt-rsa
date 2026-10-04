const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../docs');
const { default: NodeRSA, ...helpers } = require('../build/node/node');
let checked = 0;

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (entry.name.endsWith('.html')) {
      const html = fs.readFileSync(file, 'utf8');
      for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
        const href = match[1].replace(/&amp;/g, '&');
        if (/^(?:https?:|mailto:|data:|javascript:|\/\/)/.test(href)) continue;
        const url = new URL(href, `https://docs.test/${path.relative(root, file).split(path.sep).join('/')}`);
        let resolved = path.join(root, decodeURIComponent(url.pathname));
        if (fs.existsSync(resolved) && fs.statSync(resolved).isDirectory()) resolved = path.join(resolved, 'index.html');
        assert(fs.existsSync(resolved), `${path.relative(root, file)} has a broken link: ${href}`);
        const anchor = decodeURIComponent(url.hash.slice(1));
        if (anchor && resolved.endsWith('.html')) {
          const contents = fs.readFileSync(resolved, 'utf8');
          assert(contents.includes(`id="${anchor}"`) || contents.includes(`name="${anchor}"`), `broken anchor in ${path.relative(root, file)}: ${href}`);
        }
      }
      checked++;
    }
  }
}
walk(root);
assert.equal(fs.readFileSync(path.join(root, 'CNAME'), 'utf8').trim(), 'encrypt-rsa.js.org');
assert(fs.existsSync(path.join(root, '.nojekyll')), 'GitHub Pages must preserve VitePress assets');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
assert(index.includes('encryptJSON') && index.includes('RSA-OAEP/SHA-256'), 'home page should include the current quick start');
assert(!index.includes('compodoc'), 'the previous theme must be replaced');
for (const page of ['getting-started', 'json', 'compatibility', 'payload-format', 'migration', 'releasing', 'ai-integrations', 'ai/encrypted-memory', 'ai/conversation-persistence', 'ai/docs-assistant', 'signed-messages', 'examples', 'contributing', 'changelog', 'license', 'api/reference', 'api/helpers', 'api/types', '404']) {
  assert(fs.existsSync(path.join(root, `${page}.html`)), `missing ${page} page`);
}
const api = fs.readFileSync(path.join(root, 'api/reference.html'), 'utf8');
for (const method of Object.getOwnPropertyNames(NodeRSA.prototype).filter(name => name !== 'constructor')) {
  assert(api.includes(`id="${method.toLowerCase()}"`), `missing ${method} API docs`);
}
const helperDocs = fs.readFileSync(path.join(root, 'api/helpers.html'), 'utf8');
for (const name of Object.keys(helpers)) {
  assert(helperDocs.includes(`id="${name.toLowerCase()}"`), `missing ${name} helper docs`);
}
assert(fs.readFileSync(path.join(root, 'api/types.html'), 'utf8').includes('INodeRSA'), 'shared source contracts must be rendered');
for (const page of ['compatibility', 'payload-format', 'migration', 'releasing', 'ai-integrations', 'signed-messages']) {
  const redirect = fs.readFileSync(path.join(root, 'additional-documentation', `${page}.html`), 'utf8');
  assert(redirect.includes(`url=/${page}.html`), `missing legacy ${page} redirect`);
}
console.log(`VitePress: ${checked} HTML pages, local links/assets/anchors, public APIs, and legacy redirects passed`);
