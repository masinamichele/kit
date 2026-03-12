// noinspection JSUnusedGlobalSymbols

import assert from 'node:assert/strict';
import { Arguments } from '../helpers/arguments.js';
import { Refs } from '../helpers/refs.js';
import { createCommand } from '../helpers/command.js';

export default createCommand({
  validate(args: Arguments) {
    assert(!(args.$1 && args.create));
    assert(!(args.$1 && args.delete));
    assert(!(args.create && args.delete));
    if (args.$1) return [args.$1, null, null];
    if (args.create) return [null, args.create, null];
    if (args.delete) return [null, null, args.delete];
    return [null, null, null];
  },

  async run(target?: string, create?: string, del?: string) {
    if (target) {
      if (await Refs.existsBranch(target)) {
        await Refs.switchToBranch(target);
        console.log(`Switched to branch '${target}'`);
        return;
      }
      throw new Error(`Branch does not exist: '${target}'`);
    }

    if (create) {
      if (await Refs.existsBranch(create)) {
        throw new Error(`Branch already exists: '${create}'`);
      }
      await Refs.createBranch(create);
      await Refs.switchToBranch(create);
      console.log(`Switched to a new branch '${create}'`);
      return;
    }

    if (del) {
      const currentBranch = await Refs.getCurrentBranch();
      if (currentBranch === del) {
        throw new Error(`Cannot delete current branch: '${del}'`);
      }
      await Refs.deleteBranch(del);
      console.log(`Deleted branch '${del}'`);
      return;
    }

    const currentBranch = await Refs.getCurrentBranch();
    const branches = await Refs.listBranches();
    for (const branch of new Set([currentBranch, ...branches])) {
      const isCurrent = branch === currentBranch;
      console.log(`${isCurrent ? '*' : ' '} ${branch}`);
    }
  },
});
