# Copilot Instructions for encrypt-rsa

## Project Overview
This is an RSA encryption/decryption library that works in both Node.js and browser environments. It provides symmetric key encryption using RSA public/private key pairs.

## Architecture

### Directory Structure
- **src/shared/**: Shared utilities that work in both Node and browser
- **src/node/**: Node.js-specific implementations
- **src/web/**: Browser-specific implementations
- **src/functions/**: High-level API functions
- **build/**: Compiled output (node and web builds)
- **tests/**: Test files

### Key Files
- `src/shared/types.ts`: Type definitions
- `src/shared/helpers.ts`: Shared helper functions (base64, PEM parsing, validation)
- `src/node/crypto.ts`: Node.js RSA operations
- `src/web/crypto.ts`: Web Crypto API RSA operations

## Coding Standards

### Error Handling
- Always wrap crypto operations in try-catch blocks
- Provide descriptive error messages that indicate what went wrong
- Include the original error in error messages using `${error instanceof Error ? error.message : String(error)}`

### Validation
- Validate PEM keys using `isValidPEMPublicKey()` and `isValidPEMPrivateKey()`
- Validate input text is not empty
- Check for null/undefined parameters

### Browser & Node Compatibility
- Use type guards for environment detection
- Avoid Node-specific APIs in browser code (Buffer, crypto module)
- Use Web Crypto API for browser implementations
- Use Node's crypto module for Node.js implementations

### Key Size Limitations
- RSA keys are typically 2048 or 4096 bits
- With OAEP padding, max plaintext size = key_size_bytes - 2*hash_size_bytes - 2
- 2048-bit key: max ~190 bytes
- 4096-bit key: max ~446 bytes

## Common Tasks

### Adding a New Crypto Function
1. Add type definition to `src/shared/types.ts`
2. Implement in `src/node/crypto.ts` using Node's crypto module
3. Implement in `src/web/crypto.ts` using Web Crypto API
4. Export from both `src/node/index.ts` and `src/web/index.ts`
5. Create high-level wrapper in `src/functions/` if needed
6. Add tests to `tests/functionalty.node.spec.ts` and `tests/functionalty.web.spec.ts`

### Debugging Crypto Issues
- Check PEM key format (should start with `-----BEGIN` and end with `-----END`)
- Verify key size matches the error message
- Ensure plaintext doesn't exceed maximum size
- Check that public/private keys are being used correctly (public for encrypt, private for decrypt)

## Testing
- Run `npm test` to execute tests
- Tests are in `tests/` and use Jest
- Separate tests for Node and browser implementations
- Include error case tests

## Build Process
- TypeScript is compiled to both CommonJS (Node) and ES modules (Web)
- Output is in `build/` directory
- Documentation is generated using TypeDoc
