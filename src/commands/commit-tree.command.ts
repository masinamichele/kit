import { Arguments, Timestamp, writeKitObject } from '../utils.js';
import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { Readable } from 'node:stream';

export const validateArguments = (args: Arguments): Parameters<typeof command> => {
  assert.ok(args.$1);
  assert.ok(args.message);
  return [args.$1, args.message, args.parent];
};

const command = async (sha: string, message: string, parent?: string) => {
  const timestamp = Timestamp.now();
  const timezone = Timestamp.getTimezoneOffset();
  let content = `tree ${sha}`;
  if (parent) content += `\nparent ${parent}`;
  content += `\nauthor NAME <EMAIL> ${timestamp} ${timezone}`;
  content += `\ncommitter NAME <EMAIL> ${timestamp} ${timezone}`;
  content += `\n\n${message}`;
  return writeKitObject(Readable.from(Buffer.from(content)), 'commit');
};

export default command;
