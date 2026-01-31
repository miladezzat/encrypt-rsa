/**
 * Tests for the web (browser) build.
 * Requires crypto.subtle (Node 19+ or browser). Skipped when not available.
 */
/* eslint-disable max-len */
import { expect } from 'chai';
import NodeRSA from '../src/web/index';

const hasSubtleCrypto =
  typeof globalThis !== 'undefined' &&
  typeof (globalThis as unknown as { crypto?: { subtle?: unknown } }).crypto !== 'undefined' &&
  (globalThis as unknown as { crypto: { subtle?: unknown } }).crypto.subtle != null;

describe('Functionality (web build)', function () {
  before(function () {
    if (!hasSubtleCrypto) {
      this.skip();
    }
  });

  it('should create instance from NodeRSA', () => {
    const nodeRSA = new NodeRSA();
    expect(nodeRSA).to.be.an.instanceOf(NodeRSA);
  });

  it('should create private and public key', async () => {
    const nodeRSA = new NodeRSA();
    const { privateKey, publicKey } = await nodeRSA.createPrivateAndPublicKeys();

    expect(privateKey).to.be.a('string');
    expect(publicKey).to.be.a('string');
    expect(privateKey).to.include('-----BEGIN PRIVATE KEY-----');
    expect(publicKey).to.include('-----BEGIN PUBLIC KEY-----');
  });

  it('should encrypt and decrypt with public/private key', async () => {
    const nodeRSA = new NodeRSA();
    const { privateKey, publicKey } = await nodeRSA.createPrivateAndPublicKeys();

    const encryptedText = await nodeRSA.encryptStringWithRsaPublicKey({
      text: 'hello world',
      publicKey,
    });

    expect(encryptedText).to.be.a('string').and.not.equal('hello world');

    const decryptText = await nodeRSA.decryptStringWithRsaPrivateKey({
      text: encryptedText,
      privateKey,
    });

    expect(decryptText).to.equal('hello world');
  });

  it('should encrypt and decrypt a buffer (Uint8Array)', async () => {
    const nodeRSA = new NodeRSA();
    const { privateKey, publicKey } = await nodeRSA.createPrivateAndPublicKeys();

    const buffer = new TextEncoder().encode('This is a buffer test');

    const encryptedBuffer = await nodeRSA.encryptBufferWithRsaPublicKey(buffer, publicKey);
    expect(encryptedBuffer).to.be.a('string');

    const decryptedBuffer = await nodeRSA.decryptBufferWithRsaPrivateKey(
      encryptedBuffer,
      privateKey
    );
    expect(decryptedBuffer).to.be.an.instanceOf(Uint8Array);
    expect(new TextDecoder().decode(decryptedBuffer)).to.equal('This is a buffer test');
  });

  it('should encrypt and decrypt an empty buffer', async () => {
    const nodeRSA = new NodeRSA();
    const { privateKey, publicKey } = await nodeRSA.createPrivateAndPublicKeys();

    const buffer = new Uint8Array(0);

    const encryptedBuffer = await nodeRSA.encryptBufferWithRsaPublicKey(buffer, publicKey);
    expect(encryptedBuffer).to.be.a('string');

    const decryptedBuffer = await nodeRSA.decryptBufferWithRsaPrivateKey(
      encryptedBuffer,
      privateKey
    );
    expect(decryptedBuffer).to.be.an.instanceOf(Uint8Array);
    expect(decryptedBuffer.length).to.equal(0);
  });

  it('should throw when encrypt with private key (not supported in browser)', async () => {
    const nodeRSA = new NodeRSA();
    const { privateKey, publicKey } = await nodeRSA.createPrivateAndPublicKeys();

    let errEnc: Error | null = null;
    try {
      await nodeRSA.encrypt({ text: 'hello', privateKey });
    } catch (e) {
      errEnc = e as Error;
    }
    expect(errEnc).to.not.equal(null);
    expect((errEnc as Error).message).to.match(/not supported in the browser/);

    let errDec: Error | null = null;
    try {
      await nodeRSA.decrypt({ text: 'x', publicKey });
    } catch (e) {
      errDec = e as Error;
    }
    expect(errDec).to.not.equal(null);
    expect((errDec as Error).message).to.match(/not supported in the browser/);
  });
});
