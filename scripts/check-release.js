const fs = require('node:fs');
const pkg = require('../package.json');

function stableVersion(value) {
  if (typeof value !== 'string' || !/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(value)) throw new Error('Release version must be a stable major.minor.patch');
  return value.split('.').map(BigInt);
}

async function checkRelease({ name, version }, fetchRegistry = fetch) {
  const local = stableVersion(version);
  const response = await fetchRegistry(`https://registry.npmjs.org/${encodeURIComponent(name)}/latest`, {
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`Registry lookup failed: HTTP ${response.status}`);
  const published = await response.json();
  if (published.name !== name) throw new Error('Registry returned a different package');
  const latest = stableVersion(published.version);
  for (let index = 0; index < 3; index += 1) {
    if (local[index] < latest[index]) throw new Error('Local version is older than npm latest');
    if (local[index] > latest[index]) return true;
  }
  return false;
}

if (require.main === module) {
  checkRelease(pkg).then((publish) => {
    console.log(`${pkg.name}@${pkg.version}: ${publish ? 'publish new version' : 'already published; skip'}`);
    if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `publish=${publish}\n`);
  }).catch((error) => { console.error(error.message); process.exitCode = 1; });
}
module.exports = { checkRelease };
