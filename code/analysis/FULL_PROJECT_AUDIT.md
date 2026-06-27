# encrypt-rsa full project audit

Date: 2026-06-28 Africa/Cairo
Workspace: `/Users/miladfahmy/Documents/milad/encrypt-rsa`
Branch: `milad/fix-issues`
Audit mode: repository audit with 4 parallel sub-agents, coordinator verification, and remediation pass

## Executive summary

### Current branch status

The `milad/fix-issues` branch addresses the confirmed audit findings found in the original read-only pass:

- Removed `.github/copilot-instructions.md` and added `AGENTS.md`.
- Fixed package install/publish safety with clean builds, package smoke tests, packed install smoke tests, and CI coverage for lint/build/test/smoke.
- Fixed package metadata, CommonJS entry behavior, browser global build output, examples, README, changelog, license metadata, and generated docs.
- Fixed legacy source barrel exports and renamed `convertKetToBase64` to `convertKeyToBase64`.
- Fixed RSA-OAEP chunk sizing to the correct 214-byte 2048-bit SHA-1 OAEP boundary and added regression tests.
- Fixed missing-key behavior so async API failures reject instead of throwing synchronously.
- Removed generated Compodoc template playground files and added a docs cleanup step.
- Reduced npm audit from vulnerable to `found 0 vulnerabilities`.

Verification run after remediation:

```bash
npm run lint
npm test
npm audit --omit=optional
npm run docs
npm run build
npm run smoke
npm run smoke:install
npm pack --dry-run
```

All commands passed. The final dry-run package contained 26 files and no stale `convertKetToBase64` build artifacts.

### Original audit summary

The project builds and its current source-level tests pass, but the publish and user-facing surfaces are not healthy enough to call the project release-ready.

The most serious confirmed issue is that a packed package install fails in a clean temporary consumer because package lifecycle scripts run `husky install` even though Husky is not installed for consumers. The second serious issue is that both documented examples are broken because they use stale build paths and stale API shape. The third major risk is that CI tests source files directly and does not validate the packed package, built entry points, examples, lint, or install lifecycle, so the current broken consumer paths are not caught before merge.

Core runtime code in `src/node` and `src/web` is better than the stale root implementation, and the current runtime tests pass. However, the repo still contains an old sync implementation under `src/index.ts` and `src/functions/*`; one barrel file in that old path exports the wrong functions under the wrong names. That file is not currently shipped by the package build, but it is dangerous if maintainers or source consumers use it.

## What was audited

### Sub-agent split

Four read-only sub-agents were used with non-overlapping scopes:

1. Library implementation:
   - `src/index.ts`
   - `src/functions/*`
   - `src/node/*`
   - `src/web/*`
   - `src/shared/*`
   - `src/utils/*`

2. Tests, examples, and primary user docs:
   - `tests/*`
   - `examples/*`
   - `README.md`
   - `CHANGELOG.md`
   - `CODE_OF_CONDUCT.md`
   - `LICENSE`
   - `CNAME`

3. Package, TypeScript config, CI, release, lockfile, and repo automation:
   - `package.json`
   - `package-lock.json`
   - `tsconfig*.json`
   - ESLint config
   - `.github/*`
   - `.husky/pre-commit`
   - npm/git metadata files

4. Docs site and generated/tracked documentation:
   - `docs/FEATURE_PARITY.md`
   - `docs/template-playground/*`
   - `docs/template-playground-app/*`
   - generated Compodoc HTML/JS/CSS/assets

### Coordinator verification

Commands run:

```bash
git status --short
git ls-files
npm test
npm run build
npm run lint
npm audit --omit=optional
npm pack --dry-run
node examples/node-basic.js
node -e "const NodeRSA=require('./build/node/node/index.js').default; ..."
tmpdir=$(mktemp -d); npm pack --ignore-scripts --pack-destination "$tmpdir"; npm init; npm install "$tmpdir/encrypt-rsa-5.0.1.tgz"
```

Observed results:

- `git status --short`: clean before report creation.
- `npm test`: passed, 24 passing.
- `npm run build`: passed.
- `npm run lint`: passed.
- `npm audit --omit=optional`: failed with 33 vulnerabilities, including 1 critical and 9 high.
- `npm pack --dry-run`: passed and showed 23 published files.
- `node examples/node-basic.js`: failed with `MODULE_NOT_FOUND`.
- Direct built Node entry smoke test via `./build/node/node/index.js`: passed.
- Temporary packed-package consumer install: failed with `sh: husky: command not found`.

## Coverage accounting

### Tracked file count

`git ls-files` returned 155 tracked files.

### Human-authored source/test/config/docs files read line-by-line

These were read directly with line numbers and/or by a sub-agent:

