// noinspection JSUnusedGlobalSymbols

import assert from 'node:assert/strict';
import { Arguments } from '../helpers/arguments.js';
import { createCommand } from '../helpers/command.js';
import { Refs } from '../helpers/refs.js';
import { join } from 'node:path';
import { KitRoot } from '../helpers/kitroot.js';
import { readdir } from 'node:fs/promises';

export default createCommand({
  validate(args: Arguments) {
    assert.ok(args.$1);
    return [args.$1];
  },

  async run(revision: string) {
    if (revision === 'HEAD') return Refs.getHead();
    const branches = await Refs.listBranches();
    if (branches.includes(revision)) {
      return Refs.getBranchRevision(revision);
    }
    const [, head, rest] = /^(..)(.+)$/.exec(revision);
    const root = await KitRoot.find();
    const headPath = join(root, '.kit/objects', head);
    const allObjects = await readdir(headPath);
    const objects = allObjects.filter((obj) => obj.startsWith(rest));
    if (!objects.length) throw new Error(`No object found with prefix ${revision}`);
    if (objects.length > 1) throw new Error(`Ambiguous short SHA: ${revision} matches multiple objects`);
    return `${head}${objects[0]}`;
  },
});
