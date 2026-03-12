import test from 'node:test';
import assert from 'node:assert/strict';
import { rm } from 'node:fs/promises';
import { createTempRepo, initializeRepo, parseIndex, readRepoFile, removeTempRepo, writeRepoFile } from './helpers/repo.mjs';
import { clearActiveTest, runKit, setActiveTest } from './helpers/cli.mjs';
import { SHA_REGEX, stripAnsi } from './helpers/assertions.mjs';

const testCase = (name, fn) => test(name, async () => {
  setActiveTest(name);
  try {
    await fn();
  } finally {
    clearActiveTest();
  }
});

testCase('init creates the repository layout', async () => {
  const repoPath = await createTempRepo();
  try {
    const result = await runKit(['init', '.'], repoPath);

    assert.equal(result.code, 0);
    assert.match(result.stdout, /initialized successfully/i);
    assert.equal(await readRepoFile(repoPath, '.kit/HEAD'), 'ref: refs/heads/main\n');
    assert.equal(await readRepoFile(repoPath, '.kit/index'), '');
  } finally {
    await removeTempRepo(repoPath);
  }
});

testCase('add stages files and ls-files reports relative paths', async () => {
  const repoPath = await createTempRepo();
  try {
    await initializeRepo(repoPath);
    await writeRepoFile(repoPath, 'notes.txt', 'hello world\n');

    const addResult = await runKit(['add', 'notes.txt'], repoPath);
    const lsFilesResult = await runKit(['ls-files'], repoPath);
    const indexEntries = parseIndex(await readRepoFile(repoPath, '.kit/index'));

    assert.equal(addResult.code, 0);
    assert.equal(lsFilesResult.code, 0);
    assert.equal(lsFilesResult.stdout.trim(), 'notes.txt');
    assert.equal(indexEntries.length, 1);
    assert.equal(indexEntries[0].path, 'notes.txt');
    assert.match(indexEntries[0].hash, SHA_REGEX);
  } finally {
    await removeTempRepo(repoPath);
  }
});

testCase('commit creates a commit and rev-parse resolves HEAD and ancestry', async () => {
  const repoPath = await createTempRepo();
  try {
    await initializeRepo(repoPath);
    await writeRepoFile(repoPath, 'story.txt', 'v1\n');
    await runKit(['add', 'story.txt'], repoPath);
    const firstCommit = await runKit(['commit', '-m', 'first'], repoPath);
    const firstCommitPlain = stripAnsi(firstCommit.stdout);

    await writeRepoFile(repoPath, 'story.txt', 'v2\n');
    await runKit(['add', 'story.txt'], repoPath);
    const secondCommit = await runKit(['commit', '-m', 'second'], repoPath);
    const secondCommitPlain = stripAnsi(secondCommit.stdout);

    const headSha = (await runKit(['rev-parse', 'HEAD'], repoPath)).stdout.trim();
    const parentSha = (await runKit(['rev-parse', 'HEAD^'], repoPath)).stdout.trim();
    const tildeSha = (await runKit(['rev-parse', 'HEAD~1'], repoPath)).stdout.trim();
    const headRef = await readRepoFile(repoPath, '.kit/refs/heads/main');

    assert.equal(firstCommit.code, 0);
    assert.equal(secondCommit.code, 0);
    assert.match(firstCommitPlain, /^\[main [0-9a-f]{7}\] first\r?\n$/);
    assert.match(secondCommitPlain, /^\[main [0-9a-f]{7}\] second\r?\n$/);
    assert.match(headSha, SHA_REGEX);
    assert.match(parentSha, SHA_REGEX);
    assert.equal(tildeSha, parentSha);
    assert.equal(headRef, headSha);
    assert.notEqual(headSha, parentSha);
  } finally {
    await removeTempRepo(repoPath);
  }
});

