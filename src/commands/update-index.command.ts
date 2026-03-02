import hashObject from './hash-object.command.js';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Arguments, findKitRoot, relativeToKitRoot } from '../utils.js';
import assert from 'node:assert/strict';

export const validateArguments = (args: Arguments): Parameters<typeof command> => {
  assert.ok(args.$1);
  return [resolve(args[0])];
};

const command = async (filePath: string) => {
  const hash = await hashObject(filePath, true);
  const indexFile = resolve(await findKitRoot(filePath), '.kit/index');
  const index = await readFile(indexFile, 'utf8');
  const indexMap: Record<string, string> = Object.fromEntries(
    index
      .split('\n')
      .filter(Boolean)
      .map((row) => row.split('\0').toReversed()),
  );
  const relative = await relativeToKitRoot(filePath);
  indexMap[relative] = hash;
  const newContent = Object.entries(indexMap)
    .map(([name, hash]) => `${hash}\0${name}`)
    .join('\n');
  await writeFile(indexFile, newContent);
};

export default command;
