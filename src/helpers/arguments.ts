export type Arguments = { _: any[] } & Record<string, any>;

const shortArgumentsMap: Record<string, string> = { w: 'write', m: 'message', p: 'parent', d: 'delete' };

export class ArgumentParser {
  private constructor() {}

  static parse(argv: string[]) {
    const args: Arguments = new Proxy(
      { _: [] },
      {
        get(target, p: string) {
          const positionalRegex = /^\$(\d+)/;
          if (positionalRegex.test(p)) {
            const [, pos] = positionalRegex.exec(p);
            return target._.at(+pos - 1);
          }
          return (target as any)[p];
        },
      },
    );
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
          i++;
        } else args[key] = true;
      } else {
        args._.push(arg);
      }
    }
    return args;
  }
}
