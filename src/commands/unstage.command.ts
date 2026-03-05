import assert from 'node:assert/strict';
import { Arguments } from '../helpers/arguments.js';
import { resolve } from 'node:path';
import { State } from '../helpers/state.js';
import { KitRoot } from '../helpers/kitroot.js';
import { Index } from '../helpers/index.js';

export const validateArguments = (args: Arguments): Parameters<typeof command> => {
  assert.ok(args.$1);
  return [args._.map((path) => resolve(path))];
};

const command = async (paths: string[]) => {
  const [headState, indexState] = await Promise.all([State.head(), State.index()]);
  for (const path of paths) {
    const relative = await KitRoot.relative(path);
    const headHash = headState.get(relative);
    if (headHash) indexState.set(relative, headHash);
    else indexState.delete(relative);
  }

  await Index.write([...indexState.entries()]);
};

export default command;
