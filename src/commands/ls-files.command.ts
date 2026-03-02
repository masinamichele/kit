import { resolve } from 'node:path';
import { readFile } from 'node:fs/promises';
import { Arguments } from '../helpers/arguments.js';
import { KitRoot } from '../helpers/kitroot.js';

export const validateArguments = (args: Arguments): Parameters<typeof command> => {
  return [];
};

const command = async () => {
  const indexFile = resolve(await KitRoot.find(), '.kit/index');
  const index = await readFile(indexFile, 'utf8');
  const indexMap: Record<string, string> = Object.fromEntries(
    index
      .split('\n')
      .filter(Boolean)
      .map((row) => row.split('\0').toReversed()),
  );
  return Object.keys(indexMap);
};

export default command;
