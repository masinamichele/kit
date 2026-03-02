import { readdir, stat, mkdir } from 'node:fs/promises';
import { createReadStream, createWriteStream } from 'node:fs';
import { resolve, relative, dirname, join, sep, posix } from 'node:path';
import { createDeflate, createInflate } from 'node:zlib';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
import process from 'node:process';
import { buffer } from 'node:stream/consumers';
import { hash } from 'node:crypto';
import { Buffer } from 'node:buffer';

export const findKitRoot = async (start = process.cwd()): Promise<string> => {
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
  return findKitRoot(newStart);
};

export const relativeToKitRoot = async (path: string) => {
  return posix.join(...relative(await findKitRoot(path), path).split(sep));
};

export type ObjectType = 'blob' | 'tree' | 'commit';

export const writeKitObject = async (source: Readable, type: ObjectType, write = true) => {
  const content = await buffer(source);
  const header = `${type} ${content.length}`;
  const fullContent = Buffer.concat([Buffer.from(header), content]);
  const sha = hash('sha1', fullContent, { outputEncoding: 'hex' });
  if (write) {
    const objectDir = resolve(await findKitRoot(), '.kit/objects', sha.slice(0, 2));
    await mkdir(objectDir, { recursive: true });
    const objectPath = join(objectDir, sha.slice(2));
    await pipeline(Readable.from(fullContent), createDeflate(), createWriteStream(objectPath));
  }
  return sha;
};

export const readKitObject = async (sha: string): Promise<Buffer> => {
  const objectDir = resolve(await findKitRoot(), '.kit/objects', sha.slice(0, 2));
  const objectPath = join(objectDir, sha.slice(2));
  const source = createReadStream(objectPath);
  const inflate = createInflate();
  source.pipe(inflate);
  return buffer(inflate);
};

export namespace Timestamp {
  export const now = () => {
    return Math.floor(Date.now() / 1000);
  };

  export const getTimezoneOffset = () => {
    const offset = -new Date().getTimezoneOffset(); // Invert the sign
    const sign = offset >= 0 ? '+' : '-';
    const hours = Math.floor(Math.abs(offset) / 60)
      .toString()
      .padStart(2, '0');
    const minutes = (Math.abs(offset) % 60).toString().padStart(2, '0');
    return `${sign}${hours}${minutes}`;
  };
}

export type Arguments = Record<string, any>;

const shortArgumentsMap: Record<string, string> = { w: 'write', m: 'message', p: 'parent' };

export class ArgumentParser {
  static parse(argv: string[]) {
    const args: Arguments = {};
    let positionalCount = 1;
    for (let i = 0; i < argv.length; i++) {
      const arg = argv[i];
      if (arg.startsWith('-')) {
        let key = arg
          .slice(arg.startsWith('--') ? 2 : 1)
          .toLowerCase()
          .replaceAll(/-([a-z])/g, (_, p1) => p1.toUpperCase());
        if (shortArgumentsMap[key]) key = shortArgumentsMap[key];
        const next = argv[i + 1];
        if (next && !next.startsWith('-')) {
          args[key] = next;
        } else args[key] = true;
        i++;
      } else {
        args[`$${positionalCount++}`] = arg;
      }
    }
    return args;
  }
}
