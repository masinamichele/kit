// noinspection JSUnusedGlobalSymbols

import assert from 'node:assert/strict';
import { Arguments } from '../helpers/arguments.js';
import { createCommand } from '../helpers/command.js';
import { Refs } from '../helpers/refs.js';
import { join } from 'node:path';
import { KitRoot } from '../helpers/kitroot.js';
import { readdir } from 'node:fs/promises';
import { KitObject } from '../helpers/kitobject.js';

const resolveBaseRevision = async (revision: string) => {
  if (revision === 'HEAD') return Refs.getHead();
  const branches = await Refs.listBranches();
  if (branches.includes(revision)) {
    return Refs.getBranchRevision(revision);
  }
  if (revision.length < 3) throw new Error(`Invalid short SHA: ${revision}`);
  const [, head, rest] = /^(..)(.+)$/.exec(revision);
  const root = await KitRoot.find();
  const headPath = join(root, '.kit/objects', head);
  const allObjects = await readdir(headPath);
  const objects = allObjects.filter((obj) => obj.startsWith(rest));
  if (!objects.length) throw new Error(`No object found with prefix ${revision}`);
  if (objects.length > 1) throw new Error(`Ambiguous short SHA: ${revision} matches multiple objects`);
  return `${head}${objects[0]}`;
};

export default createCommand({
  validate(args: Arguments) {
    assert.ok(args.$1);
    return [args.$1];
  },

  async run(revision: string) {
    const ancestryMatch = /([~^].*)$/.exec(revision);
    const suffix = ancestryMatch ? ancestryMatch[1] : '';
    const baseRevision = suffix ? revision.slice(0, -suffix.length) : revision;

    let currentSha = await resolveBaseRevision(baseRevision);

    let steps = 0;
    if (suffix.startsWith('~')) {
      steps = +suffix.slice(1);
      if (Number.isNaN(steps)) throw new Error(`Invalid revision suffix: ${suffix}`);
    } else {
      steps = suffix.match(/\^/g)?.length ?? 0;
    }

    for (let i = 0; i < steps; i++) {
      if (!currentSha) {
        throw new Error(`Cannot find ancestor for revision ${revision}`);
      }
      const commitContents = await KitObject.read(currentSha);
      const parentMatch = /parent (.+)/.exec(commitContents);
      if (!parentMatch) {
        throw new Error(`Cannot find parent for commit ${currentSha} (reached root)`);
      }
      currentSha = parentMatch[1];
    }

    return currentSha;
  },
});
