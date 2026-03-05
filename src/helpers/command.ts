import { Arguments } from './arguments.js';

export interface Command<T extends (...args: any[]) => any> {
  validate(args: Arguments): readonly [...Parameters<T>];
  run: T;
}

export function createCommand<T extends (...args: any[]) => any>(cmd: Command<T>): Command<T> {
  return cmd;
}
