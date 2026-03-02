import assert from 'node:assert/strict';
import { Arguments } from '../helpers/arguments.js';
import { readdir, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { KitRoot } from '../helpers/kitroot.js';
import updateIndex from './update-index.command.js';
import { KitIgnore } from '../helpers/kitignore.js';

export const validateArguments = (args: Arguments): Parameters<typeof command> => {
  assert.ok(args.$1);
  return [args._.map((path) => resolve(path))];
};

const command = async (paths: string[]) => {
  const allFilesToStage = new Set<string>();
  for (const path of paths) {
    const stats = await stat(path);
    if (stats.isFile()) allFilesToStage.add(path);
    else {
      const entries = await readdir(path, { recursive: true, withFileTypes: true });
      const filesInDir = entries.filter((entry) => entry.isFile()).map((entry) => join(entry.parentPath, entry.name));
      for (const file of filesInDir) allFilesToStage.add(file);
    }
  }
  const kitDir = join(await KitRoot.find(), '.kit');
  const files = [...allFilesToStage.values()]
    .filter((file) => !file.startsWith(kitDir) || file.endsWith('.kitignore'))
    .filter((file) => !KitIgnore.isIgnored(file));
  for (const file of files) await updateIndex(file)
};

export default command;
