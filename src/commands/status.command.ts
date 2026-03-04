import { Arguments } from '../helpers/arguments.js';
import { Refs } from '../helpers/refs.js';
import { Colors } from '../helpers/colors.js';
import { State } from '../helpers/state.js';

export const validateArguments = (args: Arguments): Parameters<typeof command> => {
  return [];
};

const command = async () => {
  const [headState, indexState, workingState] = await Promise.all([
    State.head(),
    State.index(),
    State.workingDirectory(),
  ]);

  const allPaths = new Set([...headState.keys(), ...indexState.keys(), ...workingState.keys()]);

  const stagedChanges: string[] = [];
  const unstagedChanges: string[] = [];
  const untrackedFiles: string[] = [];

  for (const path of allPaths) {
    const headHash = headState.get(path);
    const indexHash = indexState.get(path);
    const workingHash = workingState.get(path);

    if (!headHash && !indexHash && workingHash) {
      untrackedFiles.push(path);
      continue;
    }

    if (headHash !== indexHash) {
      if (indexHash && !headHash) stagedChanges.push(`new file:   ${path}`);
      else if (!indexHash && headHash) stagedChanges.push(`deleted:    ${path}`);
      else stagedChanges.push(`modified:   ${path}`);
    }

    if (indexHash !== workingHash) {
      if (workingHash && !indexHash) {
        // TODO: handle deletion from index
      } else if (!workingHash && indexHash) unstagedChanges.push(`deleted:    ${path}`);
      else if (workingHash && indexHash) unstagedChanges.push(`modified:   ${path}`);
    }
  }

  const branch = await Refs.getCurrentBranch();
  console.log(`On branch ${branch}`);

  if (stagedChanges.length > 0) {
    console.log('\nChanges to be committed:');
    stagedChanges.forEach((change) => console.log(`        ${Colors.FgGreen}${change}${Colors.Reset}`));
  }

  if (unstagedChanges.length > 0) {
    console.log('\nChanges not staged for commit:');
    unstagedChanges.forEach((change) => console.log(`        ${Colors.FgRed}${change}${Colors.Reset}`));
  }

  if (untrackedFiles.length > 0) {
    console.log('\nUntracked files:');
    untrackedFiles.forEach((file) => console.log(`        ${Colors.FgRed}${file}${Colors.Reset}`));
  }
};

export default command;
