import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { KitRoot } from './kitroot.js';
import { KitIgnore } from './kitignore.js';

export namespace WorkingTree {
  export const findTrackableFiles = async (...paths: string[]) => {
    const allFiles = new Set<string>();
    for (const path of paths) {
      const stats = await stat(path);
      if (stats.isFile()) allFiles.add(path);
      else {
        const entries = await readdir(path, { recursive: true, withFileTypes: true });
        const filesInDir = entries.filter((entry) => entry.isFile()).map((entry) => join(entry.parentPath, entry.name));
        for (const file of filesInDir) allFiles.add(file);
      }
    }
    const kitDir = join(await KitRoot.find(), '.kit');
    return [...allFiles.values()]
      .filter((file) => !file.startsWith(kitDir) || file.endsWith('.kitignore'))
      .filter((file) => !KitIgnore.isIgnored(file));
  };
}
