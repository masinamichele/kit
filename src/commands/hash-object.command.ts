// noinspection JSUnusedGlobalSymbols

import { createReadStream } from 'node:fs';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import { Arguments } from '../helpers/arguments.js';
import { KitObject } from '../helpers/kitobject.js';
import { createCommand } from '../helpers/command.js';
import { isDirectInvocation } from '../helpers/context.js';

export default createCommand({
  validate(args: Arguments) {
    assert.ok(args.$1);
    return [resolve(args.$1), args.write];
  },

  async run(filePath: string, write: boolean) {
    const source = createReadStream(filePath);
    const sha = await KitObject.write(source, 'blob', write);
    if (isDirectInvocation(import.meta.filename)) {
      console.log(sha);
    }
    return sha;
  },
});
