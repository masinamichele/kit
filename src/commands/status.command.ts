import { Arguments } from '../helpers/arguments.js';
import { Refs } from '../helpers/refs.js';
import { KitObject } from '../helpers/kitobject.js';
import { Tree } from '../helpers/tree.js';
import { join, posix } from 'node:path';
import { KitRoot } from '../helpers/kitroot.js';
import { readFile } from 'node:fs/promises';
import { WorkingTree } from '../helpers/working-tree.js';
import { createReadStream } from 'node:fs';
import { Colors } from '../helpers/colors.js';

export const validateArguments = (args: Arguments): Parameters<typeof command> => {
  return [];
};

type FileMap = Map<string, string>;

const getHeadState = async () => {
  const headState: FileMap = new Map();
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

const getIndexState = async () => {
  const indexState: FileMap = new Map();
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

const getWorkingDirectoryState = async () => {
  const workingState: FileMap = new Map();
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

const command = async () => {
  const [headState, indexState, workingState] = await Promise.all([
    getHeadState(),
    getIndexState(),
    getWorkingDirectoryState(),
  ]);

  const allPaths = new Set([...headState.keys(), ...indexState.keys(), ...workingState.keys()]);

  const stagedChanges: string[] = [];
  const unstagedChanges: string[] = [];
  const untrackedFiles: string[] = [];

  for (const path of allPaths) {
    const headHash = headState.get(path);
    const indexHash = indexState.get(path);
    const workingHash = workingState.get(path);

    if (!headHash && !indexHash && workingHash) {
      untrackedFiles.push(path);
      continue;
    }

    if (headHash !== indexHash) {
      if (indexHash && !headHash) stagedChanges.push(`new file:   ${path}`);
      else if (!indexHash && headHash) stagedChanges.push(`deleted:    ${path}`);
      else stagedChanges.push(`modified:   ${path}`);
    }

    if (indexHash !== workingHash) {
      if (workingHash && !indexHash) {
        // TODO: handle deletion from index
      } else if (!workingHash && indexHash) unstagedChanges.push(`deleted:    ${path}`);
      else if (workingHash && indexHash) unstagedChanges.push(`modified:   ${path}`);
    }
  }

  const branch = await Refs.getCurrentBranch();
  console.log(`On branch ${branch}`);

  if (stagedChanges.length > 0) {
    console.log('\nChanges to be committed:');
    stagedChanges.forEach((change) => console.log(`        ${Colors.FgGreen}${change}${Colors.Reset}`));
  }

  if (unstagedChanges.length > 0) {
    console.log('\nChanges not staged for commit:');
    unstagedChanges.forEach((change) => console.log(`        ${Colors.FgRed}${change}${Colors.Reset}`));
  }

  if (untrackedFiles.length > 0) {
    console.log('\nUntracked files:');
    untrackedFiles.forEach((file) => console.log(`        ${Colors.FgRed}${file}${Colors.Reset}`));
  }
};

export default command;
