import { Refs } from './refs.js';
import { KitObject } from './kitobject.js';
import { Tree } from './tree.js';
import { posix } from 'node:path';
import { KitRoot } from './kitroot.js';
import { WorkingTree } from './working-tree.js';
import { createReadStream } from 'node:fs';
import { Index } from './index.js';

export namespace State {
  export const commit = async (sha: string) => {
    const state = new Map<string, string>();
    if (!sha) return state;
    const commitContents = await KitObject.read(sha);
    const [headers] = commitContents.split('\n\n');
    const [, treeSha] = /tree (.+)/.exec(headers);

    const readTreeRecursive = async (sha: string, pathPrefix = '') => {
      const rawTree = await KitObject.raw(sha);
      const entries = Tree.parse(rawTree);

      for (const entry of entries) {
        const path = posix.join(pathPrefix, entry.name);
        if (entry.mode === '040000') {
          await readTreeRecursive(entry.hash, path);
        } else state.set(path, entry.hash);
      }
    };

    await readTreeRecursive(treeSha);
    return state;
  };

  export const head = async () => {
    const headSha = await Refs.getHead();
    return commit(headSha);
  };

  export const index = async () => {
    return Index.read();
  };

  export const workingDirectory = async () => {
    const workingState = new Map<string, string>();
    const kitRoot = await KitRoot.find();
    const trackableFiles = await WorkingTree.findTrackableFiles(kitRoot);
    const hashPromises = trackableFiles.map(async (file) => {
      const source = createReadStream(file);
      const hash = await KitObject.write(source, 'blob', false);
      const relativePath = await KitRoot.relative(file);
      workingState.set(relativePath, hash);
    });
    await Promise.all(hashPromises);
    return workingState;
  };
}
