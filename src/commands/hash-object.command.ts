import { createReadStream } from 'node:fs';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import { Arguments } from '../helpers/arguments.js';
import { KitObject } from '../helpers/kitobject.js';

export const validateArguments = (args: Arguments): Parameters<typeof command> => {
  assert.ok(args.$1);
  return [resolve(args.$1), args.write];
};

const command = async (filePath: string, write: boolean) => {
  const source = createReadStream(filePath);
  return KitObject.write(source, 'blob', write);
};

export default command;
