// noinspection JSUnusedGlobalSymbols

import assert from 'node:assert/strict';
import { Arguments } from '../helpers/arguments.js';
import { createCommand } from '../helpers/command.js';
import { Refs } from '../helpers/refs.js';
import { join } from 'node:path';
import { KitRoot } from '../helpers/kitroot.js';
import { readdir } from 'node:fs/promises';
import { KitObject } from '../helpers/kitobject.js';
import { isDirectInvocation } from '../helpers/context.js';

const resolveBaseRevision = async (revision: string) => {
  if (revision === 'HEAD') return Refs.getHead();
  const branches = await Refs.listBranches();
  if (branches.includes(revision)) {
    return Refs.getBranchRevision(revision);
  }
  revision = revision.toLowerCase();
  if (revision.length < 3) throw new Error(`Invalid short SHA: ${revision}`);
  if (!/^[0-9a-f]+$/.test(revision)) {
    throw new Error(`Invalid revision: ${revision}`);
  }
  const [, head, rest] = /^(..)(.+)$/.exec(revision);
  const root = await KitRoot.find();
  const headPath = join(root, '.kit/objects', head);
  const allObjects = await (async (): Promise<string[]> => {
    try {
      return await readdir(headPath);
    } catch {
      return [];
    }
  })();
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
      if (!/^~\d+$/.test(suffix)) {
        throw new Error(`Invalid ancestor suffix: ${suffix}`);
      }
      const stepsBack = Number.parseInt(suffix.split('~')[1]);
      steps = +stepsBack;
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

    if (!currentSha) {
      throw new Error(`Cannot resolve revision ${revision}`);
    }

    if (isDirectInvocation(import.meta.filename)) {
      console.log(currentSha);
    }

    return currentSha;
  },
});
