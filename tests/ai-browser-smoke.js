const assert = require('node:assert/strict');
const { chromium } = require('playwright');

(async () => {
  const { createDemoServer } = await import('../examples/ai-integrations/server.mjs');
  const server = createDemoServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage(); const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const base = `http://127.0.0.1:${server.address().port}`;
    await page.goto(base);
    for (const runtime of ['node', 'browser']) for (const operation of ['encrypt-json', 'sign-message']) {
      await page.locator('#runtime').selectOption(runtime);
      await page.locator('#operation').selectOption(operation);
      await page.getByRole('button', { name: 'Show template' }).click();
      const expected = `${runtime}-${operation === 'encrypt-json' ? 'json' : 'message'}`;
      await page.waitForFunction(value => document.querySelector('#status').textContent === value, expected);
      assert.match(await page.locator('#code').textContent(), operation === 'encrypt-json' ? /encryptJSON/ : /verifyMessage/);
      assert.match(await page.locator('#notice').textContent(), /Signatures do not establish truth/);
    }
    for (const query of ['runtime=node&operation=invalid', 'runtime=node&operation=encrypt-json&privateKey=secret', 'runtime=node&runtime=browser&operation=encrypt-json']) {
      assert.equal((await fetch(`${base}/recommendation?${query}`)).status, 400);
    }
    assert.equal((await fetch(base, { method: 'POST' })).status, 405);
    assert.deepEqual(errors, []);
    console.log('Chromium: local assistant UI, all templates, and invalid input boundaries passed');
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
