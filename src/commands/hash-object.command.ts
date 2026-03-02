import { createReadStream } from 'node:fs';
import { resolve } from 'node:path';
import { Arguments, writeKitObject } from '../utils.js';
import assert from 'node:assert/strict';

export const validateArguments = (args: Arguments): Parameters<typeof command> => {
  assert.ok(args.$1);
  return [resolve(args.$1), args.write];
};

const command = async (filePath: string, write: boolean) => {
  const source = createReadStream(filePath);
  return writeKitObject(source, 'blob', write);
};

export default command;
