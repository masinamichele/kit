import { mkdir, rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..', '..');
const commandOutputLog = resolve(projectRoot, 'tests', '.artifacts', 'command-output.log');

await mkdir(dirname(commandOutputLog), { recursive: true });
await rm(commandOutputLog, { force: true });