- `.eslintignore`
- `.eslintrc.json`
- `.github/FUNDING.yml`
- `.github/ISSUE_TEMPLATE/bug_report.md`
- `.github/ISSUE_TEMPLATE/feature_request.md`
- `.github/PULL_REQUEST_TEMPLATE.md`
- `.github/copilot-instructions.md`
- `.github/workflows/publish.yml`
- `.github/workflows/testing.yml`
- `.gitignore`
- `.husky/pre-commit`
- `.npmignore`
- `.nvmrc`
- `.versionrc.json`
- `CHANGELOG.md`
- `CNAME`
- `CODE_OF_CONDUCT.md`
- `LICENSE`
- `README.md`
- `examples/README.md`
- `examples/browser-basic.html`
- `examples/node-basic.js`
- `package.json`
- `package-lock.json`
- `src/functions/convertKetToBase64.ts`
- `src/functions/createPrivateAndPublicKeys.ts`
- `src/functions/decrypt.ts`
- `src/functions/decryptStringWithRsaPrivateKey.ts`
- `src/functions/encrypt.ts`
- `src/functions/encryptStringWithRsaPublicKey.ts`
- `src/functions/index.ts`
- `src/index.ts`
- `src/node/convertKetToBase64.ts`
- `src/node/crypto.ts`
- `src/node/index.ts`
- `src/shared/helpers.ts`
- `src/shared/types.ts`
- `src/utils/helpers.ts`
- `src/utils/types.ts`
- `src/web/convertKetToBase64.ts`
- `src/web/crypto.ts`
- `src/web/index.ts`
- `tests/functionalty.node.spec.ts`
- `tests/functionalty.web.spec.ts`
- `tsconfig.doc.json`
- `tsconfig.json`
- `tsconfig.node.json`
- `tsconfig.web.json`
- `docs/FEATURE_PARITY.md`
- `docs/template-playground/default-templates.json`
- `docs/template-playground/hbs-render.service.ts`
- `docs/template-playground/main.ts`
- `docs/template-playground/template-editor.service.ts`
- `docs/template-playground/template-playground.component.ts`
- `docs/template-playground/template-playground.module.ts`
- `docs/template-playground/zip-export.service.ts`

### Generated/vendor/tracked docs assets accounted for

The generated docs tree was inventoried by category and checked for stale public output, broken links, inconsistent license output, stale RSA size guidance, playground behavior, and exposed/static-site risks.

Generated/tracked docs categories:

- `docs/*.html`
- `docs/classes/*.html`
- `docs/interfaces/*.html`
- `docs/miscellaneous/*.html`
- `docs/js/**`
- `docs/styles/**`
- `docs/fonts/**`
- `docs/images/**`
- `docs/graph/dependencies.svg`
- `docs/template-playground-app/**`

Count observed: 107 tracked docs files and more than 23,549 lines under `docs/`.

Important caveat: minified/vendor/generated docs assets were not treated as hand-maintained source code. They were accounted for and inspected for publication risks, but the meaningful semantic audit target is the source/config/tests/docs inputs that generate or publish them.

## Architecture overview

The package currently has three implementation surfaces:

1. Current Node build:
   - Source: `src/node/*`
   - Build output: `build/node/node/*`
   - Package entry: `package.json` `main`, `module`, and conditional `exports.require.node` / `exports.import.node`
   - API shape: async class methods returning `Promise`

2. Current Web build:
   - Source: `src/web/*`
   - Shared helpers: `src/shared/*`
   - Build output: `build/web/web/*`
   - Package entry: `package.json` `browser` and conditional `exports` `default`
   - API shape: async class methods returning `Promise`

3. Old root/functions implementation:
   - Source: `src/index.ts` and `src/functions/*`
   - Helper/types: `src/utils/*`
   - API shape: synchronous class methods
   - Current build configs do not include this path in `tsconfig.node.json` or `tsconfig.web.json`

The old implementation is the main internal duplication problem. It creates stale docs risk and developer confusion even if not shipped.

## Findings by severity

### P0 / Critical

No P0 exploit or data-loss issue was confirmed in the shipped runtime package.

### P1 / High

#### H1. Packed package install can fail for consumers

Files:

- `package.json:29`
- `package.json:33`
- `package.json:34`

Evidence:

```json
"prepare": "husky install",
"postinstall": "husky install",
"prepublishOnly": "pinst --disable"
```

Observed failure:

```text
npm error command sh -c husky install
npm error sh: husky: command not found
```

Impact:

A clean consumer installing a packed tarball can fail before the package is usable. This is a real package-consumption bug, confirmed by a temporary install smoke test.

Root cause:

Husky is a dev dependency, but `postinstall` runs in the installed package. `pinst` may help during the exact `npm publish` lifecycle, but it does not protect all pack/install paths and makes the package fragile.

Fix:

- Remove `postinstall`.
- Keep Husky setup local to contributors only.
- Prefer `prepare` guarded for repo-local use, or replace with explicit developer setup docs.
- Add a CI check that packs the package and installs it into a clean temp project.

Suggested verification:

```bash
npm run build
npm pack --ignore-scripts
tmpdir=$(mktemp -d)
mkdir "$tmpdir/consumer"
cd "$tmpdir/consumer"
npm init -y
npm install /path/to/encrypt-rsa-5.0.1.tgz
node -e "const NodeRSA = require('encrypt-rsa').default || require('encrypt-rsa'); console.log(typeof NodeRSA)"
```

#### H2. Node example is not runnable

Files:

- `examples/node-basic.js:4-8`
- `examples/node-basic.js:12`
- `examples/node-basic.js:21`
- `examples/node-basic.js:29`
- `README.md:269-272`

