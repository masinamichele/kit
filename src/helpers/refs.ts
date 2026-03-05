import { readFile, writeFile, mkdir, readdir, rm } from 'node:fs/promises';
import { KitRoot } from './kitroot.js';
import { join, dirname, basename } from 'node:path';
import assert from 'node:assert/strict';

export namespace Refs {
  const getHeadRef = async () => {
    const kitRoot = await KitRoot.find();
    const contents = await readFile(join(kitRoot, '.kit/HEAD'), 'utf8');
    const [, refPath] = contents.split('ref: ');
    return join(kitRoot, '.kit', refPath.trim());
  };

  export const getHead = async () => {
    try {
      const ref = await getHeadRef();
      return await readFile(ref, 'utf8');
    } catch {
      return null;
    }
  };

  export const setHead = async (sha: string) => {
    try {
      const ref = await getHeadRef();
      await mkdir(dirname(ref), { recursive: true });
      return await writeFile(ref, sha);
    } catch {
      return null;
    }
  };

  export const getBranchRevision = async (name: string) => {
    const kitRoot = await KitRoot.find();
    const branchPath = join(kitRoot, '.kit/refs/heads', name);
    return readFile(branchPath, 'utf8');
  };

  export const getCurrentBranch = async () => {
    const ref = await getHeadRef();
    return basename(ref);
  };

  export const listBranches = async () => {
    const kitRoot = await KitRoot.find();
    const branchesDir = join(kitRoot, '.kit/refs/heads');
    return readdir(branchesDir);
  };

  export const createBranch = async (name: string) => {
    const kitRoot = await KitRoot.find();
    const latestCommit = await getHead();
    await writeFile(join(kitRoot, '.kit/refs/heads', name), latestCommit);
  };

  export const deleteBranch = async (name: string) => {
    const currentBranch = await getCurrentBranch();
    assert(name !== currentBranch);
    const kitRoot = await KitRoot.find();
    await rm(join(kitRoot, '.kit/refs/heads', name));
  };

  export const existsBranch = async (name: string) => {
    const branches = await listBranches();
    return branches.includes(name);
  };

  export const switchToBranch = async (name: string) => {
    const kitRoot = await KitRoot.find();
    await writeFile(join(kitRoot, '.kit/HEAD'), `ref: refs/heads/${name}\n`);
  };
}
