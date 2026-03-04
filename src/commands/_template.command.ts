import assert from 'node:assert/strict';
import { Arguments } from '../helpers/arguments.js';

export const validateArguments = (args: Arguments): Parameters<typeof command> => {
  return [];
};

const command = async () => {
  return 1;
};

export default command;