Evidence:

`examples/node-basic.js` imports:

```js
} = require('../build/node/index.js');
```

But actual build output is:

```text
build/node/node/index.js
```

Observed failure:

```text
Error: Cannot find module '../build/node/index.js'
Require stack:
- /Users/miladfahmy/Documents/milad/encrypt-rsa/examples/node-basic.js
```

The example also destructures named functions and calls them synchronously, while the documented current API is default-class and async:

```ts
import NodeRSA from 'encrypt-rsa';
const nodeRSA = new NodeRSA();
const { publicKey, privateKey } = await nodeRSA.createPrivateAndPublicKeys(2048);
```

Impact:

Users following the README are immediately sent into a broken example. CI does not catch it because tests import source files, not examples or packed artifacts.

Fix:

- Rewrite `examples/node-basic.js` to use the current default class API.
- Import from package root where possible after `npm pack`/install, not from internal build paths.
- Add an example smoke test in CI.

#### H3. Browser example is not runnable as documented

Files:

- `examples/browser-basic.html:229`
- `examples/browser-basic.html:246`
- `examples/browser-basic.html:271`
- `examples/browser-basic.html:299`
- `examples/README.md:26-31`
- `README.md:274`

Evidence:

The example loads:

```html
<script src="../build/web/index.js"></script>
```

But actual build output is:

```text
build/web/web/index.js
```

The example then expects:

```js
encryptRSA.createPrivateAndPublicKeys(...)
encryptRSA.encryptStringWithRsaPublicKey(...)
encryptRSA.decryptStringWithRsaPrivateKey(...)
```

The TypeScript build emits CommonJS-style output, not a browser global named `encryptRSA`.

Impact:

The browser example cannot work by simply opening the HTML file, contrary to docs.

Fix:

- Either produce a real browser global/IIFE/UMD bundle for examples.
- Or convert the example to an ES module with a bundler/dev-server instruction.
- Update `examples/README.md` and main `README.md` accordingly.
- Add a browser/example smoke test, ideally with Playwright or a simple static-page check after bundling.

#### H4. CI does not validate the package surface

Files:

- `.github/workflows/testing.yml:26-27`
- `.github/workflows/publish.yml:29-35`

Evidence:

Testing workflow only runs:

```yaml
- run: npm install
- run: npm test
```

It does not run:

- `npm run build`
- `npm run lint`
- `npm pack --dry-run`
- packed package install smoke test
- examples smoke test

Publish workflow runs build only after merge to `master`.

Impact:

Broken package lifecycle, broken examples, and mismatched build output can reach `master` because PR CI only proves source tests pass.

Fix:

Use `npm ci` and add:

```yaml
- run: npm run lint
- run: npm run build
- run: npm test
- run: npm pack --dry-run
- run: node examples/node-basic.js
```

For the consumer install smoke test, pack into a temp directory and install it in a clean project.

#### H5. `src/functions/index.ts` exports wrong defaults

File:

- `src/functions/index.ts:1-14`

Evidence:

Examples:

```ts
export { default as createPrivateAndPublicKeys } from './decryptStringWithRsaPrivateKey';
export { default as decrypt } from './encryptStringWithRsaPublicKey';
export { default as decryptStringWithRsaPrivateKey } from './decrypt';
export { default as encrypt } from './decryptStringWithRsaPrivateKey';
export { default as encryptStringWithRsaPublicKey } from './encrypt';
```

Impact:

Any consumer importing from this barrel gets the wrong function. This is not currently included in the published build configs, so this is not a current package-root runtime failure. It is still a high-risk maintenance trap and a serious source-level correctness bug.

Fix:

Either delete the old `src/functions` path if it is intentionally dead, or correct the barrel:

```ts
export * from './createPrivateAndPublicKeys';
export { default as createPrivateAndPublicKeys } from './createPrivateAndPublicKeys';
export * from './decrypt';
export { default as decrypt } from './decrypt';
export * from './decryptStringWithRsaPrivateKey';
export { default as decryptStringWithRsaPrivateKey } from './decryptStringWithRsaPrivateKey';
export * from './encrypt';
export { default as encrypt } from './encrypt';
export * from './encryptStringWithRsaPublicKey';
export { default as encryptStringWithRsaPublicKey } from './encryptStringWithRsaPublicKey';
```

Preferred fix: remove or quarantine the old sync implementation if the supported package is `src/node` and `src/web`.

### P2 / Medium

#### M1. Package metadata advertises module/browser formats that are not actually emitted

Files:

- `package.json:5-19`
- `tsconfig.json:4`
- `tsconfig.web.json:3-7`

Evidence:

`package.json` declares:

```json
"main": "./build/node/node/index.js",
"module": "./build/node/node/index.js",
"browser": "./build/web/web/index.js"
```

Base TypeScript config emits:

```json
"module": "commonjs"
```

`tsconfig.web.json` does not override module format.

Impact:

Bundlers may treat `module` as ESM even though it points to CommonJS. Browser consumers may expect the `browser` field to be directly loadable, but it is not a standalone global browser bundle.

Fix:

Choose and document one of these packaging strategies:

