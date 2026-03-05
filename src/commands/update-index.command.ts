import hashObject from './hash-object.command.js';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import { Arguments } from '../helpers/arguments.js';
import { KitRoot } from '../helpers/kitroot.js';
import { Index } from '../helpers/index.js';

export const validateArguments = (args: Arguments): Parameters<typeof command> => {
  assert.ok(args.$1);
  return [resolve(args[0])];
};

const command = async (filePath: string) => {
  const hash = await hashObject(filePath, true);
  const index = await Index.read();
  const relative = await KitRoot.relative(filePath);
  index.set(relative, hash);
  await Index.write([...index.entries()]);
};

export default command;
