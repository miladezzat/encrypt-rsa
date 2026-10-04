const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright');

(async () => {
  const root = path.resolve(__dirname, '../docs');
  const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.json': 'application/json' };
  const server = http.createServer((req, res) => {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    let file = path.resolve(root, `.${pathname}`);
    if (!file.startsWith(`${root}${path.sep}`) && file !== root) { res.writeHead(403).end(); return; }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    if (!fs.existsSync(file)) { file = path.join(root, '404.html'); res.statusCode = 404; }
    res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
    res.end(fs.readFileSync(file));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ permissions: ['clipboard-read', 'clipboard-write'], viewport: { width: 1440, height: 1000 } });
    const page = await context.newPage();
    const errors = []; const failedAssets = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => {
      if (response.status() >= 400 && /\.(?:js|css|svg|woff2)(?:\?|$)/.test(response.url())) failedAssets.push(response.url());
    });
    const base = `http://127.0.0.1:${server.address().port}`;
    await page.goto(`${base}/index.html`);
    await page.locator('.VPHomeHero').getByRole('link', { name: 'AI integrations', exact: true }).click();
    await page.waitForURL('**/ai-integrations.html');
    await page.getByRole('heading', { name: 'AI integrations', level: 1 }).waitFor();
    assert.equal(await page.locator('.VPSidebar').getByRole('heading').first().innerText(), 'AI integrations');
    await page.locator('.vp-doc').getByRole('link', { name: 'Encrypted agent memory', exact: true }).first().click();
    await page.waitForURL('**/ai/encrypted-memory.html');
    await page.getByRole('heading', { name: 'Encrypted agent memory', level: 1 }).waitFor();
    await page.locator('.vp-doc button.copy').nth(1).click();
    assert.match(await page.evaluate(() => navigator.clipboard.readText()), /memory\.rotate\(context, 'agent-memory'\)/);
    await page.locator('.VPSidebar').getByRole('link', { name: 'Conversation persistence', exact: true }).click();
    await page.waitForURL('**/ai/conversation-persistence.html');
    await page.getByRole('heading', { name: 'AI SDK conversation persistence', level: 1 }).waitFor();
    await page.locator('.VPSidebar').getByRole('link', { name: 'Docs assistant', exact: true }).click();
    await page.waitForURL('**/ai/docs-assistant.html');
    await page.getByRole('heading', { name: 'Local docs assistant', level: 1 }).waitFor();
    await page.goto(`${base}/index.html`);
    await page.locator('.home-ai-recipes').getByRole('link', { name: /AI SDK persistence/ }).click();
    await page.waitForURL('**/ai/conversation-persistence.html');
    await page.goto(`${base}/index.html`);
    await page.getByRole('link', { name: 'Get started', exact: true }).click();
    await page.waitForURL('**/getting-started.html');
    await page.getByRole('heading', { name: /^Getting started/, level: 1 }).waitFor();
    await page.locator('.vp-doc button.copy').first().click();
    assert.match(await page.evaluate(() => navigator.clipboard.readText()), /npm install encrypt-rsa/);
    const theme = page.getByRole('switch', { name: /dark theme|light theme/i });
    const initialDark = await page.locator('html').evaluate(el => el.classList.contains('dark'));
    await theme.click();
    await page.waitForFunction(value => document.documentElement.classList.contains('dark') !== value, initialDark);
    await page.reload();
    assert.equal(await page.locator('html').evaluate(el => el.classList.contains('dark')), !initialDark);
    await page.getByRole('button', { name: /search/i }).click();
    const search = page.locator('#localsearch-input');
    await search.fill('encryptJSON');
    const result = page.locator('.VPLocalSearchBox a[href*="api/reference.html#encryptjson"]').first();
    await result.waitFor();
    await result.click();
    await page.waitForURL('**/api/reference.html#encryptjson');
    await page.getByRole('heading', { name: /^encryptJSON/, level: 2 }).waitFor();
    assert.equal(await page.locator('.VPSidebar').getByRole('heading').first().innerText(), 'API reference');
    await page.goto(`${base}/classes/NodeRSA.html#encryptJSON`);
    await page.waitForURL('**/api/reference.html#encryptjson');
    await page.getByRole('heading', { name: /^encryptJSON/, level: 2 }).waitFor();
    await page.goto(`${base}/additional-documentation/ai-integrations.html`);
    await page.waitForURL('**/ai-integrations.html');
    await page.getByRole('heading', { name: 'AI integrations', level: 1 }).waitFor();
    await page.goto(`${base}/ai-integrations.html#bound-resource-use`);
    await page.locator('.vp-doc').getByRole('link', { name: 'resource limits table', exact: true }).click();
    await page.waitForURL('**/json.html#bound-resource-use');
    await page.getByRole('heading', { name: /^Bound resource use/, level: 2 }).waitFor();
    await page.getByRole('button', { name: /search/i }).click();
    await search.fill('conversation persistence');
    const aiResult = page.locator('.VPLocalSearchBox a[href*="ai/conversation-persistence.html"]').first();
    await aiResult.waitFor();
    await aiResult.click();
    await page.waitForURL('**/ai/conversation-persistence.html*');
    if (process.env.DOCS_SCREENSHOT_DIR) {
      fs.mkdirSync(process.env.DOCS_SCREENSHOT_DIR, { recursive: true });
      await page.goto(`${base}/`);
      await page.screenshot({ path: path.join(process.env.DOCS_SCREENSHOT_DIR, 'docs-desktop.png'), fullPage: true });
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${base}/index.html`);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), 'mobile home page must not overflow horizontally');
    if (process.env.DOCS_SCREENSHOT_DIR) await page.screenshot({ path: path.join(process.env.DOCS_SCREENSHOT_DIR, 'docs-home-mobile.png'), fullPage: true });
    await page.locator('.home-ai-recipes').getByRole('link', { name: /Explore approved code templates/ }).click();
    await page.waitForURL('**/ai/docs-assistant.html');
    await page.getByRole('heading', { name: 'Local docs assistant', level: 1 }).waitFor();
    await page.goto(`${base}/getting-started.html`);
    await page.getByRole('button', { name: 'Menu', exact: true }).click();
    await page.locator('.VPSidebar').getByRole('link', { name: 'Signed messages and replay prevention', exact: true }).click();
    await page.waitForURL('**/signed-messages.html');
    await page.getByRole('heading', { name: /^Signed messages and replay prevention/, level: 1 }).waitFor();
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), 'mobile page must not overflow horizontally');
    if (process.env.DOCS_SCREENSHOT_DIR) await page.screenshot({ path: path.join(process.env.DOCS_SCREENSHOT_DIR, 'docs-mobile.png'), fullPage: true });
    const missing = await page.goto(`${base}/missing-page.html`);
    assert.equal(missing.status(), 404);
    await page.getByRole('link', { name: 'Back to documentation', exact: true }).click();
    await page.waitForURL(`${base}/`);
    assert.deepEqual(errors, []);
    assert.deepEqual(failedAssets, []);
    console.log('Chromium docs: AI discovery and recipes, navigation, search, clipboard, theme persistence, mobile, legacy redirects, and 404 recovery passed');
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
