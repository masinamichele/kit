export namespace Revision {
  export const toShort = (sha: string) => {
    return sha.slice(0, 7);
  };
}
