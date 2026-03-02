import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { Readable } from 'node:stream';
import { Arguments } from '../helpers/arguments.js';
import { Timestamp } from '../helpers/timestamp.js';
import { KitConfig } from '../helpers/kitconfig.js';
import { KitObject } from '../helpers/kitobject.js';

export const validateArguments = (args: Arguments): Parameters<typeof command> => {
  assert.ok(args.$1);
  assert.ok(args.message);
  return [args.$1, args.message, args.parent];
};

const command = async (sha: string, message: string, parent?: string) => {
  const timestamp = Timestamp.now();
  const timezone = Timestamp.getTimezoneOffset();
  const config = await KitConfig.read();
  let content = `tree ${sha}`;
  if (parent) content += `\nparent ${parent}`;
  content += `\nauthor ${config.user.name} <${config.user.email}> ${timestamp} ${timezone}`;
  content += `\ncommitter ${config.user.name} <${config.user.email}> ${timestamp} ${timezone}`;
  content += `\n\n${message}`;
  return KitObject.write(Readable.from(Buffer.from(content)), 'commit');
};

export default command;
