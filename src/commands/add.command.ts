// noinspection JSUnusedGlobalSymbols

import assert from 'node:assert/strict';
import { Arguments } from '../helpers/arguments.js';
import { resolve } from 'node:path';
import updateIndex from './update-index.command.js';
import { WorkingTree } from '../helpers/working-tree.js';
import { createCommand } from '../helpers/command.js';

export default createCommand({
  validate(args: Arguments) {
    assert.ok(args.$1);
    return [args._.map((path) => resolve(path))];
  },

  async run(paths: string[]) {
    const files = await WorkingTree.findTrackableFiles(...paths);
    for (const file of files) {
      await updateIndex.run(file);
    }
  },
});
