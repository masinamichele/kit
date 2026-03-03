import { resolve } from 'node:path';
import { readFile } from 'node:fs/promises';
import { KitRoot } from '../helpers/kitroot.js';
import { Arguments } from '../helpers/arguments.js';
import { Tree } from '../helpers/tree.js';

export const validateArguments = (args: Arguments): Parameters<typeof command> => {
  return [];
};

const command = async () => {
  const indexFile = resolve(await KitRoot.find(), '.kit/index');
  const index = await readFile(indexFile, 'utf8');
  const content = index
    .split('\n')
    .filter(Boolean)
    .map((row) => row.split('\0').toReversed()) as [string, string][];

  const tree = Tree.build(content);
  return Tree.write(tree);
};

export default command;
