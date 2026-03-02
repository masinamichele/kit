import assert from 'node:assert/strict';
import { Arguments } from '../helpers/arguments.js';
import writeTree from './write-tree.command.js';
import { History } from '../helpers/history.js';
import commitTree from './commit-tree.command.js';

export const validateArguments = (args: Arguments): Parameters<typeof command> => {
  assert.ok(args.message);
  return [args.message];
};

const command = async (message: string) => {
  const treeSha = await writeTree();
  const parentSha = await History.getLatestCommit();
  const commitSha = await commitTree(treeSha, message, parentSha);
  await History.setLatestCommit(commitSha);
};

export default command;
