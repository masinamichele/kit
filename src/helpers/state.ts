import { Refs } from './refs.js';
import { KitObject } from './kitobject.js';
import { Tree } from './tree.js';
import { join, posix } from 'node:path';
import { KitRoot } from './kitroot.js';
import { readFile } from 'node:fs/promises';
import { WorkingTree } from './working-tree.js';
import { createReadStream } from 'node:fs';
import { Index } from './index.js';

export namespace State {
  export const head = async () => {
    const headState = new Map<string, string>();
    const headSha = await Refs.getHead();
    if (!headSha) return headState;
    const commitContents = await KitObject.read(headSha);
    const [headers] = commitContents.split('\n\n');
    const [, treeSha] = /tree (.+)/.exec(headers);

    const readTreeRecursive = async (sha: string, pathPrefix = '') => {
      const rawTree = await KitObject.raw(sha);
      const entries = Tree.parse(rawTree);

      for (const entry of entries) {
        const path = posix.join(pathPrefix, entry.name);
        if (entry.mode === '040000') {
          await readTreeRecursive(entry.hash, path);
        } else headState.set(path, entry.hash);
      }
    };

    await readTreeRecursive(treeSha);
    return headState;
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
