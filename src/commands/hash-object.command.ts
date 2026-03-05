// noinspection JSUnusedGlobalSymbols

import { createReadStream } from 'node:fs';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import { Arguments } from '../helpers/arguments.js';
import { KitObject } from '../helpers/kitobject.js';
import { createCommand } from '../helpers/command.js';

export default createCommand({
  validate(args: Arguments) {
    assert.ok(args.$1);
    return [resolve(args.$1), args.write];
  },

  async run(filePath: string, write: boolean) {
    const source = createReadStream(filePath);
    return KitObject.write(source, 'blob', write);
  },
});
