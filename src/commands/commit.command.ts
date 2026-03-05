// noinspection JSUnusedGlobalSymbols

import assert from 'node:assert/strict';
import { Arguments } from '../helpers/arguments.js';
import writeTree from './write-tree.command.js';
import { Refs } from '../helpers/refs.js';
import commitTree from './commit-tree.command.js';
import { createCommand } from '../helpers/command.js';

export default createCommand({
  validate(args: Arguments) {
    assert.ok(args.message);
    return [args.message];
  },

  async run(message: string) {
    const treeSha = await writeTree.run();
    const parentSha = await Refs.getHead();
    const commitSha = await commitTree.run(treeSha, message, parentSha);
    await Refs.setHead(commitSha);
  },
});
