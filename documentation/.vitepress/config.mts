import { defineConfig } from 'vitepress';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const { version } = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));

const guideSidebar = [
  { text: 'Start here', items: [
    { text: 'Getting started', link: '/getting-started' },
    { text: 'Choose an operation', link: '/getting-started#choose-an-operation' },
    { text: 'Runnable examples', link: '/examples' },
  ] },
  { text: 'Encryption', items: [
    { text: 'JSON and schema validation', link: '/json' },
    { text: 'Text and binary methods', link: '/api/reference#encryptstringwithrsapublickey' },
    { text: 'Node and browsers', link: '/compatibility' },
    { text: 'Encrypted payload format', link: '/payload-format' },
    { text: 'Migration', link: '/migration' },
  ] },
  { text: 'Signatures', items: [
    { text: 'Sign and verify text', link: '/api/reference#sign' },
    { text: 'Signed messages and replay prevention', link: '/signed-messages' },
  ] },
  { text: 'AI integrations', items: [
    { text: 'Overview and setup', link: '/ai-integrations' },
    { text: 'Encrypted agent memory', link: '/ai/encrypted-memory' },
    { text: 'Conversation persistence', link: '/ai/conversation-persistence' },
    { text: 'Docs assistant', link: '/ai/docs-assistant' },
  ] },
  { text: 'API reference', items: [
    { text: 'NodeRSA', link: '/api/reference' },
    { text: 'Key and text helpers', link: '/api/helpers' },
    { text: 'TypeScript types', link: '/api/types' },
  ] },
  { text: 'Project', collapsed: true, items: [
    { text: 'Contributing to the docs', link: '/contributing' },
    { text: 'Releasing', link: '/releasing' },
    { text: 'Changelog', link: '/changelog' },
    { text: 'License', link: '/license' },
  ] },
];

const [startHere, encryption, signatures, ai, api, project] = guideSidebar;
const aiSidebar = [
  ai,
  { text: 'Foundations', items: [
    { text: 'JSON and schema validation', link: '/json' },
    { text: 'Signed messages and replay prevention', link: '/signed-messages' },
    { text: 'Node and browsers', link: '/compatibility' },
  ] },
  { text: 'Reference', items: [
    { text: 'Getting started', link: '/getting-started' },
    { text: 'NodeRSA API', link: '/api/reference' },
    { text: 'Runnable examples', link: '/examples' },
  ] },
  project,
];
const apiSidebar = [api, startHere, encryption, signatures, ai, project];

export default defineConfig({
  title: 'encrypt-rsa',
  description: 'RSA encryption, authenticated JSON, and signed messages for Node.js and browsers. Explore encrypted AI memory and conversation persistence recipes. Zero runtime dependencies.',
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
      { text: 'Guide', link: '/getting-started', activeMatch: '^/(getting-started|json|compatibility|payload-format|signed-messages|migration|examples)' },
      { text: 'AI integrations', link: '/ai-integrations', activeMatch: '^/(ai-integrations|ai/)' },
      { text: 'API', link: '/api/reference', activeMatch: '^/api/' },
      { text: `v${version}`, items: [
        { text: 'Changelog', link: '/changelog' },
        { text: 'View on npm', link: 'https://www.npmjs.com/package/encrypt-rsa' },
        { text: 'Release guide', link: '/releasing' },
      ] },
    ],
    sidebar: {
      '/ai/': aiSidebar,
      '/ai-integrations': aiSidebar,
      '/api/': apiSidebar,
      '/': guideSidebar,
    },
    search: { provider: 'local' },
    notFound: { title: 'Page not found', quote: 'Return to the guide or search for an API method.', linkLabel: 'Back to documentation', linkText: 'Back to documentation' },
    outline: { level: [2, 3], label: 'On this page' },
    socialLinks: [{ icon: 'github', link: 'https://github.com/miladezzat/encrypt-rsa' }],
    editLink: { pattern: 'https://github.com/miladezzat/encrypt-rsa/edit/master/documentation/:path', text: 'Improve this page' },
    footer: { message: 'Released under the MIT License.', copyright: 'Milad Fahmy' },
  },
});
