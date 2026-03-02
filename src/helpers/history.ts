import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { KitRoot } from './kitroot.js';
import { join, dirname } from 'node:path';

export namespace History {
  export const getHeadRef = async () => {
    const kitRoot = await KitRoot.find();
    const contents = await readFile(join(kitRoot, '.kit/HEAD'), 'utf8');
    const [, refPath] = contents.split('ref: ');
    return join(kitRoot, '.kit', refPath.trim());
  };

  export const getLatestCommit = async () => {
    try {
      const ref = await getHeadRef();
      return await readFile(ref, 'utf8');
    } catch {
      return null;
    }
  };

  export const setLatestCommit = async (sha: string) => {
    try {
      const ref = await getHeadRef();
      await mkdir(dirname(ref), { recursive: true });
      return await writeFile(ref, sha);
    } catch (e) {
      console.log(e)
      return null;
    }
  };
}
