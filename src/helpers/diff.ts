import { Colors } from './colors.js';

export namespace Diff {
  type Operation = { type: 'context'; line: string } | { type: 'delete'; line: string } | { type: 'add'; line: string };

  export const lcs = (linesA: string[], linesB: string[]) => {
    const n = linesA.length;
    const m = linesB.length;
    const dp = Array.from({ length: n + 1 }, () => Array.from({ length: m + 1 }, () => 0));

    for (let i = 1; i <= n; i++) {
      for (let j = 1; j <= m; j++) {
        if (linesA[i - 1] === linesB[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }

    let i = n;
    let j = m;
    const operations: Operation[] = [];

    while (i > 0 && j > 0) {
      if (linesA[i - 1] === linesB[j - 1]) {
        operations.push({ type: 'context', line: linesA[i - 1] });
        i--;
        j--;
      } else if (dp[i - 1][j] >= dp[i][j - 1]) {
        operations.push({ type: 'delete', line: linesA[i - 1] });
        i--;
      } else {
        operations.push({ type: 'add', line: linesB[j - 1] });
        j--;
      }
    }

    while (i > 0) {
      operations.push({ type: 'delete', line: linesA[i - 1] });
      i--;
    }

    while (j > 0) {
      operations.push({ type: 'add', line: linesB[j - 1] });
      j--;
    }

    return operations.reverse();
  };

  export const print = (path: string, contentA: string, contentB: string) => {
    console.log(`${Colors.FgYellow}diff a/${path} b/${path}${Colors.Reset}`);
    console.log(`--- a/${path}`);
    console.log(`+++ b/${path}`);

    const linesA = contentA.split(/\r?\n/);
    const linesB = contentB.split(/\r?\n/);
    const operations = lcs(linesA, linesB);

    for (const operation of operations) {
      if (operation.type === 'delete') {
        console.log(`${Colors.FgRed}-${operation.line}${Colors.Reset}`);
      } else if (operation.type === 'add') {
        console.log(`${Colors.FgGreen}+${operation.line}${Colors.Reset}`);
      } else {
        console.log(` ${operation.line}`);
      }
    }
  };
}
