import { KitRoot } from './kitroot.js';
import { join } from 'node:path';
import { readFile, writeFile } from 'node:fs/promises';

export namespace Index {
  export const read = async () => {
    const indexState = new Map<string, string>();
    const kitRoot = await KitRoot.find();
    const indexFile = join(kitRoot, '.kit/index');
    const index = await readFile(indexFile, 'utf8');
    const entries = index
      .split('\n')
      .filter(Boolean)
      .map((row) => row.split('\0'));
    for (const [hash, path] of entries) {
      indexState.set(path, hash);
    }
    return indexState;
  };

  export const write = async (indexState: [string, string][]): Promise<void> => {
    const kitRoot = await KitRoot.find();
    const indexFile = join(kitRoot, '.kit/index');

    const newContent = indexState.map(([path, hash]) => `${hash}\0${path}`).join('\n');

    await writeFile(indexFile, newContent);
  };
}
