import assert from 'node:assert/strict';
import { access } from 'node:fs/promises';
import { join } from 'node:path';

export const SHA_REGEX = /^[0-9a-f]{40}$/;
const ANSI_REGEX = /\x1B\[[0-9;]*m/g;

export function stripAnsi(text) {
  return text.replaceAll(ANSI_REGEX, '');
}

export async function assertObjectExists(repoPath, sha) {
  assert.match(sha, SHA_REGEX);
  const objectPath = join(repoPath, '.kit', 'objects', sha.slice(0, 2), sha.slice(2));
  await access(objectPath);
}
