import { Arguments } from '../helpers/arguments.js';
import { Refs } from '../helpers/refs.js';

export const validateArguments = (args: Arguments): Parameters<typeof command> => {
  if (args.delete) return [null, args.delete];
  if (args.$1) return [args.$1];
  return [];
};

const command = async (create?: string, del?: string) => {
  if (create) {
    if (await Refs.existsBranch(create)) {
      await Refs.switchToBranch(create);
    } else await Refs.createBranch(create);
    return;
  }

  if (del) {
    await Refs.deleteBranch(del);
    return;
  }

  const currentBranch = await Refs.getCurrentBranch();
  const branches = await Refs.listBranches();
  for (const branch of new Set([currentBranch, ...branches])) {
    const isCurrent = branch === currentBranch;
    console.log(`${isCurrent ? '*' : ' '} ${branch}`);
  }
};

export default command;
