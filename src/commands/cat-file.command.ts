// noinspection JSUnusedGlobalSymbols

import assert from 'node:assert/strict';
import { Arguments } from '../helpers/arguments.js';
import { KitObject } from '../helpers/kitobject.js';
import { createCommand } from '../helpers/command.js';
import revParse from './rev-parse.command.js';

export default createCommand({
  validate(args: Arguments) {
    assert.ok(args.$1);
    return [args.$1];
  },

  async run(sha: string) {
    sha = await revParse.run(sha);
    const decompressedData = await KitObject.raw(sha);
    const nullByteIndex = decompressedData.indexOf('\0');
    return decompressedData.subarray(nullByteIndex + 1).toString();
  },
});
