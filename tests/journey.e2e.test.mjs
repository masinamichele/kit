import test from 'node:test';
import assert from 'node:assert/strict';
import { createTempRepo, initializeRepo, readRepoFile, removeTempRepo, writeRepoFile } from './helpers/repo.mjs';
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

testCase('porcelain journey: init -> add -> commit -> branch -> status -> diff -> log', async () => {
  const repoPath = await createTempRepo();
  try {
    await initializeRepo(repoPath);
    await writeRepoFile(repoPath, 'app.txt', 'v1\n');

    assert.equal((await runKit(['add', 'app.txt'], repoPath)).code, 0);
    assert.equal((await runKit(['commit', '-m', 'journey base'], repoPath)).code, 0);
    const base = (await runKit(['rev-parse', 'HEAD'], repoPath)).stdout.trim();
    assert.match(base, SHA_REGEX);

    assert.equal((await runKit(['branch', 'feature'], repoPath)).code, 0);
    assert.equal((await runKit(['branch', 'feature'], repoPath)).code, 0);
    assert.equal(await readRepoFile(repoPath, '.kit/HEAD'), 'ref: refs/heads/feature\n');

    await writeRepoFile(repoPath, 'app.txt', 'v1\nv2\n');
    assert.equal((await runKit(['add', 'app.txt'], repoPath)).code, 0);
    assert.equal((await runKit(['commit', '-m', 'journey feature'], repoPath)).code, 0);
    const featureHead = (await runKit(['rev-parse', 'HEAD'], repoPath)).stdout.trim();
    assert.match(featureHead, SHA_REGEX);

    await writeRepoFile(repoPath, 'app.txt', 'v1\nv2\nworking-only\n');
    const status = await runKit(['status'], repoPath);
    assert.equal(status.code, 0);
    assert.match(status.stdout, /Changes not staged for commit:/);

    const diff = await runKit(['diff', base, featureHead], repoPath);
    assert.equal(diff.code, 0);
    assert.match(diff.stdout, /diff a\/app\.txt b\/app\.txt/);

    const log = await runKit(['log'], repoPath);
    const plainLog = stripAnsi(log.stdout);
    assert.equal(log.code, 0);
    assert.match(plainLog, /journey base/);
    assert.match(plainLog, /journey feature/);
  } finally {
    await removeTempRepo(repoPath);
  }
});
