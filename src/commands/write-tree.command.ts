import { resolve } from 'node:path';
import { Arguments, findKitRoot, writeKitObject } from '../utils.js';
import { readFile } from 'node:fs/promises';
import { sep } from 'node:path/posix';
import { Buffer } from 'node:buffer';
import { Readable } from 'node:stream';

type Tree = { [key: string]: Tree | string };

export const validateArguments = (args: Arguments): Parameters<typeof command> => {
  return [];
};

const buildTree = (content: [string, string][]) => {
  const tree: Tree = {};

  for (const [path, hash] of content) {
    let currentLevel = tree;
    const segments = path.split(sep);
    segments.forEach((segment, index) => {
      if (index === segments.length - 1) {
        currentLevel[segment] = hash;
      } else {
        if (!currentLevel[segment]) {
          currentLevel[segment] = {};
        }
        currentLevel = currentLevel[segment] as Tree;
      }
    });
  }

  return tree;
};

const writeTree = async (tree: Tree) => {
  const childPromises = Object.entries(tree).map(async ([name, value]) => {
    if (typeof value === 'string') {
      return { mode: '100644', hash: value, name };
    }
    const subtreeHash = await writeTree(value);
    return { mode: '040000', hash: subtreeHash, name };
  });
  const children = await Promise.all(childPromises);
  children.sort((a, b) => a.name.localeCompare(b.name));
  const treeContent = Buffer.concat(
    children.map((child) => {
      const entryHeader = Buffer.from(`${child.mode} ${child.name}\0`);
      const binaryHash = Buffer.from(child.hash, 'hex');
      return Buffer.concat([entryHeader, binaryHash]);
    }),
  );

  return writeKitObject(Readable.from(treeContent), 'tree');
};

const command = async () => {
  const indexFile = resolve(await findKitRoot(), '.kit/index');
  const index = await readFile(indexFile, 'utf8');
  const content = index
    .split('\n')
    .filter(Boolean)
    .map((row) => row.split('\0').toReversed()) as [string, string][];

  const tree = buildTree(content);
  return writeTree(tree);
};

export default command;
