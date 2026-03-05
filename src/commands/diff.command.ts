// noinspection JSUnusedGlobalSymbols

import assert from 'node:assert/strict';
import { Arguments } from '../helpers/arguments.js';
import { createCommand } from '../helpers/command.js';
import { State } from '../helpers/state.js';
import { Colors } from '../helpers/colors.js';
import { KitObject } from '../helpers/kitobject.js';
import { Diff } from '../helpers/diff.js';

export default createCommand({
  validate(args: Arguments) {
    assert.ok(args.$1);
    assert.ok(args.$2);
    return [args.$1, args.$2];
  },

  async run(sha1: string, sha2: string) {
    const [stateA, stateB] = await Promise.all([State.commit(sha1), State.commit(sha2)]);

    const allPaths = new Set([...stateA.keys(), ...stateB.keys()]);

    for (const path of allPaths) {
      const hashA = stateA.get(path);
      const hashB = stateB.get(path);

      if (hashA === hashB) continue;

      if (!hashA && hashB) {
        console.log(`${Colors.FgGreen}Added file: ${path}${Colors.Reset}`);
      } else if (hashA && !hashB) {
        console.log(`${Colors.FgRed}Deleted file: ${path}${Colors.Reset}`);
      } else {
        const [contentA, contentB] = await Promise.all([KitObject.contents(hashA), KitObject.contents(hashB)]);
        Diff.print(path, contentA, contentB);
      }
    }
  },
});