testCase('rev-parse resolves branch names to branch tips', async () => {
  const repoPath = await createTempRepo();
  try {
    await initializeRepo(repoPath);
    await writeRepoFile(repoPath, 'tip.txt', 'tip\n');
    await runKit(['add', 'tip.txt'], repoPath);
    await runKit(['commit', '-m', 'tip-commit'], repoPath);

    await runKit(['branch', '-c', 'feature'], repoPath);
    await writeRepoFile(repoPath, 'tip.txt', 'tip-2\n');
    await runKit(['add', 'tip.txt'], repoPath);
    await runKit(['commit', '-m', 'feature-tip'], repoPath);

    const byHead = (await runKit(['rev-parse', 'HEAD'], repoPath)).stdout.trim();
    const byBranch = (await runKit(['rev-parse', 'feature'], repoPath)).stdout.trim();
    assert.equal(byBranch, byHead);
  } finally {
    await removeTempRepo(repoPath);
  }
});

testCase('unstage restores index entry back to HEAD version', async () => {
  const repoPath = await createTempRepo();
  try {
    await initializeRepo(repoPath);
    await writeRepoFile(repoPath, 'versioned.txt', 'line v1\n');
    await runKit(['add', 'versioned.txt'], repoPath);
    await runKit(['commit', '-m', 'base'], repoPath);
    const originalIndex = parseIndex(await readRepoFile(repoPath, '.kit/index'))[0].hash;

    await writeRepoFile(repoPath, 'versioned.txt', 'line v2\n');
    await runKit(['add', 'versioned.txt'], repoPath);
    const updatedIndex = parseIndex(await readRepoFile(repoPath, '.kit/index'))[0].hash;
    assert.notEqual(updatedIndex, originalIndex);

    const unstage = await runKit(['unstage', 'versioned.txt'], repoPath);
    const restoredIndex = parseIndex(await readRepoFile(repoPath, '.kit/index'))[0].hash;

    assert.equal(unstage.code, 0);
    assert.equal(restoredIndex, originalIndex);
  } finally {
    await removeTempRepo(repoPath);
  }
});

testCase('unstage removes a newly staged file that is not in HEAD', async () => {
  const repoPath = await createTempRepo();
  try {
    await initializeRepo(repoPath);
    await writeRepoFile(repoPath, 'only-index.txt', 'new\n');
    await runKit(['add', 'only-index.txt'], repoPath);

    const before = parseIndex(await readRepoFile(repoPath, '.kit/index'));
    assert.equal(before.length, 1);
    assert.equal(before[0].path, 'only-index.txt');

    const unstage = await runKit(['unstage', 'only-index.txt'], repoPath);
    const after = parseIndex(await readRepoFile(repoPath, '.kit/index'));

    assert.equal(unstage.code, 0);
    assert.equal(after.length, 0);
  } finally {
    await removeTempRepo(repoPath);
  }
});

testCase('status reports untracked, staged, and unstaged changes', async () => {
  const repoPath = await createTempRepo();
  try {
    await initializeRepo(repoPath);
    await writeRepoFile(repoPath, 'tracked.txt', 'line 1\n');
    await runKit(['add', 'tracked.txt'], repoPath);
    await runKit(['commit', '-m', 'initial'], repoPath);

    await writeRepoFile(repoPath, 'tracked.txt', 'line 1\nline 2\n');
    await writeRepoFile(repoPath, 'staged.txt', 'staged\n');
    await runKit(['add', 'staged.txt'], repoPath);
    await writeRepoFile(repoPath, 'untracked.txt', 'new\n');

    const status = await runKit(['status'], repoPath);

    assert.equal(status.code, 0);
    assert.match(status.stdout, /On branch main/);
    assert.match(status.stdout, /Changes to be committed:/);
    assert.match(status.stdout, /new file:\s+staged\.txt/);
    assert.match(status.stdout, /Changes not staged for commit:/);
    assert.match(status.stdout, /modified:\s+tracked\.txt/);
    assert.match(status.stdout, /Untracked files:/);
    assert.match(status.stdout, /untracked\.txt/);
  } finally {
    await removeTempRepo(repoPath);
  }
});

