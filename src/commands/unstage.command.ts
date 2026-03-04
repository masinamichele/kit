import assert from 'node:assert/strict';
import { Arguments } from '../helpers/arguments.js';
import { resolve, join } from 'node:path';
import { State } from '../helpers/state.js';
import { KitRoot } from '../helpers/kitroot.js';
import { writeFile } from 'node:fs/promises';

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

  const kitRoot = await KitRoot.find();
  const indexFile = join(kitRoot, '.kit/index');
  const newContent = [...indexState.entries()].map(([name, hash]) => `${hash}\0${name}`).join('\n');
  await writeFile(indexFile, newContent);
};

export default command;
