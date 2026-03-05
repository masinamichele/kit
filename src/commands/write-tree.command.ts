// noinspection JSUnusedGlobalSymbols

import { Arguments } from '../helpers/arguments.js';
import { Tree } from '../helpers/tree.js';
import { Index } from '../helpers/index.js';
import { createCommand } from '../helpers/command.js';

export default createCommand({
  validate(args: Arguments) {
    return [];
  },

  async run() {
    const index = await Index.read();
    const content = [...index.entries()];
    const tree = Tree.build(content);
    return Tree.write(tree);
  },
});
