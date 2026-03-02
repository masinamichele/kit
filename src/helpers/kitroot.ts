import { readdir, stat } from 'node:fs/promises';
import { resolve, relative as pathRelative, dirname, sep, posix } from 'node:path';
import process from 'node:process';

export namespace KitRoot {
  export const find = async (start = process.cwd()): Promise<string> => {
    const stats = await stat(start);
    if (!stats.isDirectory()) start = dirname(start);
    const dirs = await readdir(start, { withFileTypes: true });
    if (dirs.some((dir) => dir.isDirectory() && dir.name === '.kit')) {
      return resolve(start);
    }
    const newStart = resolve(start, '..');
    if (newStart === start) {
      throw new Error('No .kit repository found');
    }
    return find(newStart);
  };

  export const relative = async (path: string) => {
    return posix.join(...pathRelative(await find(path), path).split(sep));
  };

  export const relativeSync = (root: string, path: string) => {
    return posix.join(...pathRelative(root, path).split(sep));
  };
}
