# Examples

This directory contains examples of how to use the `encrypt-rsa` library in both Node.js and browser environments.

## Files

### `node-basic.js`
A Node.js example demonstrating:
- Generating RSA key pairs (2048-bit)
- Encrypting a message with the public key
- Decrypting the message with the private key
- Error handling for oversized messages

**Run it:**
```bash
npm run build
node examples/node-basic.js
```

### `browser-basic.html`
A browser example with an interactive UI that demonstrates:
- Generating RSA key pairs
- Encrypting messages in real-time
- Decrypting encrypted messages
- Error handling with user-friendly messages

**How to use:**
1. Run `npm run build`
2. Serve the repository over localhost, for example `python3 -m http.server 8080`
3. Open `http://localhost:8080/examples/browser-basic.html` in a web browser
4. Click "Generate 2048-bit RSA Keys"
5. Enter a message in the text area (up to 214 bytes for direct RSA with 2048-bit keys)
6. Click "Encrypt" to encrypt the message
7. Click "Decrypt" to decrypt the message

## Key Limitations

### Message Size Limits

RSA encryption with OAEP padding has size limitations based on the key size:

- **2048-bit key**: Maximum 214 bytes
- **4096-bit key**: Maximum 470 bytes

This is because:
- OAEP padding requires overhead for security
- The formula is: max_bytes = key_size_bytes - 2*hash_size_bytes - 2
- With SHA-1: max_bytes = 256 - 42 = 214 bytes

### When to Use This Library

✓ **Good for:**
- Encrypting encryption keys (hybrid encryption)
- Encrypting passwords or tokens
- Small to medium sized data
- Public key encryption scenarios

✗ **Not ideal for:**
- Large files or media
- Bulk data encryption
- Scenarios requiring perfect forward secrecy

## Error Handling

Both examples include error handling. Common errors and solutions:

| Error | Cause | Solution |
|-------|-------|----------|
| "data too large for key size" | Message exceeds key capacity | Use smaller message or larger key |
| "error:0906D06C:PEM routines" | Invalid PEM format | Ensure PEM headers/footers are intact |
| "error decrypting" | Wrong private key or corrupted data | Verify you're using the correct key pair |

## Next Steps

- Check the [main README.md](../README.md) for API documentation
- Review [tests/](../tests/) for more advanced usage examples
- See the [source code](../src/) for implementation details
