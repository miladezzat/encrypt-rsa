const assert = require('assert');
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '../docs');
let checked = 0;

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (entry.name.endsWith('.html')) {
      const html = fs.readFileSync(file, 'utf8');
      for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
        const href = match[1];
        if (/^(?:https?:|mailto:|data:|javascript:|#|\/\/)/.test(href)) continue;
        const target = href.split(/[?#]/)[0];
        if (!target || target.includes('{{')) continue;
        const resolved = path.resolve(path.dirname(file), target);
        assert(fs.existsSync(resolved), `${path.relative(root, file)} has a broken link: ${href}`);
        const anchor = href.includes('#') ? href.split('#')[1] : '';
        if (anchor && resolved.endsWith('.html')) {
          const contents = fs.readFileSync(resolved, 'utf8');
          assert(contents.includes(`id="${anchor}"`) || contents.includes(`name="${anchor}"`), `broken anchor: ${href}`);
        }
      }
      checked++;
    }
  }
}
walk(root);
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
assert(index.includes('RSA-PSS') && index.includes('sha256'), 'README docs should describe new crypto APIs');
for (const page of ['compatibility', 'payload-format', 'migration', 'releasing', 'ai-integrations', 'signed-messages']) {
  assert(fs.existsSync(path.join(root, 'additional-documentation', `${page}.html`)), `missing ${page} guide`);
}
const api = fs.readFileSync(path.join(root, 'classes/NodeRSA.html'), 'utf8');
for (const method of ['encryptJSON', 'decryptJSON', 'signMessage', 'verifyMessage', 'sign', 'verify', 'encryptLarge', 'decryptLarge', 'createPrivateAndPublicKeys', 'encryptStringWithRsaPublicKey', 'decryptStringWithRsaPrivateKey', 'encryptBufferWithRsaPublicKey', 'decryptBufferWithRsaPrivateKey', 'encrypt', 'decrypt']) {
  assert(api.includes(`name="${method}"`), `missing ${method} API docs`);
}
console.log(`Generated docs: ${checked} HTML pages, local links, public methods, and guides passed`);