1. CommonJS only:
   - Remove misleading `module`.
   - Keep conditional exports only for Node/browser CommonJS-compatible bundlers.

2. Dual CJS/ESM:
   - Emit separate CJS and ESM builds.
   - Add correct `exports.import`, `exports.require`, and `types`.

3. Browser global support:
   - Add a bundler step for `dist/encrypt-rsa.global.js`.
   - Point examples to that file.

#### M2. Node async wrappers can throw synchronously

Files:

- `src/node/index.ts:56-60`
- `src/node/index.ts:63-67`
- `src/node/index.ts:76-90`
- `src/node/index.ts:93-108`

Evidence:

Pattern:

```ts
return Promise.resolve(
  encryptStringWithRsaPublicKey({ ...args, publicKey: convertKetToBase64(publicKey as string) }),
);
```

The crypto call is evaluated before `Promise.resolve`. If it throws, the method throws synchronously.

Impact:

The documented API says methods return promises. Users relying on `.catch()` may miss errors if a method throws before returning a promise.

Fix:

Make wrapper methods `async`:

```ts
public async encryptStringWithRsaPublicKey(args: parametersOfEncrypt): Promise<string> {
  const { publicKey = this.publicKey } = args;
  return encryptStringWithRsaPublicKey({ ...args, publicKey: convertKetToBase64(publicKey as string) });
}
```

Add tests for both `await expectRejects` and `.catch()` behavior.

#### M3. Optional key types are treated as required at runtime

Files:

- `src/shared/types.ts:20-23`
- `src/shared/types.ts:32-35`
- `src/shared/types.ts:44-47`
- `src/shared/types.ts:56-59`
- `src/node/index.ts:56-60`
- `src/web/index.ts:56-61`
- `src/index.ts:68-82`

Evidence:

Types allow missing keys:

```ts
publicKey?: string;
privateKey?: string;
```

Wrappers later cast to string:

```ts
convertKetToBase64(publicKey as string)
```

Impact:

Missing keys produce unclear runtime errors instead of compile-time errors or clear validation messages. Optional keys make sense only because constructor keys may be used, but the type system does not express "either constructor key or argument key is required".

Fix:

- Add explicit runtime validation with clear messages:
  - `Public key is required. Pass args.publicKey or construct NodeRSA(publicKey, ...).`
  - `Private key is required. Pass args.privateKey or construct NodeRSA(..., privateKey).`
- Consider stricter API overloads or constructor-state-specific methods if the project wants stronger type safety.

#### M4. SHA-1 OAEP is hardcoded

Files:

- `src/node/crypto.ts:15-18`
- `src/web/crypto.ts:33`
- `src/web/crypto.ts:53`
- `src/web/crypto.ts:229`
- `README.md:223`
- `docs/FEATURE_PARITY.md:19`

Evidence:

Node:

```ts
oaepHash: 'sha1' as const
```

Web:

```ts
{ name: 'RSA-OAEP', hash: 'SHA-1' }
```

Impact:

SHA-1 OAEP is used for Node/Web compatibility. That may be a valid compatibility choice, but for new encrypted payloads SHA-256 is normally preferable. If changed naively, existing ciphertext compatibility breaks.

Fix:

- Keep current behavior only if backward compatibility is required and document it clearly.
- Add a versioned option such as `{ hash: 'SHA-256' }` for new payloads.
- If changing defaults, make it a major release and provide migration notes.

#### M5. RSA size-limit docs are wrong and inconsistent

Files:

- `README.md:282-292`
- `examples/README.md:37-45`
- `docs/index.html:328`
- `docs/miscellaneous/functions.html:806`
- `docs/miscellaneous/functions.html:856`
- `src/shared/helpers.ts:141-149`

Evidence:

README says 2048-bit max is about `190 bytes`. Generated docs and helper comments mention `245 bytes`.

For RSA-OAEP with SHA-1:

```text
max = key_bytes - 2 * hash_bytes - 2
max = 256 - 2 * 20 - 2
max = 214 bytes
```

Impact:

Users may reject valid payloads unnecessarily or hit unexpected errors when relying on stale `245` guidance.

Fix:

- Replace 190/245 guidance with 214 bytes for 2048-bit RSA-OAEP/SHA-1.
- For 4096-bit RSA-OAEP/SHA-1, document 470 bytes.
- Add boundary tests:
  - 214 ASCII bytes encrypts
  - 215 ASCII bytes fails
- Regenerate docs after source comment updates.

#### M6. `splitIntoChunks` can corrupt Unicode

File:

- `src/shared/helpers.ts:149-160`

Evidence:

The helper encodes text to UTF-8 bytes, slices by byte count, and decodes each slice independently:

```ts
const bytes = new TextEncoder().encode(text);
const chunk = bytes.slice(i, i + chunkSize);
chunks.push(new TextDecoder().decode(chunk));
```

Impact:

If a chunk boundary splits a multibyte character, decoding that slice can insert replacement characters. This corrupts data.

Current package impact:

This helper is exported from the package via `src/node/index.ts` and `src/web/index.ts`, but the main runtime uses `encryptLarge` for arbitrary length payloads. The helper is still public and should be correct or removed.

Fix:

