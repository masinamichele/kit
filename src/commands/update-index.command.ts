// noinspection JSUnusedGlobalSymbols

import hashObject from './hash-object.command.js';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import { Arguments } from '../helpers/arguments.js';
import { KitRoot } from '../helpers/kitroot.js';
import { Index } from '../helpers/index.js';
import { createCommand } from '../helpers/command.js';

export default createCommand({
  validate(args: Arguments) {
    assert.ok(args.$1);
    return [resolve(args.$1)];
  },

  async run(filePath: string) {
    const hash = await hashObject.run(filePath, true);
    const index = await Index.read();
    const relative = await KitRoot.relative(filePath);
    index.set(relative, hash);
    await Index.write([...index.entries()]);
  },
});
