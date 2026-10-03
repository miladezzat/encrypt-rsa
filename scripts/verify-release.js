const pkg = require('../package.json');

/** Wait for npm processing/replication after an accepted publish; never republish. */
async function verifyRelease({ name, version }, {
  fetchRegistry = fetch,
  wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  now = Date.now,
  timeoutMs = 600000,
  log = console.log,
} = {}) {
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 900000) throw new Error('Invalid release verification timeout');
  const deadline = now() + timeoutMs;
  let attempt = 0;
  let lastError = 'version unavailable';
  while (now() < deadline) {
    attempt += 1;
    let response;
    try {
      response = await fetchRegistry(`https://registry.npmjs.org/${encodeURIComponent(name)}/${encodeURIComponent(version)}`, {
        signal: AbortSignal.timeout(Math.max(1, Math.min(15000, deadline - now()))),
        cache: 'no-store', headers: { 'Cache-Control': 'no-cache' },
      });
    } catch (error) { lastError = error.message; }
    if (response?.ok) {
      const released = await response.json();
      if (released.name !== name || released.version !== version || typeof released.dist?.integrity !== 'string'
          || !/^sha512-[A-Za-z0-9+/]+={0,2}$/.test(released.dist.integrity)) {
        throw new Error('Registry returned invalid release metadata');
      }
      log(`Verified ${name}@${version}: ${released.dist.integrity}`);
      return released;
    }
    if (response && ![404, 408, 429, 500, 502, 503, 504].includes(response.status)) {
      throw new Error(`Release verification failed: HTTP ${response.status}`);
    }
    if (response) lastError = `HTTP ${response.status}`;
    const remaining = deadline - now();
    if (remaining <= 0) break;
    log(`Waiting for npm to expose ${name}@${version} (attempt ${attempt}, ${lastError})`);
    await wait(Math.min(5000 * attempt, 30000, remaining));
  }
  throw new Error(`Timed out verifying ${name}@${version}: ${lastError}. Check npm before attempting another publish.`);
}

if (require.main === module) {
  verifyRelease(pkg).catch((error) => { console.error(error.message); process.exitCode = 1; });
}
module.exports = { verifyRelease };
