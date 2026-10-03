import { defineConfig } from 'vitepress';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const { version } = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));

export default defineConfig({
  title: 'encrypt-rsa',
  description: 'RSA encryption, authenticated JSON, and signed messages for Node.js and browsers. Zero runtime dependencies.',
  lang: 'en-US',
  base: '/',
  cleanUrls: false,
  outDir: fileURLToPath(new URL('../../docs', import.meta.url)),
  head: [['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }]],
  sitemap: { hostname: 'https://encrypt-rsa.js.org' },
  vite: { build: { emptyOutDir: false } },
  themeConfig: {
    logo: { src: '/logo.svg', alt: '' },
    nav: [
      { text: 'Guide', link: '/getting-started', activeMatch: '^/(getting-started|compatibility|payload-format|migration|examples)' },
      { text: 'API', link: '/api/reference', activeMatch: '^/api/' },
      { text: 'Integrations', link: '/ai-integrations', activeMatch: '^/(ai-integrations|signed-messages)' },
      { text: `v${version}`, items: [
        { text: 'Changelog', link: '/changelog' },
        { text: 'View on npm', link: 'https://www.npmjs.com/package/encrypt-rsa' },
        { text: 'Release guide', link: '/releasing' },
      ] },
    ],
    sidebar: [
      { text: 'Start here', items: [
        { text: 'Getting started', link: '/getting-started' },
        { text: 'Choose an operation', link: '/getting-started#choose-an-operation' },
        { text: 'Runnable examples', link: '/examples' },
      ] },
      { text: 'API reference', items: [
        { text: 'NodeRSA', link: '/api/reference' },
        { text: 'Key and text helpers', link: '/api/helpers' },
        { text: 'TypeScript types', link: '/api/types' },
      ] },
      { text: 'Guides', items: [
        { text: 'Node and browsers', link: '/compatibility' },
        { text: 'JSON and AI integrations', link: '/ai-integrations' },
        { text: 'Signed messages', link: '/signed-messages' },
        { text: 'Encrypted payload format', link: '/payload-format' },
        { text: 'Migration', link: '/migration' },
      ] },
      { text: 'Project', items: [
        { text: 'Contributing to the docs', link: '/contributing' },
        { text: 'Releasing', link: '/releasing' },
        { text: 'Changelog', link: '/changelog' },
        { text: 'License', link: '/license' },
      ] },
    ],
    search: { provider: 'local' },
    notFound: { title: 'Page not found', quote: 'Return to the guide or search for an API method.', linkLabel: 'Back to documentation', linkText: 'Back to documentation' },
    outline: { level: [2, 3], label: 'On this page' },
    socialLinks: [{ icon: 'github', link: 'https://github.com/miladezzat/encrypt-rsa' }],
    editLink: { pattern: 'https://github.com/miladezzat/encrypt-rsa/edit/master/documentation/:path', text: 'Improve this page' },
    footer: { message: 'Released under the MIT License.', copyright: 'Milad E. Fahmy' },
  },
});
