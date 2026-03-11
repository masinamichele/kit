import process from 'node:process';
import { join } from 'node:path';
import { readdir } from 'node:fs/promises';
import { ArgumentParser } from './helpers/arguments.js';
import { KitIgnore } from './helpers/kitignore.js';
import { Command } from './helpers/command.js';
import { withContext } from './helpers/context.js';

const argv = process.argv.slice(2);
const command = argv.shift();

try {
  const commandsDirectory = join(import.meta.dirname, 'commands');
  const commandsFiles = (await readdir(commandsDirectory)).filter((file) => file.endsWith('.command.js'));
  const commandFile = `${command}.command.js`;
  if (!commandsFiles.includes(commandFile)) {
    console.error(`Invalid command: ${command}`);
    process.exit(1);
  }

  if (command !== 'init') await KitIgnore.init();

  await withContext(commandFile, async () => {
    const module: Command<any> = (await import(`./commands/${commandFile}`)).default;
    const parsedArguments = ArgumentParser.parse(argv);
    const args = module.validate(parsedArguments);
    await module.run(...args);
  });
} catch (error) {
  const message = error instanceof Error ? error.message : error;
  console.error(message);
  process.exit(1);
}
