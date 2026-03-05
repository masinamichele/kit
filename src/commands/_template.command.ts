// noinspection JSUnusedGlobalSymbols

import assert from 'node:assert/strict';
import { Arguments } from '../helpers/arguments.js';
import { createCommand } from '../helpers/command.js';

export default createCommand({
  validate(args: Arguments) {
    return [];
  },

  async run() {
    return 1;
  },
});
