const esbuild = require('esbuild');

esbuild.build({
  entryPoints: ['src/web/browser-global.ts'],
  bundle: true,
  format: 'iife',
  globalName: 'encryptRSA',
  platform: 'browser',
  target: 'es2017',
  outfile: 'build/web/encrypt-rsa.global.js',
}).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
