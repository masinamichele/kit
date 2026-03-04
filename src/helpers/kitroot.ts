import { readdir, stat } from 'node:fs/promises';
import { resolve, relative as pathRelative, dirname, sep, posix } from 'node:path';
import process from 'node:process';

let root: string;

export namespace KitRoot {
  export const find = async (): Promise<string> => {
    if (root) return root;

    const findKitRoot = async (currentPath: string): Promise<string> => {
      const stats = await stat(currentPath);

      if (!stats.isDirectory()) currentPath = dirname(currentPath);

      const dirs = await readdir(currentPath, { withFileTypes: true });

      if (dirs.some((dir) => dir.isDirectory() && dir.name === '.kit')) {
        root = currentPath;
        return resolve(currentPath);
      }

      const newStart = resolve(currentPath, '..');
      if (newStart === currentPath) {
        throw new Error('No .kit repository found');
      }

      return findKitRoot(newStart);
    };

    return findKitRoot(process.cwd());
  };

  export const relative = async (path: string) => {
    return posix.join(...pathRelative(await find(), path).split(sep));
  };

  export const relativeSync = (root: string, path: string) => {
    return posix.join(...pathRelative(root, path).split(sep));
  };
}