- Avoid string chunking by raw UTF-8 byte slices unless reassembly happens at byte level before decoding.
- Prefer documenting `encryptLarge` as the supported large-payload API.
- Remove `splitIntoChunks` from public exports if not supported.

#### M7. Old sync implementation conflicts with current async implementation

Files:

- `src/index.ts:68-113`
- `src/index.ts:123-137`
- `src/functions/*`
- `src/node/index.ts`
- `src/web/index.ts`

Evidence:

Old root class methods return synchronous `string` / `Buffer` values. New Node/Web classes implement `INodeRSA` and return `Promise`.

Impact:

Maintainers can accidentally update or document the wrong implementation. Tools such as Compodoc may also read the wrong source if configs drift.

Fix:

- If old root implementation is not supported, remove it.
- If kept for compatibility, add tests and build config for it, and document it as a legacy path.
- Prefer one canonical implementation tree plus environment-specific crypto adapters.

#### M8. Tests bypass the package artifacts users consume

Files:

- `tests/functionalty.node.spec.ts:3`
- `tests/functionalty.web.spec.ts:7-8`

Evidence:

Tests import source directly:

```ts
import NodeRSA from '../src/node/index';
import NodeRSA from '../src/web/index';
```

Impact:

Tests can pass while the published package, package root, build paths, install lifecycle, and examples are broken. This exact mismatch exists now.

Fix:

Add smoke tests that run after build:

- `require('.')` or install packed tarball and `require('encrypt-rsa')`
- package root ESM import if ESM support is claimed
- `node examples/node-basic.js`
- browser example/bundle check if browser example remains supported

#### M9. Node test assertions are weak

Files:

- `tests/functionalty.node.spec.ts:6`
- `tests/functionalty.node.spec.ts:71`
- `tests/functionalty.node.spec.ts:78`
- `tests/functionalty.node.spec.ts:92`
- `tests/functionalty.node.spec.ts:99`

Evidence:

`text` is:

```ts
const text: string = 'hell world';
```

Later tests encrypt `hello world`, then compare ciphertext to `text`, which is a different string. Decryption assertions use:

```ts
expect(decryptText).be.a.string('hello world');
```

That is weaker than exact equality.

Impact:

Incorrect plaintext with extra content may pass if it satisfies Chai string semantics.

Fix:

Use:

```ts
expect(decryptText).to.equal('hello world');
```

Also correct `hell world` to `hello world` where intended.

#### M10. Dev dependency audit exposure is significant

Files:

- `package.json:43-65`
- `package-lock.json`

Observed audit result:

```text
33 vulnerabilities (5 low, 18 moderate, 9 high, 1 critical)
```

Examples from audit:

- `handlebars`: critical advisories
- `cross-spawn`: high
- `flatted`: high
- `lodash`: high
- `marked`: high
- `minimatch`: high
- `serialize-javascript`: high
- `tmp`: high
- `ws`: high

Impact:

The runtime package has no production dependencies, so end users are less exposed. CI, docs generation, local development, and release tooling are exposed.

Fix:

- Upgrade direct dev dependencies.
- Remove unused dev tools (`npm-check`, `generate-changelog`, stale docs tooling) if not needed.
- Pin and upgrade docs generator tooling.
- Re-run `npm audit`.

#### M11. License metadata is inconsistent

Files:

- `package.json:97`
- `LICENSE:1`
- `docs/properties.html:133`
- `docs/license.html:103`

Evidence:

`package.json` says:

```json
"license": "ISC"
```

`LICENSE` contains MIT license text.

Impact:

Consumers and public docs receive conflicting legal terms.

Fix:

Choose one license and align:

- `package.json`
- `LICENSE`
- generated docs
- README badges/text if any

#### M12. README/changelog release notes are stale

Files:

- `README.md:13-23`
- `CHANGELOG.md:5`
- `CHANGELOG.md:23`
- `package.json:3`

Evidence:

Package version is `5.0.1`, but README still says upgrade/publish as `4.0.0`. Changelog starts at `5.0.0` and still includes text saying package version `4.0.0`. There is no `5.0.1` changelog entry.

Impact:

Users cannot trust upgrade instructions and release history.

Fix:

- Add `5.0.1` changelog entry.
- Replace stale `4.0.0` wording.
- Clearly separate `4.x` breaking async changes from `5.x` changes.

#### M13. Public docs contain broken links

Files:

- `docs/index.html:116`
- `docs/index.html:137`
- `docs/index.html:310`
- `docs/index.html:444`

Evidence:

Generated docs link to paths not present under `docs/`, including:

- `./CHANGELOG.md`
- `docs/FEATURE_PARITY.md`
- `./examples/*`
- `./.github/workflows/publish.yml`

Impact:

The public docs site has broken navigation.

Fix:

- Adjust docs generation base path.
- Copy linked markdown/examples into docs output if intended.
- Use absolute GitHub links for repo files not deployed to the static docs site.

#### M14. Template playground static app is stale and risky

Files:

- `docs/template-playground-app/index.html:17`
- `docs/template-playground-app/index.html:435`
- `docs/template-playground-app/app.js:62`
- `docs/template-playground-app/app.js:1032`
- `docs/template-playground-app/app.js:1217`
- `docs/template-playground/template-playground.component.ts:554-558`
- `docs/template-playground/default-templates.json:9`
- `docs/template-playground/default-templates.json:126`

