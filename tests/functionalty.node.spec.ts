/* eslint-disable max-len */
import { expect } from 'chai';
import NodeRSA from '../src/node/index';

describe('Functionality (node build)', () => {
  const text: string = 'hell world';
  let encryptedString: string = '';

  it('should create instance from NodeRSa', () => {
    const nodeRSA = new NodeRSA();
    expect(nodeRSA).to.an.instanceOf(NodeRSA);
  });

  it('should encrypt `hello world`', async () => {
    const nodeRSA = new NodeRSA();

    const encryptedText = await nodeRSA.encryptStringWithRsaPublicKey({
      text,
      // eslint-disable-next-line max-len
      publicKey: '-----BEGIN PUBLIC KEY-----\nMIGeMA0GCSqGSIb3DQEBAQUAA4GMADCBiAKBgEzCqLqxWSiOTkWFQaPhY6X+qom8\nzzbidCpNu/zxwTieMvnBE4yPCeSRwJMFjJD2UGr7I/WunOsx+rAxYbzoMELw6TdZ\naaKygSLfkncUmbL6MQ1ZCSQQR6weaQj8VeYKNaA3QSqJYXCRPky6LI/o73brTCpE\nsWuVWp577q2PbTDbAgMBAAE=\n-----END PUBLIC KEY-----',
    });
    encryptedString = encryptedText;
    expect(encryptedText).to.be.a('string').and.not.equal(text);
  });

  it('should decrypt a string to `hello world`', async () => {
    const nodeRSA = new NodeRSA();

    const key = `-----BEGIN RSA PRIVATE KEY-----
    MIICWwIBAAKBgEzCqLqxWSiOTkWFQaPhY6X+qom8zzbidCpNu/zxwTieMvnBE4yP
    CeSRwJMFjJD2UGr7I/WunOsx+rAxYbzoMELw6TdZaaKygSLfkncUmbL6MQ1ZCSQQ
    R6weaQj8VeYKNaA3QSqJYXCRPky6LI/o73brTCpEsWuVWp577q2PbTDbAgMBAAEC
    gYAdokTrlk4aZx32nuRhdUE4M2H5POgugyxfrJT3qQl0Zza8zvpSGGK0WESlPc4v
    pLgVJRGT5q5z6l6iqN3XxTfkI2LpvoaJzkS7Ow6ODkSfnoaeE5LsBA19BYGGgtw5
    uD4c7YBVJoEWZelSgsfSJdUpq/4YIBDSETA2aXWuC32l4QJBAJjciW9COFow7mH7
    lWveyrBGjGbisv/A9OzJAsjzsgqudvTMCFUrQgRcRlof45TPQzvlCerNg9/Q/Q3W
    oUvjYXECQQCAjVSlzYWtFovvG306VXvhjgR4W5D1Eg1havbeJpdQPgulyPnyBCDR
    6XUeGyH8fTaT0ByDxRqiQnk2r5UuZ5ELAkEAhMF7pqG3OTUnwvbxJTbfh0ot46jc
    1ltpGz/T6Fwk8zvj2eRdFEK2Wf0dqGXri7CZbqoS+9Yywq3JKDyP5s16MQJAI04t
    dEfosavijK3BC9dUaZMGeUO0oQnvMNUerc5tejVAH6z9sFEf7mauqrEK+XwuFBRw
    8GOet/eHsNQyJYd+FwJAPDgogfNfjBV6bQT2UQwHdfzKG1Jfcs5Pz/fLMljsa67I
    osWRyvZU4dRMwmNpo+m9YyKHDuQ/NwwMBhQtYlkzDw==
    -----END RSA PRIVATE KEY-----`;

    const decryptedText = await nodeRSA.decryptStringWithRsaPrivateKey({
      text: encryptedString,
      privateKey: key,
    });

    expect(decryptedText).to.be.a('string').and.equal(text);
  });

  it('should create private and public key', async () => {
    const nodeRSA = new NodeRSA();
    const { privateKey, publicKey } = await nodeRSA.createPrivateAndPublicKeys();

    expect(privateKey).to.be.a('string');
    expect(publicKey).to.be.a('string');
  });

  it('should encrypt and decrypt `hello world`', async () => {
    const nodeRSA = new NodeRSA();
    const { privateKey, publicKey } = await nodeRSA.createPrivateAndPublicKeys();

    const encryptedText = await nodeRSA.encryptStringWithRsaPublicKey({
      text: 'hello world',
      publicKey,
    });

    encryptedString = encryptedText;
    expect(encryptedText).to.be.a('string').and.not.equal(text);

    const decryptText = await nodeRSA.decryptStringWithRsaPrivateKey({
      text: encryptedText,
      privateKey,
    });

    expect(decryptText).be.a.string('hello world');
  });

  it('should encrypt and decrypt `hello world 2`', async () => {
    const nodeRSA = new NodeRSA();
    const { privateKey, publicKey } = await nodeRSA.createPrivateAndPublicKeys();

    const encryptedText = await nodeRSA.encrypt({
      text: 'hello world',
      privateKey,
    });

    encryptedString = encryptedText;

    expect(encryptedText).to.be.a('string').and.not.equal(text);

    const decryptText = await nodeRSA.decrypt({
      text: encryptedString,
      publicKey,
    });

    expect(decryptText).be.a.string('hello world');
  });

  it('should encrypt and decrypt a buffer', async () => {
    const nodeRSA = new NodeRSA();
    const { privateKey, publicKey } = await nodeRSA.createPrivateAndPublicKeys();

    const buffer = Buffer.from('This is a buffer test');

    const encryptedBuffer = await nodeRSA.encryptBufferWithRsaPublicKey(buffer, publicKey);
    expect(encryptedBuffer).to.be.a('string');

    const decryptedBuffer = await nodeRSA.decryptBufferWithRsaPrivateKey(encryptedBuffer, privateKey);
    expect(decryptedBuffer).to.be.an.instanceOf(Buffer);
    expect((decryptedBuffer as Buffer).toString()).to.equal(buffer.toString());
  });

  it('should encrypt and decrypt an empty buffer', async () => {
    const nodeRSA = new NodeRSA();
    const { privateKey, publicKey } = await nodeRSA.createPrivateAndPublicKeys();

    const buffer = Buffer.from('');

    const encryptedBuffer = await nodeRSA.encryptBufferWithRsaPublicKey(buffer, publicKey);
    expect(encryptedBuffer).to.be.a('string');

    const decryptedBuffer = await nodeRSA.decryptBufferWithRsaPrivateKey(encryptedBuffer, privateKey);
    expect(decryptedBuffer).to.be.an.instanceOf(Buffer);
    expect((decryptedBuffer as Buffer).toString()).to.equal(buffer.toString());
  });

  describe('encryptLarge / decryptLarge (hybrid)', () => {
    // A 376-byte value that overflows a 2048-bit RSA key (the reported bug).
    const longText = 'A'.repeat(376);

    it('plain encryptStringWithRsaPublicKey rejects data too large for the key', async () => {
      const nodeRSA = new NodeRSA();
      const { publicKey } = await nodeRSA.createPrivateAndPublicKeys(2048);

      let threw = false;
      try {
        await nodeRSA.encryptStringWithRsaPublicKey({ text: longText, publicKey });
      } catch (err) {
        threw = true;
        expect((err as Error).message).to.match(/too large|too long/i);
      }
      expect(threw, 'expected plain RSA to reject 376-byte input').to.equal(true);
    });

    it('encryptLarge then decryptLarge round-trips a 376-byte string', async () => {
      const nodeRSA = new NodeRSA();
      const { privateKey, publicKey } = await nodeRSA.createPrivateAndPublicKeys(2048);

      const encrypted = await nodeRSA.encryptLarge({ text: longText, publicKey });
      expect(encrypted).to.be.a('string').and.not.equal(longText);
      expect(encrypted.split(':')).to.have.lengthOf(4);

      const decrypted = await nodeRSA.decryptLarge({ text: encrypted, privateKey });
      expect(decrypted).to.equal(longText);
    });

    it('produces a different ciphertext each call (random AES key + IV)', async () => {
      const nodeRSA = new NodeRSA();
      const { publicKey } = await nodeRSA.createPrivateAndPublicKeys(2048);

      const a = await nodeRSA.encryptLarge({ text: longText, publicKey });
      const b = await nodeRSA.encryptLarge({ text: longText, publicKey });
      expect(a).to.not.equal(b);
    });

    it('round-trips a multi-kilobyte string', async () => {
      const nodeRSA = new NodeRSA();
      const { privateKey, publicKey } = await nodeRSA.createPrivateAndPublicKeys(2048);

      const huge = 'x'.repeat(10000);
      const encrypted = await nodeRSA.encryptLarge({ text: huge, publicKey });
      const decrypted = await nodeRSA.decryptLarge({ text: encrypted, privateKey });
      expect(decrypted).to.equal(huge);
    });

    it('uses keys from the constructor when not passed in args', async () => {
      const base = new NodeRSA();
      const { privateKey, publicKey } = await base.createPrivateAndPublicKeys(2048);

      const nodeRSA = new NodeRSA(publicKey, privateKey);
      const encrypted = await nodeRSA.encryptLarge({ text: longText });
      const decrypted = await nodeRSA.decryptLarge({ text: encrypted });
      expect(decrypted).to.equal(longText);
    });

    it('fails to decrypt if the ciphertext is tampered with (GCM auth)', async () => {
      const nodeRSA = new NodeRSA();
      const { privateKey, publicKey } = await nodeRSA.createPrivateAndPublicKeys(2048);

      const encrypted = await nodeRSA.encryptLarge({ text: longText, publicKey });
      const parts = encrypted.split(':');
      // Flip a byte in the ciphertext segment.
      const data = Buffer.from(parts[3], 'base64');
      data[0] ^= 0xff;
      parts[3] = data.toString('base64');
      const tampered = parts.join(':');

      let threw = false;
      try {
        await nodeRSA.decryptLarge({ text: tampered, privateKey });
      } catch (err) {
        threw = true;
        expect((err as Error).message).to.match(/Decryption failed/i);
      }
      expect(threw, 'expected tampered ciphertext to fail auth').to.equal(true);
    });

    it('rejects a malformed payload', async () => {
      const nodeRSA = new NodeRSA();
      const { privateKey } = await nodeRSA.createPrivateAndPublicKeys(2048);

      let threw = false;
      try {
        await nodeRSA.decryptLarge({ text: 'not-a-valid-payload', privateKey });
      } catch (err) {
        threw = true;
        expect((err as Error).message).to.match(/Invalid payload format|Decryption failed/i);
      }
      expect(threw).to.equal(true);
    });
  });
});
