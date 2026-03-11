// noinspection JSUnusedGlobalSymbols

import { Arguments } from '../helpers/arguments.js';
import { Tree } from '../helpers/tree.js';
import { Index } from '../helpers/index.js';
import { createCommand } from '../helpers/command.js';
import { isDirectInvocation } from '../helpers/context.js';

export default createCommand({
  validate(args: Arguments) {
    return [];
  },

  async run() {
    const index = await Index.read();
    const content = [...index.entries()];
    const tree = Tree.build(content);
    const sha = await Tree.write(tree);
    if (isDirectInvocation(import.meta.filename)) {
      console.log(sha);
    }
    return sha;
  },
});
