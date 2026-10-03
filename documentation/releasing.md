# Publishing and recovery

The `NPM publish` workflow runs on `master` pushes or a manual dispatch from `master`. It uses a GitHub-hosted Ubuntu runner, Node 24, npm 11.13.0, and OIDC trusted publishing. It has no `NPM_TOKEN` requirement. `id-token: write` is granted only to the publishing job; repository contents remain read-only. Publishing is serialized and concurrent runs are not cancelled.

## One-time npm setup

In the npm package Settings page, add a GitHub Actions trusted publisher:

| Setting | Value |
|---|---|
| Organization/user | `miladezzat` |
| Repository | `encrypt-rsa` |
| Workflow filename | `publish.yml` (filename only) |
| Environment | Empty; the workflow currently uses no GitHub environment |
| Allow npm publish | Enabled |
| Allow npm dist-tag | Disabled |

The package's `repository` URL must match the GitHub repository. If a protected GitHub environment is added later, update the npm connection and workflow together. OIDC uses short-lived workflow credentials; do not substitute a local token into the publish step. npm requires a recent npm CLI/Node version and a supported hosted runner. See [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/).

## Release behavior

Prepare a stable `major.minor.patch` version in `package.json` and the lockfile, update the changelog/docs, and open a reviewed PR. The registry guard fetches npm's `latest` version without authentication. An unchanged version skips publishing, an older local version fails, and a newer version runs all package/browser/docs and AI example checks before `npm publish --access public`. HTTP errors, malformed registry data, and network failures stop the release instead of assuming the package is unpublished. Prerelease versions require a separate release policy.

Merging the PR starts the release. After npm accepts a publish, it may spend several minutes processing the package before public reads succeed. The workflow polls the exact-version endpoint for up to ten minutes and verifies version/name/integrity, retrying temporary 404, rate-limit/server, and network failures. Permanent authentication errors or invalid metadata fail immediately. Verification never republishes. OIDC automatically creates provenance for supported public GitHub repositories. An npm version is immutable: later fixes need a new version. Local tests and dry runs do not verify an actual registry publish.

## Recover a failed run

For `E401` in the old `npm whoami` step, the repository token was rejected. The OIDC workflow removes that token path. Re-running the old workflow still uses its old code; merge this workflow before dispatching a fresh run on `master`.

If OIDC fails, check the exact repository, filename, optional environment, allowed direct publish action, Node/npm versions, job `id-token` permission, and hosted runner against the npm connection. Do not print authentication environment variables or tokens to diagnose it. If a publish succeeded but a later verification step failed, confirm the exact version on npm and retry a fresh dispatch; the guard skips an already published version.

If npm is unavailable, retry once registry service recovers. If the proposed version was previously published under another tag, choose a fresh stable version rather than trying to overwrite it. Remove an obsolete token secret only after the first OIDC release succeeds; account token revocation is a separate owner action.