Evidence:

The published playground app loads CDN dependencies without SRI and calls same-origin `/api/session/...` routes. The maintained Angular source still contains a TODO reset implementation, and default templates are placeholder content. The generated app and source appear divergent.

Impact:

On static hosting, the playground is broken. On a host with matching same-origin endpoints, it may expose template/session routes publicly. The unsandboxed preview iframe increases the risk of executing arbitrary edited template output in the docs origin.

Fix:

- Decide whether the playground belongs in published docs.
- If static docs only, remove or disable the playground.
- If keeping it, sandbox the iframe, add SRI or self-host dependencies, document required backend endpoints, and align source with generated app.

### P3 / Low

#### L1. `convertKetToBase64` typo is public/internal naming debt

Files:

- `src/node/convertKetToBase64.ts:7`
- `src/web/convertKetToBase64.ts:7`
- `src/functions/convertKetToBase64.ts:12`

Evidence:

The function and filename say `Ket`, not `Key`.

Impact:

This typo leaks into internal imports and may become public if exported. It hurts maintainability and searchability.

Fix:

Rename to `convertKeyToBase64`, optionally keep a deprecated alias if any public deep import is supported.

#### L2. Duplicate conversion helpers

Files:

- `src/node/convertKetToBase64.ts`
- `src/web/convertKetToBase64.ts`
- `src/functions/convertKetToBase64.ts`

Impact:

Duplicated identical logic increases drift risk.

Fix:

Move to shared helper and import from one place.

#### L3. `src/utils/*` duplicates `src/shared/*`

Files:

- `src/utils/helpers.ts`
- `src/utils/types.ts`
- `src/shared/helpers.ts`
- `src/shared/types.ts`

Impact:

Old root/functions implementation uses stale Node-only helpers, while current Node/Web builds use shared helpers. This makes future changes easy to apply to the wrong file.

Fix:

Delete `src/utils/*` if old implementation is removed. Otherwise replace with imports from `src/shared/*`.

#### L4. `.gitignore` ignores a tracked lockfile

Files:

- `.gitignore:10`
- `package-lock.json`

Impact:

Lockfile is tracked, but `.gitignore` says to ignore it. This confuses contributors and can hide lockfile workflow intent.

Fix:

Remove `package-lock.json` from `.gitignore` and switch CI to `npm ci`.

#### L5. Docs script uses unpinned `npx`

File:

- `package.json:39`

Evidence:

```json
"docs": "npx @compodoc/compodoc -p tsconfig.doc.json -d docs"
```

Impact:

Docs generation can change without a lockfile update because `npx` may fetch a newer Compodoc version.

Fix:

Add `@compodoc/compodoc` as a dev dependency and run it through `npx compodoc` or an npm bin.

#### L6. Copilot instructions mention Jest while project uses Mocha

Files:

- `.github/copilot-instructions.md:64`
- `package.json:27`

Impact:

Automation and contributors can follow the wrong testing guidance.

Fix:

Update instructions to Mocha/Chai and current commands.

#### L7. Code of Conduct has placeholder contact

File:

- `CODE_OF_CONDUCT.md:32`

Impact:

Abuse reporting process is incomplete.

Fix:

Replace `[INSERT EMAIL ADDRESS]` with the real maintainer contact or security/reporting channel.

#### L8. Test filenames contain typo

Files:

- `tests/functionalty.node.spec.ts`
- `tests/functionalty.web.spec.ts`
- `README.md:382-383`

Impact:

Minor project polish issue.

Fix:

Rename to `functionality.*.spec.ts` and update references.

## Positive findings

- Runtime has zero production dependencies according to `npm ls --omit=dev --depth=0`.
- `npm test` passes with 24 tests.
- `npm run build` passes.
- `npm run lint` passes.
- Node/Web `encryptLarge` interoperability is tested in both directions.
- AES-GCM tamper failure is tested.
- Package dry-run includes only intended package files, not the full repo or docs tree.
- Direct built Node entry smoke test works with `build/node/node/index.js`.

## Prioritized remediation roadmap

### Phase 1: Stop consumer-facing breakage

1. Remove `postinstall` from `package.json`.
2. Keep Husky contributor-only.
3. Verify temp packed-package install succeeds.
4. Fix `examples/node-basic.js` to use current async class API.
5. Either fix browser example with a real browser bundle or remove "open HTML directly" instructions.
6. Add package-root and example smoke tests.

Acceptance:

- `npm run build` passes.
- `npm test` passes.
- `npm run lint` passes.
- `npm pack --dry-run` passes.
- Temp consumer can install packed tarball.
- Node example runs successfully.

### Phase 2: Make CI protect the real package

1. Switch workflows from `npm install` to `npm ci`.
2. Run lint, build, test, pack dry-run, and packed install smoke in PR CI.
3. Keep publish workflow as a second gate, not the first build gate.

Acceptance:

- PR CI fails if examples/build/package install are broken.

### Phase 3: Clean implementation surfaces

