const assert = require('assert');
const fs = require('fs');
const http = require('http');
const path = require('path');
const esbuild = require('esbuild');
const { randomBytes } = require('node:crypto');
const { chromium } = require('playwright');
const NodeRSA = require('../build/node/node/index.js').default;
const withPackedConsumer = require('./packed-consumer');

withPackedConsumer(async (consumer) => {
  // Resolve the installed package using browser conditions, as application bundlers do.
  fs.writeFileSync(path.join(consumer, 'browser-entry.js'), "export { default, isValidRSAPublicKey, isValidRSAPrivateKey, isValidPEMKey, splitIntoChunks, joinChunks } from 'encrypt-rsa';");
  esbuild.buildSync({
    absWorkingDir: consumer, entryPoints: ['browser-entry.js'], bundle: true,
    format: 'esm', platform: 'browser', outfile: path.join(consumer, 'consumer.mjs'),
  });
  fs.writeFileSync(path.join(consumer, 'browser-require.cjs'), "module.exports = require('encrypt-rsa');");
  esbuild.buildSync({
    absWorkingDir: consumer, entryPoints: ['browser-require.cjs'], bundle: true,
    format: 'iife', globalName: 'browserRequire', platform: 'browser', outfile: path.join(consumer, 'require.js'),
  });
  const server = http.createServer((req, res) => {
    const routes = {
      '/require.js': path.join(consumer, 'require.js'),
      '/consumer.mjs': path.join(consumer, 'consumer.mjs'),
      '/native.mjs': path.join(consumer, 'node_modules/encrypt-rsa/build/web/index.mjs'),
      '/global.js': path.join(consumer, 'node_modules/encrypt-rsa/build/web/encrypt-rsa.global.js'),
      '/build/web/encrypt-rsa.global.js': path.join(consumer, 'node_modules/encrypt-rsa/build/web/encrypt-rsa.global.js'),
      '/examples/browser-basic.html': path.join(__dirname, '../examples/browser-basic.html'),
    };
    if (routes[req.url]) {
      res.setHeader('Content-Type', req.url.endsWith('.html') ? 'text/html' : 'text/javascript');
      res.end(fs.readFileSync(routes[req.url]));
    } else if (req.url === '/') {
      res.setHeader('Content-Type', 'text/html');
      res.end('<!doctype html><title>encrypt-rsa browser checks</title><script src="/global.js"></script><script src="/require.js"></script>');
    } else {
      res.statusCode = 404;
      res.end();
    }
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(`http://127.0.0.1:${server.address().port}/`);
    const node = new NodeRSA();
    const keys = await node.createPrivateAndPublicKeys();
    const text = '\uFEFFالعربية 😀\u0000';
    const issuedAt = Date.now();
    const claims = { issuer: 'agent-a', audience: 'web-app', purpose: 'result', keyId: 'key-1', issuedAt,
      expiresAt: issuedAt + 300000, nonce: randomBytes(24).toString('base64url'), payload: { text } };
    const fixtures = {
      claims, json: await node.encryptJSON({ value: { text }, publicKey: keys.publicKey }),
      envelope: await node.signMessage({ message: claims, privateKey: keys.privateKey }),
      ...keys, text,
      legacy: await node.encryptLarge({ text, publicKey: keys.publicKey }),
      modern: await node.encryptLarge({ text, publicKey: keys.publicKey, oaepHash: 'sha256' }),
      signature: await node.sign({ text, privateKey: keys.privateKey }),
    };
    const outputs = await page.evaluate(async (f) => {
      const check = (condition, message) => { if (!condition) throw new Error(message); };
      const reject = async (call) => {
        const promise = call();
        check(promise instanceof Promise, 'operation must return a Promise');
        let failed = false;
        try { await promise; } catch (_) { failed = true; }
        check(failed, 'expected rejection');
      };
      const outputs = [];
      for (const source of ['/consumer.mjs', '/native.mjs', 'commonjs', 'global']) {
        let mod;
        if (source === 'global') mod = window.encryptRSA;
        else if (source === 'commonjs') mod = window.browserRequire;
        else mod = await import(source);
        const RSA = mod.default || mod.NodeRSA;
        const rsa = new RSA(f.publicKey, f.privateKey);
        for (const hash of ['sha1', 'sha256']) {
          const direct = await rsa.encryptStringWithRsaPublicKey({ text: f.text, oaepHash: hash });
          check(await rsa.decryptStringWithRsaPrivateKey({ text: direct, oaepHash: hash }) === f.text, 'direct Unicode mismatch');
          await reject(() => rsa.encryptStringWithRsaPublicKey({ text: 'x'.repeat(hash === 'sha1' ? 215 : 191), oaepHash: hash }));
          const payload = await rsa.encryptLarge({ text: f.text.repeat(100), oaepHash: hash });
          check(await rsa.decryptLarge({ text: payload }) === f.text.repeat(100), 'hybrid mismatch');
        }
        check(await rsa.decryptLarge({ text: f.legacy }) === f.text, 'Node legacy -> browser failed');
        check(await rsa.decryptLarge({ text: f.modern }) === f.text, 'Node SHA256 -> browser failed');
        const jsonValue = await rsa.decryptJSON({ text: f.json });
        check(jsonValue.text === f.text, 'Node JSON -> browser failed');
        const json = await rsa.encryptJSON({ value: { text: f.text } });
        check(await rsa.decryptJSON({ text: json, parse: value => value.text }) === f.text, 'browser JSON parser failed');
        await reject(() => rsa.encryptJSON({ value: { loss: undefined } }));
        await reject(() => rsa.decryptJSON({ text: json, limits: { maxPayloadBytes: 5 } }));
        let used = false;
        const verification = { text: f.envelope, expected: { issuer: 'agent-a', audience: 'web-app', purpose: 'result' },
          resolvePublicKey: () => f.publicKey, consumeNonce: () => { if (used) return false; used = true; return true; },
          parse: value => { if (value.text !== f.text) throw new Error('schema'); return { text: value.text }; } };
        check((await rsa.verifyMessage(verification)).payload.text === f.text, 'Node message -> browser failed');
        await reject(() => rsa.verifyMessage(verification));
        await reject(() => rsa.verifyMessage({ ...verification, text: ' ' + f.envelope, consumeNonce: () => true }));
        await reject(() => rsa.signMessage({ message: { ...f.claims, nonce: 'bad' } }));
        const empty = await rsa.encryptLarge({ text: '' });
        check(await rsa.decryptLarge({ text: empty }) === '', 'empty hybrid mismatch');
        const bytes = new Uint8Array([0, 127, 128, 255]);
        const buffer = await rsa.encryptBufferWithRsaPublicKey(bytes);
        check(String(await rsa.decryptBufferWithRsaPrivateKey(buffer)) === String(bytes), 'binary mismatch');
        check(await rsa.verify({ text: f.text, signature: f.signature }), 'Node signature -> browser failed');
        check(!await rsa.verify({ text: 'tampered', signature: f.signature }), 'modified message accepted');
        check(!await rsa.verify({ text: f.text, signature: 'invalid!' }), 'invalid signature accepted');
        check(await mod.isValidRSAPublicKey(f.publicKey), 'RSA public validation failed');
        check(await mod.isValidRSAPrivateKey(f.privateKey), 'RSA private validation failed');
        check(!await mod.isValidRSAPublicKey('-----BEGIN PUBLIC KEY-----\nAAAA\n-----END PUBLIC KEY-----'), 'corrupt key accepted');
        const malformed = f.legacy.split(':');
        malformed[2] = '';
        await reject(() => rsa.decryptLarge({ text: malformed.join(':') }));
        for (const method of ['encryptStringWithRsaPublicKey', 'decryptStringWithRsaPrivateKey', 'encryptLarge', 'decryptLarge', 'encryptJSON', 'decryptJSON', 'signMessage', 'verifyMessage', 'sign', 'verify', 'encrypt', 'decrypt']) {
          await reject(() => new RSA()[method]({ text: 'x', signature: 'x' }));
        }
        await reject(() => new RSA().encryptBufferWithRsaPublicKey(new Uint8Array()));
        await reject(() => new RSA().decryptBufferWithRsaPrivateKey('x'));
        await reject(() => rsa.encrypt({ text: 'unsupported' }));
        await reject(() => rsa.decrypt({ text: 'unsupported' }));
        if (source === '/native.mjs') {
          const largeText = 'x'.repeat(6 * 1024 * 1024);
          const largePayload = await rsa.encryptLarge({ text: largeText });
          check(await rsa.decryptLarge({ text: largePayload }) === largeText, 'multi-megabyte payload failed');
        }
        const generated = await rsa.createPrivateAndPublicKeys();
        const generatedRsa = new RSA(generated.publicKey, generated.privateKey);
        outputs.push({
          ...generated,
          json: await generatedRsa.encryptJSON({ value: { text: f.text } }),
          envelope: await generatedRsa.signMessage({ message: f.claims }),
          payload: await generatedRsa.encryptLarge({ text: f.text, oaepHash: 'sha256' }),
          signature: await generatedRsa.sign({ text: f.text }),
        });
        if (source === 'global') {
          const globalJson = await mod.encryptJSON({ value: { text: f.text }, publicKey: f.publicKey });
          check((await mod.decryptJSON({ text: globalJson, privateKey: f.privateKey })).text === f.text, 'global JSON failed');
          const globalEnvelope = await mod.signMessage({ message: f.claims, privateKey: f.privateKey });
          check((await mod.verifyMessage({ ...verification, text: globalEnvelope, consumeNonce: () => true })).payload.text === f.text, 'global signed messages failed');
          const signed = await mod.sign({ text: f.text, privateKey: f.privateKey });
          check(await mod.verify({ text: f.text, signature: signed, publicKey: f.publicKey }), 'global functions failed');
          const globalKeys = await mod.createPrivateAndPublicKeys();
          const encrypted = await mod.encryptStringWithRsaPublicKey({ text: f.text, publicKey: globalKeys.publicKey });
          check(await mod.decryptStringWithRsaPrivateKey({ text: encrypted, privateKey: globalKeys.privateKey }) === f.text, 'global direct failed');
          const large = await mod.encryptLarge({ text: f.text, publicKey: globalKeys.publicKey, oaepHash: 'sha256' });
          check(await mod.decryptLarge({ text: large, privateKey: globalKeys.privateKey }) === f.text, 'global hybrid failed');
        } else {
          check(mod.isValidPEMKey(f.publicKey), 'format helper missing');
          check(mod.joinChunks(mod.splitIntoChunks(f.text.repeat(100))) === f.text.repeat(100), 'chunk helpers failed');
        }
      }
      return outputs;
    }, fixtures);
    for (const output of outputs) {
      assert.deepEqual(await node.decryptJSON({ text: output.json, privateKey: output.privateKey }), { text });
      assert.deepEqual((await node.verifyMessage({ text: output.envelope,
        expected: { issuer: 'agent-a', audience: 'web-app', purpose: 'result' },
        resolvePublicKey: () => output.publicKey, consumeNonce: () => true })).payload, { text });
      assert.equal(await node.decryptLarge({ text: output.payload, privateKey: output.privateKey }), text);
      assert.equal(await node.verify({ text, signature: output.signature, publicKey: output.publicKey }), true);
    }
    await page.goto(`http://127.0.0.1:${server.address().port}/examples/browser-basic.html`);
    await page.getByRole('button', { name: 'Generate 2048-bit RSA Keys' }).click();
    await page.waitForFunction(() => document.getElementById('publicKey').value.includes('BEGIN PUBLIC KEY'));
    for (const mode of ['hybrid-sha256', 'hybrid-legacy', 'direct-sha1', 'direct-sha256']) {
      const message = mode.startsWith('hybrid') ? 'browser demo العربية 😀'.repeat(100) : 'browser demo العربية 😀';
      await page.locator('#message-input').fill(message);
      await page.locator('#mode').selectOption(mode);
      await page.locator('#encrypted-output').evaluate((el) => { el.value = ''; });
      await page.locator('#encryptBtn').click();
      await page.waitForFunction(() => document.getElementById('encrypted-output').value.length > 0);
      // Changing the selector must not change how an existing ciphertext is decrypted.
      await page.locator('#mode').selectOption(mode === 'direct-sha1' ? 'direct-sha256' : 'direct-sha1');
      await page.locator('#decrypted-output').evaluate((el) => { el.value = ''; });
      await page.locator('#decryptBtn').click();
      await page.waitForFunction((expected) => document.getElementById('decrypted-output').value === expected, message);
    }
    await page.locator('#signBtn').click();
    await page.waitForFunction(() => document.getElementById('signature-output').value.length > 0);
    await page.locator('#verifyBtn').click();
    await page.waitForFunction(() => document.getElementById('message').textContent.includes('Signature is valid'));
    await page.locator('#message-input').fill('tampered');
    await page.locator('#verifyBtn').click();
    await page.waitForFunction(() => document.getElementById('message').textContent.includes('Signature is invalid'));
    assert.deepEqual(errors, []);
    console.log('Chromium: installed browser bundle, native ESM, global API, all class methods, Node interoperability, and interactive demo passed');
  } finally {
    if (browser) await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
}).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
