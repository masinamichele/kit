import { resolve, join } from 'node:path';
import { mkdir, writeFile, stat } from 'node:fs/promises';
import { Arguments } from '../classes/arguments.js';
import assert from 'node:assert/strict';

export const validateArguments = (args: Arguments): Parameters<typeof command> => {
  assert.ok(args.$1);
  return [resolve(args[0])];
};

const command = async (root: string) => {
  await mkdir(root, { recursive: true });
  const kitRoot = join(root, '.kit');
  try {
    await stat(kitRoot);
    console.error('Kit repository already exists');
    process.exit(1);
  } catch (error: any) {
    if (error.code !== 'ENOENT') throw error;
    await mkdir(kitRoot);
    await Promise.all([
      mkdir(join(kitRoot, 'objects')),
      mkdir(join(kitRoot, 'refs')),
      writeFile(join(kitRoot, 'HEAD'), 'ref: refs/heads/main\n'),
    ]);
    console.log('Kit repository initialized successfully');
    return kitRoot;
  }
};

export default command;