1. Decide whether `src/index.ts` and `src/functions/*` are supported.
2. If unsupported, delete or move them out of source.
3. If supported, fix `src/functions/index.ts`, add tests, and document the legacy sync API.
4. Unify duplicate helpers/types.
5. Add explicit missing-key validation.
6. Make Node wrappers truly async.

Acceptance:

- One documented package API.
- No stale implementation path that can silently rot.
- Missing-key errors are clear and tested.
- Promise API rejects consistently.

### Phase 4: Correct crypto documentation and compatibility strategy

1. Document RSA-OAEP/SHA-1 compatibility explicitly.
2. Correct max plaintext sizes.
3. Add 214/215 byte boundary tests for 2048-bit RSA-OAEP/SHA-1.
4. Decide whether to add SHA-256 option or versioned payloads.

Acceptance:

- README, examples, docs, source comments, and tests agree.

### Phase 5: Docs and release hygiene

1. Align license metadata.
2. Fix README/changelog version drift.
3. Regenerate docs after source/docs changes.
4. Fix broken docs links.
5. Remove or harden template playground.
6. Pin docs generation dependency.

Acceptance:

- Static docs links resolve.
- License is consistent everywhere.
- Docs do not publish stale package guidance.

### Phase 6: Dependency maintenance

1. Remove unused dev tools.
2. Upgrade direct dev dependencies.
3. Run `npm audit`.
4. Document remaining accepted dev-only audit risk if any remains.

Acceptance:

- No critical/high audit findings in dev tooling, or each remaining finding is documented with an explicit reason.

## Suggested test additions

### Packed package install smoke

```bash
npm run build
tmpdir=$(mktemp -d)
npm pack --ignore-scripts --pack-destination "$tmpdir"
mkdir "$tmpdir/consumer"
cd "$tmpdir/consumer"
npm init -y
npm install "$tmpdir"/encrypt-rsa-*.tgz
node -e "const mod = require('encrypt-rsa'); const NodeRSA = mod.default || mod; console.log(typeof NodeRSA)"
```

### Built API smoke

```js
const NodeRSA = require('../build/node/node/index.js').default;

(async () => {
  const rsa = new NodeRSA();
  const { publicKey, privateKey } = await rsa.createPrivateAndPublicKeys();
  const encrypted = await rsa.encryptStringWithRsaPublicKey({ text: 'ok', publicKey });
  const decrypted = await rsa.decryptStringWithRsaPrivateKey({ text: encrypted, privateKey });
  if (decrypted !== 'ok') throw new Error('round trip failed');
})();
```

### Promise rejection behavior

```ts
const rsa = new NodeRSA();
await expectRejects(
  rsa.encryptStringWithRsaPublicKey({ text: 'ok' }),
  /public key is required/i,
);
```

### RSA boundary behavior

```ts
const ok = 'a'.repeat(214);
const tooLong = 'a'.repeat(215);
await rsa.encryptStringWithRsaPublicKey({ text: ok, publicKey });
await expectRejects(
  rsa.encryptStringWithRsaPublicKey({ text: tooLong, publicKey }),
  /too large|too long/i,
);
```

## Full tracked-file manifest

This is the repo coverage manifest from `git ls-files`, grouped by area.

### Root and metadata

- `.eslintignore`
- `.eslintrc.json`
- `.gitignore`
- `.npmignore`
- `.nvmrc`
- `.versionrc.json`
- `CHANGELOG.md`
- `CNAME`
- `CODE_OF_CONDUCT.md`
- `LICENSE`
- `README.md`
- `package-lock.json`
- `package.json`
- `tsconfig.doc.json`
- `tsconfig.json`
- `tsconfig.node.json`
- `tsconfig.web.json`

### GitHub and Husky

- `.github/FUNDING.yml`
- `.github/ISSUE_TEMPLATE/bug_report.md`
- `.github/ISSUE_TEMPLATE/feature_request.md`
- `.github/PULL_REQUEST_TEMPLATE.md`
- `.github/copilot-instructions.md`
- `.github/workflows/publish.yml`
- `.github/workflows/testing.yml`
- `.husky/pre-commit`

### Source

- `src/functions/convertKetToBase64.ts`
- `src/functions/createPrivateAndPublicKeys.ts`
- `src/functions/decrypt.ts`
- `src/functions/decryptStringWithRsaPrivateKey.ts`
- `src/functions/encrypt.ts`
- `src/functions/encryptStringWithRsaPublicKey.ts`
- `src/functions/index.ts`
- `src/index.ts`
- `src/node/convertKetToBase64.ts`
- `src/node/crypto.ts`
- `src/node/index.ts`
- `src/shared/helpers.ts`
- `src/shared/types.ts`
- `src/utils/helpers.ts`
- `src/utils/types.ts`
- `src/web/convertKetToBase64.ts`
- `src/web/crypto.ts`
- `src/web/index.ts`

### Tests

- `tests/functionalty.node.spec.ts`
- `tests/functionalty.web.spec.ts`

### Examples

- `examples/README.md`
- `examples/browser-basic.html`
- `examples/node-basic.js`

### Docs maintained files