testCase('status reports a clean working tree after commit', async () => {
  const repoPath = await createTempRepo();
  try {
    await initializeRepo(repoPath);
    await writeRepoFile(repoPath, 'clean.txt', 'clean\n');
    await runKit(['add', 'clean.txt'], repoPath);
    await runKit(['commit', '-m', 'clean-state'], repoPath);

    const status = await runKit(['status'], repoPath);

    assert.equal(status.code, 0);
    assert.match(status.stdout, /On branch main/);
    assert.doesNotMatch(status.stdout, /Changes to be committed:/);
    assert.doesNotMatch(status.stdout, /Changes not staged for commit:/);
    assert.doesNotMatch(status.stdout, /Untracked files:/);
    assert.match(status.stdout, /Nothing to commit, working tree clean/);
  } finally {
    await removeTempRepo(repoPath);
  }
});

testCase('status reports staged modification for a tracked file', async () => {
  const repoPath = await createTempRepo();
  try {
    await initializeRepo(repoPath);
    await writeRepoFile(repoPath, 'tracked.txt', 'v1\n');
    await runKit(['add', 'tracked.txt'], repoPath);
    await runKit(['commit', '-m', 'base-tracked'], repoPath);

    await writeRepoFile(repoPath, 'tracked.txt', 'v2\n');
    await runKit(['add', 'tracked.txt'], repoPath);
    const status = await runKit(['status'], repoPath);

    assert.equal(status.code, 0);
    assert.match(status.stdout, /Changes to be committed:/);
    assert.match(status.stdout, /modified:\s+tracked\.txt/);
    assert.doesNotMatch(status.stdout, /Changes not staged for commit:/);
  } finally {
    await removeTempRepo(repoPath);
  }
});

testCase('status reports unstaged deletion for a tracked file removed from working tree', async () => {
  const repoPath = await createTempRepo();
  try {
    await initializeRepo(repoPath);
    await writeRepoFile(repoPath, 'gone.txt', 'gone\n');
    await runKit(['add', 'gone.txt'], repoPath);
    await runKit(['commit', '-m', 'base-gone'], repoPath);

    await runKit(['add', 'gone.txt'], repoPath);
    await rm(`${repoPath}\\gone.txt`);
    const status = await runKit(['status'], repoPath);

    assert.equal(status.code, 0);
    assert.match(status.stdout, /Changes not staged for commit:/);
    assert.match(status.stdout, /deleted:\s+gone\.txt/);
  } finally {
    await removeTempRepo(repoPath);
  }
});

testCase('kitignore patterns are applied for literal, wildcard, dir, and rooted entries', async () => {
  const repoPath = await createTempRepo();
  try {
    await initializeRepo(repoPath);
    await writeRepoFile(
      repoPath,
      '.kitignore',
      ['ignored.txt', '*.log', 'build/', '/root-only.txt'].join('\n'),
    );
    await writeRepoFile(repoPath, 'ignored.txt', 'ignored\n');
    await writeRepoFile(repoPath, 'keep.txt', 'keep\n');
    await writeRepoFile(repoPath, 'notes.log', 'ignored log\n');
    await writeRepoFile(repoPath, 'build/artifact.txt', 'ignored dir\n');
    await writeRepoFile(repoPath, 'root-only.txt', 'ignored root\n');
    await writeRepoFile(repoPath, 'nested/root-only.txt', 'should stay\n');

    const add = await runKit(['add', '.'], repoPath);
    const ls = await runKit(['ls-files'], repoPath);
    const listed = ls.stdout.split(/\r?\n/).filter(Boolean);

    assert.equal(add.code, 0);
    assert.equal(ls.code, 0);
    assert.ok(listed.includes('keep.txt'));
    assert.ok(listed.includes('nested/root-only.txt'));
    assert.ok(!listed.includes('ignored.txt'));
    assert.ok(!listed.includes('notes.log'));
    assert.ok(!listed.includes('build/artifact.txt'));
    assert.ok(!listed.includes('root-only.txt'));
  } finally {
    await removeTempRepo(repoPath);
  }
});

