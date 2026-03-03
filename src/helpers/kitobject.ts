import { mkdir } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { createReadStream, createWriteStream } from 'node:fs';
import { createDeflate, createInflate } from 'node:zlib';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
import { buffer } from 'node:stream/consumers';
import { hash } from 'node:crypto';
import { Buffer } from 'node:buffer';
import { KitRoot } from './kitroot.js';

export namespace KitObject {
  type ObjectType = 'blob' | 'tree' | 'commit';

  export const write = async (source: Readable, type: ObjectType, write = true) => {
    const content = await buffer(source);
    const header = `${type} ${content.length}\0`;
    const fullContent = Buffer.concat([Buffer.from(header), content]);
    const sha = hash('sha1', fullContent, { outputEncoding: 'hex' });
    if (write) {
      const objectDir = resolve(await KitRoot.find(), '.kit/objects', sha.slice(0, 2));
      await mkdir(objectDir, { recursive: true });
      const objectPath = join(objectDir, sha.slice(2));
      await pipeline(Readable.from(fullContent), createDeflate(), createWriteStream(objectPath));
    }
    return sha;
  };

  export const raw = async (sha: string): Promise<Buffer> => {
    const objectDir = resolve(await KitRoot.find(), '.kit/objects', sha.slice(0, 2));
    const objectPath = join(objectDir, sha.slice(2));
    const source = createReadStream(objectPath);
    const inflate = createInflate();
    source.pipe(inflate);
    return buffer(inflate);
  };

  export const read = async (sha: string): Promise<string> => {
    const buffer = await raw(sha);
    return buffer.toString('utf8');
  };
}
