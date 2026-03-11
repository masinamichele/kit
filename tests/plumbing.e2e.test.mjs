import test from 'node:test';
import assert from 'node:assert/strict';
import { createTempRepo, initializeRepo, readRepoFile, removeTempRepo, writeRepoFile } from './helpers/repo.mjs';
import { clearActiveTest, runKit, setActiveTest } from './helpers/cli.mjs';
import { assertObjectExists, SHA_REGEX } from './helpers/assertions.mjs';

const testCase = (name, fn) => test(name, async () => {
  setActiveTest(name);
  try {
    await fn();
  } finally {
    clearActiveTest();
  }
});

testCase('hash-object returns stable SHA and stores the object', async () => {
  const repoPath = await createTempRepo();
  try {
    await initializeRepo(repoPath);
    await writeRepoFile(repoPath, 'blob.txt', 'blob payload\n');

    const first = await runKit(['hash-object', 'blob.txt'], repoPath);
    const second = await runKit(['hash-object', 'blob.txt', '-w'], repoPath);

    assert.equal(first.code, 0);
    assert.equal(second.code, 0);
    const sha1 = first.stdout.trim();
    const sha2 = second.stdout.trim();
    assert.match(sha1, SHA_REGEX);
    assert.equal(sha2, sha1);
    await assertObjectExists(repoPath, sha1);
  } finally {
    await removeTempRepo(repoPath);
  }
});

testCase('cat-file returns content for both SHA and revision', async () => {
  const repoPath = await createTempRepo();
  try {
    await initializeRepo(repoPath);
    await writeRepoFile(repoPath, 'hello.txt', 'hello from cat-file\n');

    await runKit(['add', 'hello.txt'], repoPath);
    await runKit(['commit', '-m', 'cat-file-commit'], repoPath);

    const headSha = (await runKit(['rev-parse', 'HEAD'], repoPath)).stdout.trim();
    const headRaw = await runKit(['cat-file', headSha], repoPath);
    const byRevision = await runKit(['cat-file', 'HEAD'], repoPath);

    assert.equal(headRaw.code, 0);
    assert.equal(byRevision.code, 0);
    assert.match(headRaw.stdout, /cat-file-commit/);
    assert.equal(byRevision.stdout, headRaw.stdout);
  } finally {
    await removeTempRepo(repoPath);
  }
});

testCase('update-index stages a file directly', async () => {
  const repoPath = await createTempRepo();
  try {
    await initializeRepo(repoPath);
    await writeRepoFile(repoPath, 'direct.txt', 'direct stage\n');

    const updateResult = await runKit(['update-index', 'direct.txt'], repoPath);
    const lsFilesResult = await runKit(['ls-files'], repoPath);

    assert.equal(updateResult.code, 0);
    assert.equal(lsFilesResult.code, 0);
    assert.equal(lsFilesResult.stdout.trim(), 'direct.txt');
  } finally {
    await removeTempRepo(repoPath);
  }
});

testCase('write-tree writes a tree object from the index', async () => {
  const repoPath = await createTempRepo();
  try {
    await initializeRepo(repoPath);
    await writeRepoFile(repoPath, 'path/to/file.txt', 'tree content\n');
    await runKit(['add', 'path'], repoPath);

    const writeTreeResult = await runKit(['write-tree'], repoPath);
    const treeSha = writeTreeResult.stdout.trim();

    assert.equal(writeTreeResult.code, 0);
    await assertObjectExists(repoPath, treeSha);
  } finally {
    await removeTempRepo(repoPath);
  }
});

testCase('commit-tree creates a commit object with the provided tree', async () => {
  const repoPath = await createTempRepo();
  try {
    await initializeRepo(repoPath);
    await writeRepoFile(repoPath, 'plumbing.txt', 'plumbing\n');
    await runKit(['add', 'plumbing.txt'], repoPath);

    const treeSha = (await runKit(['write-tree'], repoPath)).stdout.trim();
    const commitTreeResult = await runKit(['commit-tree', treeSha, '-m', 'plumbing commit'], repoPath);
    const commitSha = commitTreeResult.stdout.trim();
    const commitBody = await runKit(['cat-file', commitSha], repoPath);

    assert.equal(commitTreeResult.code, 0);
    assert.match(commitSha, SHA_REGEX);
    assert.match(commitBody.stdout, new RegExp(`tree ${treeSha}`));
    assert.match(commitBody.stdout, /plumbing commit/);
    await assertObjectExists(repoPath, commitSha);
  } finally {
    await removeTempRepo(repoPath);
  }
});

testCase('diff prints modified and added file changes between commits', async () => {
  const repoPath = await createTempRepo();
  try {
    await initializeRepo(repoPath);
    await writeRepoFile(repoPath, 'tracked.txt', 'same\nold\n');
    await runKit(['add', 'tracked.txt'], repoPath);
    await runKit(['commit', '-m', 'diff-a'], repoPath);
    const first = (await runKit(['rev-parse', 'HEAD'], repoPath)).stdout.trim();

    await writeRepoFile(repoPath, 'tracked.txt', 'same\nnew\n');
    await writeRepoFile(repoPath, 'added.txt', 'added\n');
    await runKit(['add', 'tracked.txt'], repoPath);
    await runKit(['add', 'added.txt'], repoPath);
    await runKit(['commit', '-m', 'diff-b'], repoPath);
    const second = (await runKit(['rev-parse', 'HEAD'], repoPath)).stdout.trim();

    const diffResult = await runKit(['diff', first, second], repoPath);

    assert.equal(diffResult.code, 0);
    assert.match(diffResult.stdout, /diff a\/tracked\.txt b\/tracked\.txt/);
    assert.match(diffResult.stdout, /Added file: added\.txt/);
  } finally {
    await removeTempRepo(repoPath);
  }
});

testCase('diff prints deleted file changes between commits', async () => {
  const repoPath = await createTempRepo();
  try {
    await initializeRepo(repoPath);
    await writeRepoFile(repoPath, 'gone.txt', 'bye\n');
    await runKit(['add', 'gone.txt'], repoPath);
    await runKit(['commit', '-m', 'has-file'], repoPath);
    const first = (await runKit(['rev-parse', 'HEAD'], repoPath)).stdout.trim();

    await writeRepoFile(repoPath, '.kit/index', '');
    await runKit(['commit', '-m', 'file-removed'], repoPath);
    const second = (await runKit(['rev-parse', 'HEAD'], repoPath)).stdout.trim();

    const diffResult = await runKit(['diff', first, second], repoPath);

    assert.equal(diffResult.code, 0);
    assert.match(diffResult.stdout, /Deleted file: gone\.txt/);
  } finally {
    await removeTempRepo(repoPath);
  }
});
