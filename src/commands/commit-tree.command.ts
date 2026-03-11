// noinspection JSUnusedGlobalSymbols

import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { Readable } from 'node:stream';
import { Arguments } from '../helpers/arguments.js';
import { Timestamp } from '../helpers/timestamp.js';
import { KitConfig } from '../helpers/kitconfig.js';
import { KitObject } from '../helpers/kitobject.js';
import { createCommand } from '../helpers/command.js';
import revParse from './rev-parse.command.js';
import { isDirectInvocation } from '../helpers/context.js';

export default createCommand({
  validate(args: Arguments) {
    assert.ok(args.$1);
    assert.ok(args.message);
    return [args.$1, args.message, args.parent];
  },

  async run(sha: string, message: string, parent?: string) {
    sha = await revParse.run(sha);
    const timestamp = Timestamp.now();
    const timezone = Timestamp.getTimezoneOffset();
    const config = await KitConfig.read();
    let content = `tree ${sha}`;
    if (parent) content += `\nparent ${parent}`;
    content += `\nauthor ${config.user.name} <${config.user.email}> ${timestamp} ${timezone}`;
    content += `\ncommitter ${config.user.name} <${config.user.email}> ${timestamp} ${timezone}`;
    content += `\n\n${message}`;
    const commitSha = await KitObject.write(Readable.from(Buffer.from(content)), 'commit');
    if (isDirectInvocation(import.meta.filename)) {
      console.log(commitSha);
    }
    return commitSha;
  },
});
