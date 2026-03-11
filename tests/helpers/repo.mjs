import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { runKit } from './cli.mjs';

export async function createTempRepo(prefix = 'kit-test-') {
  return mkdtemp(join(tmpdir(), prefix));
}

export async function removeTempRepo(path) {
  await rm(path, { recursive: true, force: true });
}

export async function writeRepoFile(repoPath, relativePath, contents) {
  const fullPath = join(repoPath, relativePath);
  await mkdir(dirname(fullPath), { recursive: true });
  await writeFile(fullPath, contents);
}

export async function readRepoFile(repoPath, relativePath, encoding = 'utf8') {
  return readFile(join(repoPath, relativePath), encoding);
}

export async function initializeRepo(repoPath) {
  const initResult = await runKit(['init', '.'], repoPath);
  if (initResult.code !== 0) {
    throw new Error(`Failed to initialize repo:\nSTDOUT:\n${initResult.stdout}\nSTDERR:\n${initResult.stderr}`);
  }

  await writeRepoFile(
    repoPath,
    '.kit/config',
    JSON.stringify(
      {
        user: {
          name: 'Kit Test',
          email: 'kit@example.com',
        },
      },
      null,
      2,
    ),
  );

  return initResult;
}

export function parseIndex(contents) {
  return contents
    .split('\n')
    .filter(Boolean)
    .map((row) => {
      const [hash, path] = row.split('\0');
      return { hash, path };
    });
}
