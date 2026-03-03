import assert from 'node:assert/strict';
import { Arguments } from '../helpers/arguments.js';
import { readdir, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { KitRoot } from '../helpers/kitroot.js';
import updateIndex from './update-index.command.js';
import { KitIgnore } from '../helpers/kitignore.js';
import { WorkingTree } from '../helpers/working-tree.js';

export const validateArguments = (args: Arguments): Parameters<typeof command> => {
  assert.ok(args.$1);
  return [args._.map((path) => resolve(path))];
};

const command = async (paths: string[]) => {
  const files = await WorkingTree.findTrackableFiles(...paths);
  for (const file of files) await updateIndex(file);
};

export default command;
