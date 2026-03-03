import process from 'node:process';
import { join } from 'node:path';
import { readdir } from 'node:fs/promises';
import { ArgumentParser } from './helpers/arguments.js';
import { KitIgnore } from './helpers/kitignore.js';

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

  const module = await import(`./commands/${commandFile}`);

  const parsedArguments = ArgumentParser.parse(argv);
  const args = module.validateArguments(parsedArguments);
  const result = await module.default(...args);

  if (result) {
    if (Array.isArray(result)) {
      console.log(result.join('\n'));
    } else {
      console.log(result);
    }
  }
} catch (error) {
  console.error(error);
  process.exit(1);
}
