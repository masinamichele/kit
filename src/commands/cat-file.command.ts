import assert from 'node:assert/strict';
import { Arguments } from '../helpers/arguments.js';
import { KitObject } from '../helpers/kitobject.js';

export const validateArguments = (args: Arguments): Parameters<typeof command> => {
  assert.ok(args.$1);
  return [args.$1];
};

const command = async (sha: string) => {
  const decompressedData = await KitObject.read(sha);
  const nullByteIndex = decompressedData.indexOf('\0');
  return decompressedData.subarray(nullByteIndex + 1).toString();
};

export default command;
