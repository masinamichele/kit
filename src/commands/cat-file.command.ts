import { Arguments, readKitObject } from '../utils.js';
import assert from 'node:assert/strict';

export const validateArguments = (args: Arguments): Parameters<typeof command> => {
  assert.ok(args.$1);
  return [args.$1];
};

const command = async (sha: string) => {
  const decompressedData = await readKitObject(sha);
  const nullByteIndex = decompressedData.indexOf('\0');
  return decompressedData.subarray(nullByteIndex + 1).toString();
};

export default command;
