import { resolve } from 'node:path';
import { Arguments, findKitRoot } from '../utils.js';
import { readFile } from 'node:fs/promises';

export const validateArguments = (args: Arguments): Parameters<typeof command> => {
  return [];
};

const command = async () => {
  const indexFile = resolve(await findKitRoot(), '.kit/index');
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
