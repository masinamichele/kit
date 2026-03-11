import { spawn } from 'node:child_process';
import { appendFile, mkdir } from 'node:fs/promises';
import { appendFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..', '..');
const entrypoint = resolve(projectRoot, 'dist', 'main.js');
const artifactsDirectory = resolve(projectRoot, 'tests', '.artifacts');
const commandOutputLog = resolve(artifactsDirectory, 'command-output.log');
const ansiRegex = /\x1B\[[0-9;]*m/g;

let activeTest = '(unknown test)';
let lastLoggedTest = '';
let hasOpenTestBlock = false;

function formatCommand(args) {
  return args.map((arg) => (/\s/.test(arg) ? JSON.stringify(arg) : arg)).join(' ');
}

function stripAnsi(text) {
  return text.replaceAll(ansiRegex, '');
}

function formatDescriptorOutput(descriptor, text) {
  const normalized = stripAnsi(text).replaceAll('\r\n', '\n').replace(/\n$/, '');
  return normalized
    .split('\n')
    .map((line) => `│  ${descriptor}> ${line}`)
    .join('\n');
}

function hasContent(text) {
  return stripAnsi(text).replaceAll('\r\n', '\n').trimEnd().length > 0;
}

async function appendCommandOutput(testName, args, result) {
  await mkdir(artifactsDirectory, { recursive: true });
  const lines = [];

  if (lastLoggedTest !== testName) {
    const title = ` ${testName} `;
    const width = title.length;
    lines.push(`┌${'─'.repeat(width)}┐`);
    lines.push(`│${title}│`);
    lines.push(`├${'─'.repeat(width)}┘`);
  } else {
    lines.push('├───');
  }

  lines.push(`│ (${result.code}) kit ${formatCommand(args)}`);
  if (hasContent(result.stdout)) {
    lines.push(formatDescriptorOutput('1', result.stdout));
  }
  if (hasContent(result.stderr)) {
    lines.push(formatDescriptorOutput('2', result.stderr));
  }
  const block = lines.join('\n');
  lastLoggedTest = testName;
  hasOpenTestBlock = true;
  await appendFile(commandOutputLog, `${block}\n`, 'utf8');
}

export function setActiveTest(name) {
  activeTest = name;
}

export function clearActiveTest() {
  if (hasOpenTestBlock) {
    appendFileSync(commandOutputLog, '└───\n\n', 'utf8');
    hasOpenTestBlock = false;
  }
  activeTest = '(unknown test)';
}

export function runKit(args, cwd) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(process.execPath, [entrypoint, ...args], {
      cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });

    child.on('error', reject);
    child.on('close', async (code) => {
      const result = { code, stdout, stderr };
      try {
        await appendCommandOutput(activeTest, args, result);
      } catch (error) {
        reject(error);
        return;
      }
      resolvePromise(result);
    });
  });
}

export { commandOutputLog, entrypoint, projectRoot };
