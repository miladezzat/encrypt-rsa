/* eslint-disable max-len */
import { expect } from 'chai';
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
      // eslint-disable-next-line max-len
      publicKey: '-----BEGIN PUBLIC KEY-----\nMIGeMA0GCSqGSIb3DQEBAQUAA4GMADCBiAKBgEzCqLqxWSiOTkWFQaPhY6X+qom8\nzzbidCpNu/zxwTieMvnBE4yPCeSRwJMFjJD2UGr7I/WunOsx+rAxYbzoMELw6TdZ\naaKygSLfkncUmbL6MQ1ZCSQQR6weaQj8VeYKNaA3QSqJYXCRPky6LI/o73brTCpE\nsWuVWp577q2PbTDbAgMBAAE=\n-----END PUBLIC KEY-----',
    });
    encryptedString = encryptedText;
    expect(encryptedText).to.be.a('string').and.not.equal(text);
  });

  it('should decrypt a string to `hello world`', () => {
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

    const encryptedText = nodeRSA.decryptStringWithRsaPrivateKey({
      text: encryptedString,
      privateKey: key,
    });

    expect(encryptedText).to.be.a('string').and.equal(text);
  });
});
