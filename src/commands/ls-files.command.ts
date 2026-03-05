import { Arguments } from '../helpers/arguments.js';
import { Index } from '../helpers/index.js';

export const validateArguments = (args: Arguments): Parameters<typeof command> => {
  return [];
};

const command = async () => {
  const index = await Index.read();
  return [...index.keys()];
};

export default command;
