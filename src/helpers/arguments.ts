export type Arguments = Record<string, any>;

const shortArgumentsMap: Record<string, string> = { w: 'write', m: 'message', p: 'parent' };

export class ArgumentParser {
  private constructor() {}

  static parse(argv: string[]) {
    const args: Arguments = {};
    let positionalCount = 1;
    for (let i = 0; i < argv.length; i++) {
      const arg = argv[i];
      if (arg.startsWith('-')) {
        let key = arg
          .slice(arg.startsWith('--') ? 2 : 1)
          .toLowerCase()
          .replaceAll(/-([a-z])/g, (_, p1) => p1.toUpperCase());
        if (shortArgumentsMap[key]) key = shortArgumentsMap[key];
        const next = argv[i + 1];
        if (next && !next.startsWith('-')) {
          args[key] = next;
        } else args[key] = true;
        i++;
      } else {
        args[`$${positionalCount++}`] = arg;
      }
    }
    return args;
  }
}