testCase('log prints commit history including messages', async () => {
  const repoPath = await createTempRepo();
  try {
    await initializeRepo(repoPath);
    await writeRepoFile(repoPath, 'log.txt', 'first\n');
    await runKit(['add', 'log.txt'], repoPath);
    await runKit(['commit', '-m', 'first-log-message'], repoPath);
    await writeRepoFile(repoPath, 'log.txt', 'second\n');
    await runKit(['add', 'log.txt'], repoPath);
    await runKit(['commit', '-m', 'second-log-message'], repoPath);

    const logResult = await runKit(['log'], repoPath);
    const plain = stripAnsi(logResult.stdout);

    assert.equal(logResult.code, 0);
    assert.match(plain, /commit [0-9a-f]{40}/);
    assert.match(plain, /Author: .+ <kit@example\.com>/);
    assert.match(plain, /Date:\s+/);
    assert.match(plain, /\n    second-log-message/);
    assert.match(plain, /\n    first-log-message/);
    assert.match(plain, /first-log-message/);
    assert.match(plain, /second-log-message/);
  } finally {
    await removeTempRepo(repoPath);
  }
});

testCase('branch can create, switch, list, and delete non-current branches', async () => {
  const repoPath = await createTempRepo();
  try {
    await initializeRepo(repoPath);
    await writeRepoFile(repoPath, 'branch.txt', 'branch base\n');
    await runKit(['add', 'branch.txt'], repoPath);
    await runKit(['commit', '-m', 'branch-base'], repoPath);

    const create = await runKit(['branch', '-c', 'feature'], repoPath);
    const headAfterCreate = await readRepoFile(repoPath, '.kit/HEAD');
    const switchMain = await runKit(['branch', 'main'], repoPath);
    const headAfterMainSwitch = await readRepoFile(repoPath, '.kit/HEAD');
    const switchBranch = await runKit(['branch', 'feature'], repoPath);
    const headAfterSwitch = await readRepoFile(repoPath, '.kit/HEAD');
    const list = await runKit(['branch'], repoPath);
    const removeMain = await runKit(['branch', '-d', 'main'], repoPath);
    const listAfterDelete = await runKit(['branch'], repoPath);

    assert.equal(create.code, 0);
    assert.match(create.stdout, /Switched to a new branch 'feature'/);
    assert.equal(headAfterCreate, 'ref: refs/heads/feature\n');
    assert.equal(switchMain.code, 0);
    assert.match(switchMain.stdout, /Switched to branch 'main'/);
    assert.equal(headAfterMainSwitch, 'ref: refs/heads/main\n');
    assert.equal(switchBranch.code, 0);
    assert.match(switchBranch.stdout, /Switched to branch 'feature'/);
    assert.equal(headAfterSwitch, 'ref: refs/heads/feature\n');
    assert.equal(list.code, 0);
    assert.match(list.stdout, /\* feature/);
    assert.match(list.stdout, / main/);
    assert.equal(removeMain.code, 0);
    assert.match(removeMain.stdout, /Deleted branch 'main'/);
    assert.equal(listAfterDelete.code, 0);
    assert.doesNotMatch(listAfterDelete.stdout, /\bmain\b/);
  } finally {
    await removeTempRepo(repoPath);
  }
});

testCase('commands work when .kitignore is missing', async () => {
  const repoPath = await createTempRepo();
  try {
    await initializeRepo(repoPath);
    await writeRepoFile(repoPath, 'no-ignore.txt', 'content\n');

    const addResult = await runKit(['add', 'no-ignore.txt'], repoPath);
    const lsFilesResult = await runKit(['ls-files'], repoPath);

    assert.equal(addResult.code, 0);
    assert.equal(lsFilesResult.code, 0);
    assert.equal(lsFilesResult.stdout.trim(), 'no-ignore.txt');
  } finally {
    await removeTempRepo(repoPath);
  }
});
