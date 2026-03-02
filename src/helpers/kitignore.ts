import { resolve } from 'node:path';
import { KitRoot } from './kitroot.js';
import { readFile } from 'node:fs/promises';
import relativeSync = KitRoot.relativeSync;

export class KitIgnore {
  private static patterns: string[] = [];
  private static kitRoot: string;
  private static initialized = false;

  static async init() {
    if (this.initialized) return;
    this.kitRoot = await KitRoot.find();
    const configPath = resolve(this.kitRoot, '.kitignore');
    try {
      const contents = await readFile(configPath, 'utf8');
      this.patterns = contents
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => !!line && !line.startsWith('#'));
    } finally {
      this.initialized = true;
    }
  }

  static isIgnored(path: string) {
    const relativePath = KitRoot.relativeSync(this.kitRoot, path);
    for (const pattern of this.patterns) {
      if (this.matches(relativePath, pattern)) {
        return true;
      }
    }
    return false;
  }

  private static matches(path: string, pattern: string): boolean {
    if (pattern.startsWith('/')) {
      const rootPattern = pattern.slice(1);
      if (rootPattern.endsWith('/')) {
        const dirPattern = rootPattern.slice(0, -1);
        return path === dirPattern || path.startsWith(dirPattern + '/');
      }
      const pathSegments = path.split('/');
      return this.segmentMatches(pathSegments[0], rootPattern);
    }

    if (pattern.endsWith('/')) {
      const dirPattern = pattern.slice(0, -1);
      const pathSegments = path.split('/');
      pathSegments.pop();
      return pathSegments.some((segment) => this.segmentMatches(segment, dirPattern));
    }

    const pathSegments = path.split('/');
    return pathSegments.some((segment) => this.segmentMatches(segment, pattern));
  }

  private static segmentMatches(pathSegment: string, pattern: string) {
    if (!pattern.includes('*')) {
      return pathSegment === pattern;
    }

    const regexPattern = pattern.replaceAll(/[.+?^${}()|[\]\\]/g, String.raw`\$&`).replaceAll('*', '.*');

    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(pathSegment);
  }
}
