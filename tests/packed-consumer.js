const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

module.exports = async function withPackedConsumer(run) {
  const root = path.resolve(__dirname, '..');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'encrypt-rsa-package-'));
  const consumer = path.join(tmp, 'consumer');
  try {
    const packed = execFileSync('npm', ['pack', '--ignore-scripts', '--pack-destination', tmp], {
      cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
    }).trim().split(/\r?\n/).pop();
    fs.mkdirSync(consumer);
    execFileSync('npm', ['init', '-y'], { cwd: consumer, stdio: 'ignore' });
    execFileSync('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund', path.join(tmp, packed)], {
      cwd: consumer, stdio: 'pipe',
    });
    await run(consumer);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
};
