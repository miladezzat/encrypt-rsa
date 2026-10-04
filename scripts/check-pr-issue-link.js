const fs = require('node:fs');

const query = `query LinkedIssues($owner: String!, $name: String!, $number: Int!) {
  repository(owner: $owner, name: $name) {
    pullRequest(number: $number) {
      number
      closingIssuesReferences(first: 100) {
        nodes { number url repository { nameWithOwner } }
      }
    }
  }
}`;

function linkedIssues(payload, repository, pullRequestNumber) {
  if (payload.errors?.length) throw new Error('GitHub could not resolve pull request issue links.');
  const pullRequest = payload.data?.repository?.pullRequest;
  if (pullRequest?.number !== pullRequestNumber) throw new Error('GitHub returned an unexpected pull request.');
  const nodes = pullRequest.closingIssuesReferences?.nodes;
  if (!Array.isArray(nodes)) throw new Error('GitHub did not return the issue-link connection.');
  const issues = nodes.filter(issue => issue?.repository?.nameWithOwner?.toLowerCase() === repository.toLowerCase()
    && Number.isSafeInteger(issue.number) && issue.number > 0
    && issue.url === `https://github.com/${issue.repository.nameWithOwner}/issues/${issue.number}`);
  if (!issues.length) {
    throw new Error(`PR #${pullRequestNumber} must link an issue in ${repository}. Create or reuse an issue, then add "Closes #<issue>" to the PR description.`);
  }
  return issues.map(({ number, url }) => ({ number, url }));
}

async function checkPullRequestIssueLink({ repository, pullRequestNumber, token, fetchGitHub = fetch }) {
  if (!/^[A-Za-z0-9][A-Za-z0-9-]*\/[A-Za-z0-9_.-]+$/.test(repository || '')) throw new Error('A valid repository is required.');
  if (!Number.isSafeInteger(pullRequestNumber) || pullRequestNumber <= 0) throw new Error('A valid pull request number is required.');
  if (!token) throw new Error('GITHUB_TOKEN is required to verify issue links.');
  const [owner, name] = repository.split('/');
  const response = await fetchGitHub('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: JSON.stringify({ query, variables: { owner, name, number: pullRequestNumber } }),
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) throw new Error(`GitHub issue-link lookup failed (HTTP ${response.status}).`);
  return linkedIssues(await response.json(), repository, pullRequestNumber);
}

async function main() {
  const event = JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
  const issues = await checkPullRequestIssueLink({
    repository: process.env.GITHUB_REPOSITORY,
    pullRequestNumber: event.pull_request?.number,
    token: process.env.GITHUB_TOKEN,
  });
  console.log(`Linked issues verified: ${issues.map(issue => issue.url).join(', ')}`);
}

if (require.main === module) main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});

module.exports = { checkPullRequestIssueLink };
