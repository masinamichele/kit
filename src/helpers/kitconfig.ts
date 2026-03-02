import { resolve } from 'node:path';
import { readFile } from 'node:fs/promises';
import { KitRoot } from './kitroot.js';

export class KitConfig {
  user: { name: string; email: string };

  private constructor(input: any) {
    Object.assign(this, input);
  }

  static async read() {
    const configPath = resolve(await KitRoot.find(), '.kit/config');
    const contents = await readFile(configPath, 'utf8');
    return new KitConfig(JSON.parse(contents));
  }
}