- `docs/CNAME`
- `docs/FEATURE_PARITY.md`
- `docs/template-playground/default-templates.json`
- `docs/template-playground/hbs-render.service.ts`
- `docs/template-playground/main.ts`
- `docs/template-playground/template-editor.service.ts`
- `docs/template-playground/template-playground.component.ts`
- `docs/template-playground/template-playground.module.ts`
- `docs/template-playground/zip-export.service.ts`

### Docs generated site and assets

- `docs/changelog.html`
- `docs/classes/NodeRSA.html`
- `docs/coverage.html`
- `docs/fonts/ionicons.eot`
- `docs/fonts/ionicons.svg`
- `docs/fonts/ionicons.ttf`
- `docs/fonts/ionicons.woff`
- `docs/fonts/ionicons.woff2`
- `docs/fonts/roboto-v15-latin-300.eot`
- `docs/fonts/roboto-v15-latin-300.svg`
- `docs/fonts/roboto-v15-latin-300.ttf`
- `docs/fonts/roboto-v15-latin-300.woff`
- `docs/fonts/roboto-v15-latin-300.woff2`
- `docs/fonts/roboto-v15-latin-700.eot`
- `docs/fonts/roboto-v15-latin-700.svg`
- `docs/fonts/roboto-v15-latin-700.ttf`
- `docs/fonts/roboto-v15-latin-700.woff`
- `docs/fonts/roboto-v15-latin-700.woff2`
- `docs/fonts/roboto-v15-latin-italic.eot`
- `docs/fonts/roboto-v15-latin-italic.svg`
- `docs/fonts/roboto-v15-latin-italic.ttf`
- `docs/fonts/roboto-v15-latin-italic.woff`
- `docs/fonts/roboto-v15-latin-italic.woff2`
- `docs/fonts/roboto-v15-latin-regular.eot`
- `docs/fonts/roboto-v15-latin-regular.svg`
- `docs/fonts/roboto-v15-latin-regular.ttf`
- `docs/fonts/roboto-v15-latin-regular.woff`
- `docs/fonts/roboto-v15-latin-regular.woff2`
- `docs/graph/dependencies.svg`
- `docs/images/compodoc-vectorise-inverted.png`
- `docs/images/compodoc-vectorise-inverted.svg`
- `docs/images/compodoc-vectorise.png`
- `docs/images/compodoc-vectorise.svg`
- `docs/images/coverage-badge-documentation.svg`
- `docs/images/favicon.ico`
- `docs/index.html`
- `docs/interfaces/INodeRSA.html`
- `docs/js/compodoc.js`
- `docs/js/lazy-load-graphs.js`
- `docs/js/libs/EventDispatcher.js`
- `docs/js/libs/bootstrap-native.js`
- `docs/js/libs/clipboard.min.js`
- `docs/js/libs/custom-elements-es5-adapter.js`
- `docs/js/libs/custom-elements.min.js`
- `docs/js/libs/d3.v3.min.js`
- `docs/js/libs/deep-iterator.js`
- `docs/js/libs/es6-shim.min.js`
- `docs/js/libs/htmlparser.js`
- `docs/js/libs/innersvg.js`
- `docs/js/libs/jszip.min.js`
- `docs/js/libs/lit-html.js`
- `docs/js/libs/prism.js`
- `docs/js/libs/promise.min.js`
- `docs/js/libs/svg-pan-zoom.min.js`
- `docs/js/libs/tablesort.min.js`
- `docs/js/libs/tablesort.number.min.js`
- `docs/js/libs/vis-network.min.js`
- `docs/js/libs/vis.min.js`
- `docs/js/libs/zepto.min.js`
- `docs/js/menu-wc.js`
- `docs/js/menu-wc_es5.js`
- `docs/js/menu.js`
- `docs/js/routes.js`
- `docs/js/routes/routes_index.js`
- `docs/js/search/lunr.min.js`
- `docs/js/search/search-lunr.js`
- `docs/js/search/search.js`
- `docs/js/search/search_index.js`
- `docs/js/sourceCode.js`
- `docs/js/svg-pan-zoom.controls.js`
- `docs/js/tabs.js`
- `docs/js/tree.js`
- `docs/license.html`
- `docs/miscellaneous/functions.html`
- `docs/miscellaneous/typealiases.html`
- `docs/miscellaneous/variables.html`
- `docs/modules.html`
- `docs/overview.html`
- `docs/properties.html`
- `docs/routes.html`
- `docs/styles/bootstrap-card.css`
- `docs/styles/bootstrap.min.css`
- `docs/styles/compodoc.css`
- `docs/styles/dark.css`
- `docs/styles/ionicons.min.css`
- `docs/styles/laravel.css`
- `docs/styles/material.css`
- `docs/styles/original.css`
- `docs/styles/postmark.css`
- `docs/styles/prism.css`
- `docs/styles/readthedocs.css`
- `docs/styles/reset.css`
- `docs/styles/stripe.css`
- `docs/styles/style.css`
- `docs/styles/tablesort.css`
- `docs/styles/vagrant.css`
- `docs/template-playground-app/app.js`
- `docs/template-playground-app/index.html`

## Final status

This audit produced one repo artifact:

- `code/analysis/FULL_PROJECT_AUDIT.md`

No source files were changed. The report itself is the only new file.
