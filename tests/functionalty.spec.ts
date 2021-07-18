import { expect } from 'chai';
import path from 'path';
import NodeRSA from '../src/index';

describe('Functionality', () => {
  const text:string = 'hell world';
  let encryptedString:string = '';

  it('should create instance from NodeRSa', () => {
    const nodeRSA = new NodeRSA();
    expect(nodeRSA).to.an.instanceOf(NodeRSA);
  });

  it('should encrypt `hello world`', () => {
    const nodeRSA = new NodeRSA();

    const encryptedText = nodeRSA.encryptStringWithRsaPublicKey({
      text,
      keyPath: path.join(__dirname, './resources/public-key'),
    });

    encryptedString = encryptedText;
    expect(encryptedText).to.be.a('string').and.not.equal(text);
  });

  it('should decrypt a string to `hello world`', () => {
    const nodeRSA = new NodeRSA();

    const encryptedText = nodeRSA.decryptStringWithRsaPrivateKey({
      text: encryptedString,
      keyPath: path.join(__dirname, './resources/private-key'),
    });

    expect(encryptedText).to.be.a('string').and.equal(text);
  });
});
