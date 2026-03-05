// noinspection JSUnusedGlobalSymbols

import { resolve, join } from 'node:path';
import { mkdir, writeFile, stat } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { Arguments } from '../helpers/arguments.js';
import { createCommand } from '../helpers/command.js';

export default createCommand({
  validate(args: Arguments) {
    assert.ok(args.$1);
    return [resolve(args.$1)];
  },

  async run(root: string) {
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
        mkdir(join(kitRoot, 'refs/heads'), { recursive: true }),
        writeFile(join(kitRoot, 'HEAD'), 'ref: refs/heads/main\n'),
        writeFile(join(kitRoot, 'index'), ''),
      ]);
      console.log('Kit repository initialized successfully');
      return kitRoot;
    }
  },
});
