// noinspection JSUnusedGlobalSymbols

import { Arguments } from '../helpers/arguments.js';
import { Index } from '../helpers/index.js';
import { createCommand } from '../helpers/command.js';
import { isDirectInvocation } from '../helpers/context.js';

export default createCommand({
  validate(args: Arguments) {
    return [];
  },

  async run() {
    const index = await Index.read();
    const paths = [...index.keys()];
    if (isDirectInvocation(import.meta.filename)) {
      for (const path of paths) {
        console.log(path);
      }
    }
    return paths;
  },
});
