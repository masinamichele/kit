import { sep } from 'node:path/posix';
import { Buffer } from 'node:buffer';
import { Readable } from 'node:stream';
import { KitObject } from './kitobject.js';

export namespace Tree {
  type Tree = { [key: string]: Tree | string };
  type Entry = { mode: string; name: string; hash: string };

  export const build = (content: [string, string][]) => {
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

  export const write = async (tree: Tree) => {
    const childPromises = Object.entries(tree).map<Promise<Entry>>(async ([name, value]) => {
      if (typeof value === 'string') {
        return { mode: '100644', hash: value, name };
      }
      const subtreeHash = await write(value);
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

    return KitObject.write(Readable.from(treeContent), 'tree');
  };

  export const parse = (buffer: Buffer) => {
    const entries: Entry[] = [];
    const headerEndIndex = buffer.indexOf('\0');
    let cursor = headerEndIndex + 1;

    while (cursor < buffer.length) {
      const spaceIndex = buffer.indexOf(0x20, cursor);
      const mode = buffer.subarray(cursor, spaceIndex).toString();
      const nullByteIndex = buffer.indexOf('\0', cursor);
      const name = buffer.subarray(spaceIndex + 1, nullByteIndex).toString();
      const hash = buffer.subarray(nullByteIndex + 1, nullByteIndex + 21).toString('hex');
      entries.push({ mode, name, hash });
      cursor = nullByteIndex + 21;
    }

    return entries;
  };
}
