const esbuild = require('esbuild');
const fs = require('fs');

async function build() {
  await Promise.all([
    esbuild.build({
      entryPoints: ['src/web/browser-global.ts'], bundle: true, format: 'iife',
      globalName: 'encryptRSA', platform: 'browser', target: 'es2017',
      outfile: 'build/web/encrypt-rsa.global.js',
    }),
    esbuild.build({
      entryPoints: ['src/node/index.ts'], bundle: true, format: 'esm',
      platform: 'node', target: 'node22', outfile: 'build/node/index.mjs',
    }),
    esbuild.build({
      entryPoints: ['src/web/index.ts'], bundle: true, format: 'esm',
      platform: 'browser', target: 'es2017', outfile: 'build/web/index.mjs',
    }),
  ]);
  // ESM declarations need explicit relative extensions for Node16/NodeNext resolution.
  for (const platform of ['node', 'web']) {
    const declarations = fs.readFileSync(`build/${platform}/${platform}/index.d.ts`, 'utf8')
      .replace(/'\.\.\/shared\/([^']+)'/g, "'./shared/$1.js'")
      .replace(/'\.\/crypto'/g, `'./${platform}/crypto.js'`);
    fs.writeFileSync(`build/${platform}/index.d.mts`, declarations);
  }
}

build().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
