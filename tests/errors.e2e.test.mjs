import test from 'node:test';
import assert from 'node:assert/strict';
import { createTempRepo, initializeRepo, removeTempRepo, writeRepoFile } from './helpers/repo.mjs';
import { clearActiveTest, runKit, setActiveTest } from './helpers/cli.mjs';

const testCase = (name, fn) => test(name, async () => {
  setActiveTest(name);
  try {
    await fn();
  } finally {
    clearActiveTest();
  }
});

testCase('invalid command exits with an error', async () => {
  const repoPath = await createTempRepo();
  try {
    const result = await runKit(['definitely-not-a-command'], repoPath);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /Invalid command/);
  } finally {
    await removeTempRepo(repoPath);
  }
});

testCase('init fails when repository already exists', async () => {
  const repoPath = await createTempRepo();
  try {
    assert.equal((await runKit(['init', '.'], repoPath)).code, 0);
    const second = await runKit(['init', '.'], repoPath);
    assert.equal(second.code, 1);
    assert.match(second.stderr, /already exists/);
  } finally {
    await removeTempRepo(repoPath);
  }
});

testCase('rev-parse fails for invalid short SHA', async () => {
  const repoPath = await createTempRepo();
  try {
    await initializeRepo(repoPath);

    const result = await runKit(['rev-parse', 'ab'], repoPath);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /Invalid short SHA/);
  } finally {
    await removeTempRepo(repoPath);
  }
});

testCase('rev-parse fails on ancestor lookup when HEAD has no commit yet', async () => {
  const repoPath = await createTempRepo();
  try {
    await initializeRepo(repoPath);
    const result = await runKit(['rev-parse', 'HEAD^'], repoPath);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /Cannot find ancestor/);
  } finally {
    await removeTempRepo(repoPath);
  }
});

testCase('rev-parse fails on ancestor lookup at root commit', async () => {
  const repoPath = await createTempRepo();
  try {
    await initializeRepo(repoPath);
    await writeRepoFile(repoPath, 'root.txt', 'root\n');
    await runKit(['add', 'root.txt'], repoPath);
    await runKit(['commit', '-m', 'root'], repoPath);

    const result = await runKit(['rev-parse', 'HEAD^'], repoPath);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /Cannot find parent/);
  } finally {
    await removeTempRepo(repoPath);
  }
});

testCase('branch cannot delete the current branch', async () => {
  const repoPath = await createTempRepo();
  try {
    await initializeRepo(repoPath);
    await writeRepoFile(repoPath, 'a.txt', 'a\n');
    await runKit(['add', 'a.txt'], repoPath);
    await runKit(['commit', '-m', 'c1'], repoPath);

    const delCurrent = await runKit(['branch', '-d', 'main'], repoPath);
    assert.equal(delCurrent.code, 1);
  } finally {
    await removeTempRepo(repoPath);
  }
});
