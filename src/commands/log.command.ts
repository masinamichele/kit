// noinspection JSUnusedGlobalSymbols

import { Arguments } from '../helpers/arguments.js';
import { Refs } from '../helpers/refs.js';
import { KitObject } from '../helpers/kitobject.js';
import { Colors } from '../helpers/colors.js';
import { createCommand } from '../helpers/command.js';

export default createCommand({
  validate(args: Arguments) {
    return [];
  },

  async run() {
    let sha = await Refs.getHead();
    while (sha) {
      const commitContents = await KitObject.read(sha);
      const [headers, message] = commitContents.split('\n\n');

      const [, author, timestamp, tz] = /author (.+?) (\d+?) ([-+]\d{4})/.exec(headers);

      const tzSign = tz.startsWith('-') ? -1 : 1;
      const hourOffset = +tz.slice(1, 3);
      const minuteOffset = +tz.slice(3, 5);
      const offset = tzSign * (hourOffset * 60 + minuteOffset);
      const date = new Date((+timestamp + offset * 60) * 1000);
      const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const weekday = weekdays[date.getUTCDay()];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = months[date.getUTCMonth()];
      const day = date.getUTCDate().toString().padStart(2, ' ');
      const hh = date.getUTCHours().toString().padStart(2, '0');
      const mm = date.getUTCMinutes().toString().padStart(2, '0');
      const ss = date.getUTCSeconds().toString().padStart(2, '0');
      const year = date.getUTCFullYear();
      const parsedDate = `${weekday} ${month} ${day} ${hh}:${mm}:${ss} ${year}`;

      console.log(`${Colors.FgYellow}commit ${sha}${Colors.Reset}`);
      console.log(`Author: ${author}`);
      console.log(`Date:   ${parsedDate} ${tz}`);
      console.log();
      for (const line of message.split(/\r?\n/)) {
        console.log(`    ${line}`);
      }
      console.log();

      if (headers.includes('parent')) {
        const [, parent] = /parent (.+)/.exec(headers);
        sha = parent;
      } else sha = null;
    }
  },
});
