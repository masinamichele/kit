import { resolve } from 'node:path';
import { readFile } from 'node:fs/promises';
import { KitRoot } from '../helpers/kitroot.js';
import { Arguments } from '../helpers/arguments.js';
import { Tree } from '../helpers/tree.js';
import { Index } from '../helpers/index.js';

export const validateArguments = (args: Arguments): Parameters<typeof command> => {
  return [];
};

const command = async () => {
  const index = await Index.read();
  const content = [...index.entries()];
  const tree = Tree.build(content);
  return Tree.write(tree);
};

export default command;
