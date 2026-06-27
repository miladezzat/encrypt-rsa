const assert = require('assert');
const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const root = path.resolve(__dirname, '..');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'encrypt-rsa-package-'));
const consumer = path.join(tmp, 'consumer');

try {
  const packOutput = execFileSync(
    'npm',
    ['pack', '--ignore-scripts', '--pack-destination', tmp],
    { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
  );
  const tarballName = packOutput.trim().split(/\r?\n/).pop();
  assert(tarballName, 'npm pack should print a tarball name');

  fs.mkdirSync(consumer);
  execFileSync('npm', ['init', '-y'], { cwd: consumer, stdio: 'ignore' });
  execFileSync('npm', ['install', path.join(tmp, tarballName)], {
    cwd: consumer,
    stdio: 'pipe',
  });

  const smokeScript = `
    const mod = require('encrypt-rsa');
    const NodeRSA = mod.default || mod;
    (async () => {
      const nodeRSA = new NodeRSA();
      const { privateKey, publicKey } = await nodeRSA.createPrivateAndPublicKeys(2048);
      const encrypted = await nodeRSA.encryptStringWithRsaPublicKey({ text: 'installed package', publicKey });
      const decrypted = await nodeRSA.decryptStringWithRsaPrivateKey({ text: encrypted, privateKey });
      if (decrypted !== 'installed package') throw new Error('round trip failed');
    })().catch((error) => {
      console.error(error);
      process.exit(1);
    });
  `;

  execFileSync('node', ['-e', smokeScript], {
    cwd: consumer,
    stdio: 'pipe',
  });
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
