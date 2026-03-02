import { Arguments } from '../helpers/arguments.js';
import { Refs } from '../helpers/refs.js';
import { KitObject } from '../helpers/kitobject.js';

export const validateArguments = (args: Arguments): Parameters<typeof command> => {
  return [];
};

const command = async () => {
  let sha = await Refs.getHead();
  while (sha) {
    const rawCommitContents = await KitObject.read(sha);
    const commitContents = rawCommitContents.toString('utf8');
    const [headers, message] = commitContents.split('\n\n');

    const [, author, date, tz] = /author (.+?) (\d+?) ([-+]\d{4})/.exec(headers);
    console.log(`commit ${sha}`);
    console.log(`Author: ${author}`);
    console.log(`Date:   ${new Date(+date * 1000).toLocaleString()} ${tz}`);
    console.log();
    console.group();
    console.log(message);
    console.groupEnd();
    console.log();

    if (headers.includes('parent')) {
      const [, parent] = /parent (.+)/.exec(headers);
      sha = parent;
    } else sha = null;
  }
};

export default command;
