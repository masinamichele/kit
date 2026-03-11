import { AsyncLocalStorage } from 'node:async_hooks';
import { basename } from 'node:path';

type ExecutionContext = { command: string };

const contextStore = new AsyncLocalStorage<ExecutionContext>();

export const withContext = <T>(command: string, fn: () => Promise<T>) => {
  return contextStore.run({ command }, fn);
};

export const isDirectInvocation = (command: string) => {
  return contextStore.getStore().command === basename(command);
};
