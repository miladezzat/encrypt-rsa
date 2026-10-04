const { test } = require('node:test');
const assert = require('node:assert/strict');
const { checkPullRequestIssueLink } = require('../scripts/check-pr-issue-link');

const repository = 'miladezzat/encrypt-rsa';
const issue = (number, repo = repository) => ({ number, url: `https://github.com/${repo}/issues/${number}`, repository: { nameWithOwner: repo } });
const payload = (nodes, number = 52) => ({ data: { repository: { pullRequest: { number, closingIssuesReferences: { nodes } } } } });
const response = data => async () => ({ ok: true, json: async () => data });
const check = fetchGitHub => checkPullRequestIssueLink({ repository, pullRequestNumber: 52, token: 'test-token', fetchGitHub });

test('verify actual same-repository issue connections through the GitHub API', async () => {
  const result = await check(async (url, request) => {
    assert.equal(url, 'https://api.github.com/graphql');
    assert.equal(request.method, 'POST');
    assert.equal(request.headers.Authorization, 'Bearer test-token');
    const body = JSON.parse(request.body);
    assert.deepEqual(body.variables, { owner: 'miladezzat', name: 'encrypt-rsa', number: 52 });
    assert.match(body.query, /closingIssuesReferences/);
    return { ok: true, json: async () => payload([issue(51), issue(42), issue(1, 'other/repo')]) };
  });
  assert.deepEqual(result, [{ number: 51, url: 'https://github.com/miladezzat/encrypt-rsa/issues/51' },
    { number: 42, url: 'https://github.com/miladezzat/encrypt-rsa/issues/42' }]);
});

test('missing links and cross-repository links fail instead of accepting text references', async () => {
  for (const nodes of [[], [issue(1, 'other/repo')], [null], [{ ...issue(51), url: 'https://github.com/miladezzat/encrypt-rsa/pull/51' }]]) {
    await assert.rejects(check(response(payload(nodes))), /must link an issue/);
  }
});

test('fail closed for API errors, missing connections, and mismatched PRs', async () => {
  for (const status of [401, 403, 429, 500]) {
    await assert.rejects(check(async () => ({ ok: false, status })), new RegExp(`HTTP ${status}`));
  }
  await assert.rejects(check(response({ errors: [{ message: 'denied' }] })), /could not resolve/);
  await assert.rejects(check(response({ data: { repository: { pullRequest: null } } })), /unexpected pull request/);
  await assert.rejects(check(response(payload([issue(51)], 999))), /unexpected pull request/);
  await assert.rejects(check(response(payload(null))), /issue-link connection/);
  await assert.rejects(check(async () => { throw new Error('offline'); }), /offline/);
});

test('reject invalid context before making any API request', async () => {
  const options = { repository, pullRequestNumber: 52, token: 'test-token', fetchGitHub: () => { throw new Error('must not request'); } };
  for (const overrides of [{ repository: '../other' }, { repository: '' }, { pullRequestNumber: 0 }, { pullRequestNumber: '52' }, { pullRequestNumber: 1.5 }, { token: '' }]) {
    await assert.rejects(checkPullRequestIssueLink({ ...options, ...overrides }), /required/);
  }
});
