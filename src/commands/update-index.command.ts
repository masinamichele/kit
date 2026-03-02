import hashObject from './hash-object.command.js';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import { Arguments } from '../helpers/arguments.js';
import { KitRoot } from '../helpers/kitroot.js';

export const validateArguments = (args: Arguments): Parameters<typeof command> => {
  assert.ok(args.$1);
  return [resolve(args[0])];
};

const command = async (filePath: string) => {
  const hash = await hashObject(filePath, true);
  const indexFile = resolve(await KitRoot.find(filePath), '.kit/index');
  const index = await readFile(indexFile, 'utf8');
  const indexMap: Record<string, string> = Object.fromEntries(
    index
      .split('\n')
      .filter(Boolean)
      .map((row) => row.split('\0').toReversed()),
  );
  const relative = await KitRoot.relative(filePath);
  indexMap[relative] = hash;
  const newContent = Object.entries(indexMap)
    .map(([name, hash]) => `${hash}\0${name}`)
    .join('\n');
  await writeFile(indexFile, newContent);
};

export default command;
